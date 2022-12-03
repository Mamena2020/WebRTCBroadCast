// const host = "http://192.168.1.7"
const host = "http://localhost"
const port = 3000


const configurationPeerConnection = {
    iceServers: [{
        urls: "stun:stun.stunprotocol.org"
            // urls: "stun:stun.l.google.com:19302?transport=tcp"
    }]
}
const offerSdpConstraints = {
    "mandatory": {
        "OfferToReceiveAudio": true,
        "OfferToReceiveVideo": true,
    },
    "optional": [],
}

// "video", { direction: "recvonly" } | recvonly-> recieve only
// "video", { direction: "sendrecv" } | sendrecv-> send only
// {send: bool, receive: bool}
//{ direction: "sendrecv" }
// { direction: "recvonly" }
const addTransceiverConstraints = { direction: "recvonly" }

window.onload = () => {
    showList();
}



var peer
var broadcast_id = ""
var consumer_id = ""
var localCandidates = []
var remoteCandidates = []


async function watch(e) {
    broadcast_id =  e.getAttribute("data");
    await createPeer();
    document.getElementById("text-container").innerHTML = "Streaming on id:" + broadcast_id
}
// -----------------------------------------------------------------------------
async function showList() {
    const data = await axios.get("/list-broadcast");
    var html = `<ul style="list-style-type: none;">`;
    data.data.forEach((e) => {
        console.log(e);
        html += `<li style="margin-top:4px;">
        <button data='` + e + `' id='view-` + e + `'
        onClick="watch(this)"
        >Watch ` + e + `</button>
        </li>`
    });
    html += "</ul>"
    document.getElementById('list-container').innerHTML += html
}

async function createPeer() {



    localCandidates = []
    remoteCandidates = []
    if(peer!=null && peer!=undefined)
    {
        return handleNegotiationNeededEvent(peer)
    }
    
    peer = new RTCPeerConnection(configurationPeerConnection, offerSdpConstraints);

    peer.addTransceiver("video", addTransceiverConstraints)
    peer.addTransceiver("audio", addTransceiverConstraints)
    
    
    peer.ontrack = handleTrackEvent;
    
    
    iceCandidate()

    peer.onnegotiationneeded = async() => await handleNegotiationNeededEvent(peer);


    return peer;
}

async function handleNegotiationNeededEvent(peer) {
    const offer = await peer.createOffer({ 'offerToReceiveVideo': 1 });
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription,
        broadcast_id: broadcast_id,
        socket_id: socket_id
    };
    const { data } = await axios.post('/consumer', payload);
    console.log(data.message)
    consumer_id=  data.data.id
    
    const desc = new RTCSessionDescription(data.data.sdp);

    await peer.setRemoteDescription(desc).catch(e => console.log(e));

    // send local candidate to server
    localCandidates.forEach((e)=>{
        socket.emit("add-candidate-consumer",{
            id: consumer_id,
            candidate: e
        })
    })
    // add remote candidate to local
    remoteCandidates.forEach((e)=>{
        peer.addIceCandidate(new RTCIceCandidate(e))
    })
   
}

function handleTrackEvent(e) {
    console.log(e.streams[0])
    document.getElementById("video").srcObject = e.streams[0];
};

function iceCandidate()
{

    peer.onicecandidate = (e) => {
        if (!e || !e.candidate) return;
        // console.log(e)
        var candidate = {
                'candidate': String(e.candidate.candidate),
                'sdpMid': String(e.candidate.sdpMid),
                'sdpMLineIndex': e.candidate.sdpMLineIndex,
            }
         localCandidates.push(candidate)
    }

    peer.onconnectionstatechange = (e) => {
        console.log("status")
        console.log(e)
    }
    peer.onicecandidateerror = (e) => {

        console.log("error1")
        console.log(e)
    }

    peer.oniceconnectionstatechange = (e) => {
        try {
            const connectionStatus = peer.connectionState;
            if (["disconnected", "failed", "closed"].includes(connectionStatus)) {
                console.log("disconnected")
            } else {
                console.log(" connected")
            }
        } catch (e) {
            console.log(e)
        }
    }
}

// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------

var socket = io(host + ":" + port);
var socket_id

socket.on('from-server', function(_socket_id) {
    socket_id = _socket_id
    console.log("me connected: " + socket_id)
});
socket.on("candidate-from-server", (data) => {
        remoteCandidates.push(data)
})

