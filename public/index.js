window.onload = () => {
    document.getElementById('my-button').onclick = () => {
        init();
    }
}

async function init() {

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById("video").srcObject = stream;


    const peer = await createPeer();
    if (peer.connectionState == RTCPeerConnection.connectionState) {
        console.log("s")
    } else {

        console.log("n")
    }
    console.log(peer.connectionState)
        // peer.onicecandidateerror = (e) => {

    //         console.log("error1")
    //         console.log(e)
    //     }
    // peer.onnegotiationneeded = (e) => {
    //     console.log("error2")
    //     console.log(e)
    // }
    console.log(peer.currentRemoteDescription)
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
}


async function createPeer() {


    const peer = new RTCPeerConnection({
        iceServers: [{
            urls: "stun:stun.stunprotocol.org"
                // urls: "stun:stun.l.google.com:19302?transport=tcp"
        }]
    }, {
        "mandatory": {
            "OfferToReceiveAudio": true,
            "OfferToReceiveVideo": true,
        },
        "optional": [],
    });
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