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

window.onload = () => {
    document.getElementById('my-button').onclick = () => {
        init();
    }
}

async function init() {

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById("video").srcObject = stream;


    const peer = await createPeer();
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

    stream.getTracks().forEach(track => peer.addTrack(track, stream));
}


async function createPeer() {


    const peer = new RTCPeerConnection(configurationPeerConnection, offerSdpConstraints);
    peer.onnegotiationneeded = async() => await handleNegotiationNeededEvent(peer);

    return peer;
}

async function handleNegotiationNeededEvent(peer) {
    const offer = await peer.createOffer({ 'offerToReceiveVideo': 1 });
    await peer.setLocalDescription(offer);



    const payload = {
        sdp: peer.localDescription,
    };

    const { data } = await axios.post('/broadcast', payload);
    const desc = new RTCSessionDescription(data.sdp);
    document.getElementById("text-container").innerHTML = "Streaming id: " + data.id;
    await peer.setRemoteDescription(desc).catch(e => console.log(e));
}