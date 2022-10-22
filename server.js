const host = "192.168.1.9";
// const host = "localhost";
const port = "5000";


const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const webrtc = require("wrtc");
const { MediaStream } = require('wrtc');
const { v4: uuidv4 } = require('uuid');

class Broadcaster {
    constructor(_id = null, _stream = new MediaStream(), _peer = new webrtc.RTCPeerConnection()) {
        this.id = _id
        this.stream = _stream
        this.peer = _peer
    }
}

class Consumer {
    constructor(_id = null, _broadcast_id = null, _peer = new webrtc.RTCPeerConnection()) {
        this.id = _id
        this.broadcast_id = _broadcast_id
        this.peer = _peer
    }
}


const broadcasters = [];

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ------------------------------------------------------------------------------------------------- broadcasters
app.post('/broadcast', async({ body }, res) => {
    console.log("new broadcast");
    var id = uuidv4()
    var broadcast = new Broadcaster(
        id,
        new MediaStream(),
        new webrtc.RTCPeerConnection({
            iceServers: [{
                // urls: "stun:stun.stunprotocol.org"
                urls: "stun:stun.l.google.com:19302?transport=tcp"
            }]
        })
    );
    // broadcast.peer.ontrack = (e) => handleTrackEvent(e, broadcast);
    //    broadcast.peer.ontrack = (e) => broadcast.stream = e.streams[0];
    //     const desc = new webrtc.RTCSessionDescription(body.sdp);
    //     await broadcast.peer.setRemoteDescription(desc);
    //     const answer = await broadcast.peer.createAnswer();
    //     await broadcast.peer.setLocalDescription(answer);
    //     const payload = {
    //         sdp: broadcast.peer.localDescription
    //     }
    //     broadcasters.push(broadcast);
    await broadcasters.push(broadcast);
    // let i = await broadcasters.findIndex((e) => e.id == body.id)
    let i = await broadcastIndex(id)
    if (i >= 0) {
        broadcasters[i].peer.ontrack = (e) => broadcasters[i].stream = e.streams[0];
        const desc = new webrtc.RTCSessionDescription(body.sdp);
        await broadcasters[i].peer.setRemoteDescription(desc);
        const answer = await broadcasters[i].peer.createAnswer();
        await broadcasters[i].peer.setLocalDescription(answer);
        const payload = {
            sdp: broadcasters[i].peer.localDescription,
            id: id
        }
        res.json(payload);
    }
});

async function broadcastIndex(id) {
    let x = -1;
    for (let i = 0; i < broadcasters.length; i++) {
        if (broadcasters[i].id == id) {
            x = i;
            break;
        }
    }
    return x;
}

// function handleTrackEvent(e, broadcast) {
//     try {
//         broadcast.stream = e.streams[0];
//     } catch (e) {

//     }
// };

var consumers = [];
// ------------------------------------------------------------------------------------------------- consumer
app.post("/consumer", async({ body }, res) => {
    console.log("consumer");
    // let i = await broadcastIndex(body.id)
    // var peer = new webrtc.RTCPeerConnection({
    //     iceServers: [{
    //         // urls: "stun:stun.stunprotocol.org"
    //         urls: "stun:stun.l.google.com:19302?transport=tcp"
    //     }]
    // });
    // var desc = new webrtc.RTCSessionDescription(body.sdp);
    // await peer.setRemoteDescription(desc);
    // try {
    //     if (i >= 0) {
    //         console.log("broadcast exist" + broadcasters[i].id)
    //         console.log(broadcasters[i].stream)
    //         broadcasters[i].stream.getTracks().forEach(track => peer.addTrack(track, broadcasters[i].stream));
    //     }
    // } catch (e) {
    //     console.log(e)
    // }
    // const answer = await peer.createAnswer();
    // await peer.setLocalDescription(answer);
    // const payload = {
    //     sdp: peer.localDescription
    // }
    let i = await broadcastIndex(body.id)
    var id = uuidv4()
    var consumer = new Consumer(
        id,
        body.id,
        new webrtc.RTCPeerConnection({
            iceServers: [{
                // urls: "stun:stun.stunprotocol.org"
                urls: "stun:stun.l.google.com:19302?transport=tcp"
            }]
        })
    )
    consumers.push(consumer);
    let x = await consumerIndex(id)
    if (x >= 0 && i >= 0) {
        var desc = new webrtc.RTCSessionDescription(body.sdp);
        await consumers[x].peer.setRemoteDescription(desc);
        try {
            // console.log("broadcast exist" + broadcasters[i].id)
            console.log(broadcasters[i].stream)
            broadcasters[i].stream.getTracks().forEach(track => consumers[x].peer.addTrack(track, broadcasters[i].stream));

        } catch (e) {
            console.log(e)
        }
        const answer = await consumers[x].peer.createAnswer();
        await consumers[x].peer.setLocalDescription(answer);
        const payload = {
            sdp: consumers[x].peer.localDescription
        }
        res.json(payload);
    }
    console.log("not exist")

});
async function consumerIndex(id) {
    let x = -1;
    for (let i = 0; i < consumers.length; i++) {
        if (consumers[i].id == id) {
            x = i;
            break;
        }
    }
    return x;
}
// async function consumerRemove(id) {
//     let x = -1;
//     for (let i = 0; i < consumers.length; i++) {
//         if (consumers[i].id == id) {
//             x = i;
//             break;
//         }
//     }

//     if (x >= 0) {
//         console.log("remove ")
//         consumers.splice(x, 1);
//     }

// }

// -------------------------------------------------------------------------------------------------
app.get("/list", (req, res) => {
    const data = listBroadCast();
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
    () => console.log('server started: ' + host + ":" + port));