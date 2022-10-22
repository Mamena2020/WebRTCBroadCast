window.onload = () => {
    document.getElementById('my-button').onclick = () => {
        init();
    }
}

async function init() {
    // const id = Math.floor(Math.random() * 100);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById("video").srcObject = stream;


    const peer = await createPeer();
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
}


function createPeer() {
    const peer = new RTCPeerConnection({
        iceServers: [{
            // urls: "stun:stun.stunprotocol.org"
            urls: "stun:stun.l.google.com:19302?transport=tcp"
        }]
    });
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);

    return peer;
}

async function handleNegotiationNeededEvent(peer) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription,
    };

    const { data } = await axios.post('/broadcast', payload);
    const desc = new RTCSessionDescription(data.sdp);
    document.getElementById("text-container").innerHTML = "Streaming id: " + data.id;
    peer.setRemoteDescription(desc).catch(e => console.log(e));
}