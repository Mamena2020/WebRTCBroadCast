// const host = "http://192.168.1.8"
const host = "http://localhost"
const port = 3000

const configurationPeerConnection = {
    iceServers: [{
        urls: "stun:stun.stunprotocol.org"
    }]
}


const offerSdpConstraints = {
    "mandatory": {
        "OfferToReceiveAudio": true,
        "OfferToReceiveVideo": true,
    },
    "optional": [],
}

const mediaConstraints = {
    video: true,
    audio: false
}

var broadcast_id
var localCandidates = []
var remoteCandidates = []

window.onload = () => {
    document.getElementById('my-button').onclick = () => {
        init();
    }
}

var peer
async function init() {

    const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    document.getElementById("video").srcObject = stream;
    peer = await createPeer();
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
}


async function createPeer() {


    peer = new RTCPeerConnection(configurationPeerConnection, offerSdpConstraints);
    localCandidates = []
    remoteCandidates = []
    iceCandidate()
    peer.onnegotiationneeded = async() => await handleNegotiationNeededEvent(peer);
    return peer;
}

async function handleNegotiationNeededEvent(peer) {
    const offer = await peer.createOffer({ 'offerToReceiveVideo': 1 });
    await peer.setLocalDescription(offer);



    const payload = {
        sdp: peer.localDescription,
        socket_id: socket_id
    };


    console.log("Send socket id: " + socket_id)

    const { data } = await axios.post('/broadcast', payload);
    console.log(data.message)
    const desc = new RTCSessionDescription(data.data.sdp);
    broadcast_id = data.data.id
    document.getElementById("text-container").innerHTML = "Streaming id: " +broadcast_id;
    await peer.setRemoteDescription(desc).catch(e => console.log(e));
    // add local candidate to server
    localCandidates.forEach((e)=>{
        socket.emit("add-candidate-broadcast",{
            id: broadcast_id,
            candidate: e
        })
    })
    // add remote candidate to local
    remoteCandidates.forEach((e)=>{
        peer.addIceCandidate(new RTCIceCandidate(e))
    })

}

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


var socket = io(host + ":" + port);
var socket_id

socket.on('from-server', function(_socket_id) {
    socket_id = _socket_id
    console.log("me connected: " + socket_id)
});

socket.on("candidate-from-server", (data) => {
    remoteCandidates.push(data)
})
