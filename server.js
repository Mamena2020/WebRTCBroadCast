const host = "192.168.1.9";
// const host = "localhost";
const port = "5000";


const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const webrtc = require("wrtc");
const { MediaStream } = require('wrtc');

class Broadcaster {
    constructor(_id = null, _stream = new MediaStream(), _peer = new webrtc.RTCPeerConnection()) {
        this.id = _id
        this.stream = _stream
        this.peer = _peer
    }
}

// let mediaStreams;

var broadcasters = [];

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ------------------------------------------------------------------------------------------------- broadcasters
app.post('/broadcast', async({ body }, res) => {
    console.log("new broadcast");
    var broadcast = new Broadcaster(
        body.id,
        new MediaStream(),
        new webrtc.RTCPeerConnection({
            iceServers: [{
                urls: "stun:stun.stunprotocol.org"
            }]
        })
    );
    // let i = broadcasters.findIndex((e) => e.id == body.id);
    // if (i >= 0) {
    // }
    broadcast.peer.ontrack = (e) => handleTrackEvent(e, broadcast);
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await broadcast.peer.setRemoteDescription(desc);
    const answer = await broadcast.peer.createAnswer();
    await broadcast.peer.setLocalDescription(answer);
    const payload = {
        sdp: broadcast.peer.localDescription
    }

    broadcasters.push(broadcast);
    res.json(payload);
});

function handleTrackEvent(e, broadcast) {

    broadcast.stream = e.streams[0];
    // mediaStreams = e.streams[0];

    // console.log(broadcasters[i].stream);

};

// ------------------------------------------------------------------------------------------------- consumer
app.post("/consumer", async({ body }, res) => {
    console.log("consumer");
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [{
            urls: "stun:stun.stunprotocol.org"
        }]
    });
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);

    // mediaStreams.getTracks().forEach(track => peer.addTrack(track, mediaStreams));
    let i = broadcasters.findIndex((e) => e.id == body.id)
        // let mediaStreams;
        // if (i >= 0) {
    console.log("broadcast exist" + broadcasters[i].id)
        // const _mediaStreams = mediaStreams;
        // broadcasters[i].stream.getTracks().forEach(track => peer.addTrack(track, broadcasters[i].stream));
        // }
        // _mediaStreams.getTracks().forEach(track => peer.addTrack(track, _mediaStreams));
    broadcasters[i].stream.getTracks().forEach(track => peer.addTrack(track, broadcasters[i].stream));

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }

    res.json(payload);
});
// -------------------------------------------------------------------------------------------------
app.get("/list", (req, res) => {
    const data = listBroadCast();
    // res.setHeader('Content-Type', 'application/json');
    // res.end(JSON.stringify({ list: data }));
    res.json(data);
})


function listBroadCast() {
    var data = [];
    for (i in broadcasters) {
        data.push(broadcasters[i].id)
    }
    return data;
}

// -------------------------------------------------------------------------------------------------
app.listen(port,
    host,
    () => console.log('server started'));