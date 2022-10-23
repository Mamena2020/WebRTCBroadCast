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

async function init(id) {
    console.log("start");
    const peer = await createPeer(id);
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
    const desc = new RTCSessionDescription(data.sdp);
    await peer.setRemoteDescription(desc).catch(e => console.log(e));
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