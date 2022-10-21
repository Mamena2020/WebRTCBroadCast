window.onload = () => {
    // document.getElementById('my-button').onclick = () => {
    //     init();
    // }

    showList();
}

async function init(id) {
    console.log("start");
    const peer = createPeer(id);
    peer.addTransceiver("video", { direction: "recvonly" })
}

function createPeer(id) {
    const peer = new RTCPeerConnection({
        iceServers: [{
            urls: "stun:stun.stunprotocol.org"
        }]
    });
    peer.ontrack = handleTrackEvent;
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

    const { data } = await axios.post('/consumer', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
}

function handleTrackEvent(e) {
    console.log(e.streams[0])
    document.getElementById("video").srcObject = e.streams[0];
};

// -----------------------------------------------------------------------------
function view(id) {
    init(id)
}
// -----------------------------------------------------------------------------
async function showList() {
    const data = await axios.get("/list");
    // console.log(data.data);
    var html = `<ul style="list-style-type: none;">`;
    data.data.forEach((e) => {
        console.log(e);
        html += `<li style="margin-top:4px;">
        <button id='view-` + e + `'
        onClick="view(` + e + `)"
        >Watch ` + e + `</button>
        </li>`

    });
    html += "</ul>"


    document.getElementById('list-container').innerHTML += html
}
// -----------------------------------------------------------------------------