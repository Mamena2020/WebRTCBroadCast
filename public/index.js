window.onload = () => {
    document.getElementById('my-button').onclick = () => {
        init();
    }
}

async function init() {
    const id = Math.floor(Math.random() * 100);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById("video").srcObject = stream;
    document.getElementById("text-container").innerHTML = "Streaming id: " + id;

    const peer = await createPeer(id);
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
}


function createPeer(id) {
    const peer = new RTCPeerConnection({
        iceServers: [{
            // urls: "stun:stun.stunprotocol.org"
            urls: "stun:stun.l.google.com:19302?transport=tcp"
        }]
    });
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer, id);

    return peer;
}

async function handleNegotiationNeededEvent(peer, id) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription,
        id: id
    };

    const { data } = await axios.post('/broadcast', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
}