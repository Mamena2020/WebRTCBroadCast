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
window.onload = () => {
    showList();
}

class TargetPeer {
    constructor(_broadcast_id = null, _consumer_id = null) {
        this.broadcast_id = _broadcast_id
        this.consumer_id = _consumer_id
    }
}
var targetPeer = new TargetPeer();


async function init(id) {
    console.log("start");
    const peer = await createPeer(id);


}

async function createPeer(id) {
    const peer = new RTCPeerConnection(configurationPeerConnection, offerSdpConstraints);
    peer.addTransceiver("video", { direction: "recvonly" })
    peer.ontrack = handleTrackEvent;
    peer.onnegotiationneeded = async() => await handleNegotiationNeededEvent(peer, id);


    return peer;
}

async function handleNegotiationNeededEvent(peer, id) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription,
        id: id
    };
    const { data } = await axios.post('/consumer', payload);
    targetPeer = new TargetPeer(
        data.targetPeer.broadcast_id,
        data.targetPeer.consumer_id
    );
    console.log("targetPeer");
    console.log(targetPeer);
    const desc = new RTCSessionDescription(data.sdp);
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

function handleTrackEvent(e) {
    console.log(e.streams[0])
    document.getElementById("video").srcObject = e.streams[0];
};

// -----------------------------------------------------------------------------
function watch(e) {
    var id = e.getAttribute("data");
    init(id)
    document.getElementById("text-container").innerHTML = "Streaming on id:" + id
}
// -----------------------------------------------------------------------------
async function showList() {
    const data = await axios.get("/list");
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
// -----------------------------------------------------------------------------
const host = "http://192.168.1.9"
const port = 5000

var socket = io(host + ":" + port);
socket.on('from-server', function(message) {
    console.log(message)
        // document.body.appendChild(
        //     document.createTextNode(message.greeting)
        // );
    socket.emit('greeting-from-client', {
        greeting: 'Hello Server'
    });
});

function addCandidate(candidate) {
    socket.emit('add-candidate-consumer', {
        candidate: candidate,
        targetPeer: targetPeer
    });
}