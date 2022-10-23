// const stuntUrl = "stun:stun.l.google.com:19302"
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

var broadcast_id

window.onload = () => {
    document.getElementById('my-button').onclick = () => {
        init();
    }
}

var peer
async function init() {

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById("video").srcObject = stream;


    peer = await createPeer();


    stream.getTracks().forEach(track => peer.addTrack(track, stream));
}


async function createPeer() {


    peer = new RTCPeerConnection(configurationPeerConnection, offerSdpConstraints);
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
    const desc = new RTCSessionDescription(data.sdp);
    broadcast_id = data.id
    document.getElementById("text-container").innerHTML = "Streaming id: " + data.id;
    await peer.setRemoteDescription(desc).catch(e => console.log(e));


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
                console.log("still connected")
            }
        } catch (e) {
            console.log(e)
        }
    }

    peer.onicecandidate = (e) => {
        if (!e || !e.candidate) return;
        // console.log(e)
        var newCandidate = {
            'candidate': String(e.candidate.candidate),
            'sdpMid': String(e.candidate.sdpMid),
            'sdpMLineIndex': e.candidate.sdpMLineIndex,
        }
        console.log("ice candidate")
        console.log(newCandidate)
        addCandidate(newCandidate)
        console.log("ice candidate2")
        peer.addIceCandidate(new RTCIceCandidate(newCandidate))
    }
}

// -----------------------------------------------------------------------------
const host = "http://192.168.1.9"
const port = 5000

var socket = io(host + ":" + port);
var socket_id

socket.on('from-server', function(_socket_id) {
    socket_id = _socket_id
    console.log("me connected: " + socket_id)
});

socket.on("add-candidate-from-server", (message) => {
    console.log("******add candidate from server")
    console.log(message)
    peer.addIceCandidate(new RTCIceCandidate(message))
    console.log("@@@@@@add candidate from server")
})

function addCandidate(candidate) {
    socket.emit('add-candidate-broadcaster', {
        candidate: candidate,
        broadcast_id: broadcast_id
    });
}