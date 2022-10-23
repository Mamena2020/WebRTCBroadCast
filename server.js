const host = "192.168.1.9"
    // const host = "localhost";
const port = "5000"


const express = require('express')
const app = express()

const bodyParser = require('body-parser')
const webrtc = require("wrtc")
const { MediaStream } = require('wrtc')
const { v4: uuidv4 } = require('uuid')
const sdpTransform = require('sdp-transform')

const http = require('http')
const server = http.Server(app);

const socketIO = require('socket.io')
const io = socketIO(server);


// const stuntUrl ="stun:stun.l.google.com:19302?transport=tcp"
// {
//     iceServers: [{
//         // urls: "stun:stun.stunprotocol.org"
//         urls: stuntUrl
//     }]
// },

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

class Broadcaster {
    constructor(_id = null, _stream = new MediaStream(), _peer = new webrtc.RTCPeerConnection(),
        _consumers = []
    ) {
        this.id = _id
        this.stream = _stream
        this.peer = _peer
        this.consumers = _consumers
    }
}

class Consumer {
    constructor(_id = null, _peer = new webrtc.RTCPeerConnection()) {
        this.id = _id
        this.peer = _peer
    }
}
class TargetPeer {
    constructor(_broadcast_id = null, _consumer_id = null) {
        this.broadcast_id = _broadcast_id
        this.consumer_id = _consumer_id
    }
}


const broadcasters = [];

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ------------------------------------------------------------------------------------------------- broadcasters
app.post('/broadcast', async({ body }, res) => {
    try {
        var id = uuidv4()
        await addBroadcast(id)
        let i = await broadcastIndex(id)
        if (i >= 0) {
            broadcasters[i].peer.ontrack = (e) => broadcasters[i].stream = e.streams[0];
            broadcasters[i].peer.oniceconnectionstatechange = (e) => {
                try {
                    const connectionStatus = broadcasters[i].peer.connectionState;
                    if (["disconnected", "failed", "closed"].includes(connectionStatus)) {
                        removeBroadcast(broadcasters[i].id)
                    }
                } catch (e) {
                    console.log(e)
                }
            }
            await broadcastOnnegotiationneeded(i, body.sdp)
            const payload = {
                sdp: broadcasters[i].peer.localDescription,
                id: id
            }
            res.json(payload);
        }
    } catch (e) {

    }
});

async function addBroadcast(id) {
    console.log("new broadcast");

    var broadcast = new Broadcaster(
        id,
        new MediaStream(),
        new webrtc.RTCPeerConnection(configurationPeerConnection, offerSdpConstraints)
    );
    await broadcasters.push(broadcast);
}

async function broadcastOnnegotiationneeded(i, sdp) {
    try {
        const desc = new webrtc.RTCSessionDescription(sdp);
        await broadcasters[i].peer.setRemoteDescription(desc);
        const answer = await broadcasters[i].peer.createAnswer({ 'offerToReceiveVideo': 1 });
        await broadcasters[i].peer.setLocalDescription(answer);
        const session = sdpTransform.parse(String(answer.sdp))
            // console.log("answer sdp")
            // console.log(answer.sdp)
            // console.log("session")
            // console.log(session)
            // console.log("session encode")
            // console.log(JSON.stringify(session))
            // var d = new webrtc.RTCPeerConnection(configurationPeerConnection, offerSdpConstraints)
            // webrtc.RTCIceCandidate()
    } catch (e) {
        console.log(e)
    }
}


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

async function removeBroadcast(id) {
    let i = await broadcastIndex(id)
    if (i >= 0) {
        broadcasters.splice(i, 1)
    }
}


// ------------------------------------------------------------------------------------------------- consumer
app.post("/consumer", async({ body }, res) => {
    console.log("consumer");

    try {

        let i = await broadcastIndex(body.id)
        let x
        if (i >= 0) {
            x = await addConsumer(i)
        }
        if (x >= 0 && i >= 0) {
            consumerInList(i)
            await consumerOnnegotiationneeded(i, x, body.sdp)
            broadcasters[i].consumers[x].peer.oniceconnectionstatechange = (e) => {
                try {
                    if (broadcasters[i].consumers[x] != null) {
                        const connectionStatus = broadcasters[i].consumers[x].peer.connectionState;
                        if (["disconnected", "failed", "closed"].includes(connectionStatus)) {
                            removeConsumer(i, broadcasters[i].consumers[x].id)
                        }
                    }
                } catch (e) {
                    console.log(e)
                }
            }

            // broadcasters[i].consumers[x].peer.onicecandidate = (e) => {
            //     if (!e || !e.candidate) return;
            //     // console.log(e)
            //     var newCandidate = {
            //         'candidate': String(e.candidate.candidate),
            //         'sdpMid': String(e.candidate.sdpMid),
            //         'sdpMLineIndex': e.candidate.sdpMLineIndex,
            //     }
            //     console.log("ice candidate")
            //     console.log(newCandidate)
            //     // addCandidateToClient(newCandidate)
            // }
            const payload = {
                sdp: broadcasters[i].consumers[x].peer.localDescription,
                targetPeer: new TargetPeer(
                    broadcasters[i].id,
                    broadcasters[i].consumers[x].id
                )
            }

            res.json(payload);
        } else {
            console.log("not exist")
        }
    } catch (e) {
        console.log(e)
    }

});

async function consumerOnnegotiationneeded(i, x, sdp) {
    try {
        var desc = new webrtc.RTCSessionDescription(sdp);
        await broadcasters[i].consumers[x].peer.setRemoteDescription(desc);
        broadcasters[i].stream.getTracks().forEach(track => broadcasters[i].consumers[x].peer.addTrack(track, broadcasters[i].stream));
        const answer = await broadcasters[i].consumers[x].peer.createAnswer({ 'offerToReceiveVideo': 1 });
        await broadcasters[i].consumers[x].peer.setLocalDescription(answer);
    } catch (e) {
        console.log(e)
    }
    // const session = sdpTransform.parse(String(answer.sdp))
    // console.log(session)
}

async function addConsumer(indexBroadcast) {
    var id = uuidv4()
    var consumer = new Consumer(id, new webrtc.RTCPeerConnection(configurationPeerConnection, offerSdpConstraints))
    consumer.peer.oniceconnectionstatechange

    if (consumer.peer != undefined || consumer.peer != "undefined" || consumer.peer != null) {
        await broadcasters[indexBroadcast].consumers.push(consumer);
        return await consumerIndex(indexBroadcast, id)
    }
    return -1;
}
async function removeConsumer(indexBroadcast, id) {
    try {
        console.log("disconnected");
        console.log("remove consumer: " + id)
        let x = await consumerIndex(indexBroadcast, id)
        if (x >= 0) {
            await broadcasters[indexBroadcast].consumers.splice(x, 1)
        }
    } catch (e) {
        console.log(e)
    }
}

async function consumerIndex(indexBroadcast, id) {
    let x = -1;
    for (let i = 0; i < broadcasters[indexBroadcast].consumers.length; i++) {
        if (broadcasters[indexBroadcast].consumers[i].id == id) {
            x = i;
            break;
        }
    }
    return x;
}
async function consumerInList(indexBroadcast) {
    console.log("------------------------ consumer list in this streaming")
    broadcasters[indexBroadcast].consumers.forEach((e) => {
        console.log(e.id)
    })
    console.log("--------------------------------------------------------")
}

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
server.listen(port,
    host,
    () => console.log('server started: ' + host + ":" + port));
// ------------------------------------------------------------------------------------------------- socket
io.on('connection', async function(socket) {

        console.log("new connection")

        socket.emit("from-server", "halo new consumer")
            // socket.on('test', () => {
            //     console.log("testss")
            // })

        socket.on('add-candidate-consumer', (data) => {
            addCandidateConsumer(data)
        })
        socket.on('add-candidate-broadcaster', (data) => {
            addCandidateBroadcaster(data)
        })


        io.on('disconnect', socket => {
            console.log("someone disconnected")
        })
    })
    // -------------------------------------------------------------------------------------------------

async function addCandidateConsumer(data) {
    console.log("add candidate")
    console.log(data)
    let i = await broadcastIndex(data.targetPeer.broadcast_id)
    if (i >= 0) {
        let x = await consumerIndex(i, data.targetPeer.consumer_id)
        if (x >= 0) {
            try {
                console.log("-------------add candidate exist")
                broadcasters[i].consumers[x].peer.addIceCandidate(new webrtc.RTCIceCandidate(data.candidate))
            } catch (e) {
                console.log(e)
            }
        }
    }
}
async function addCandidateBroadcaster(data) {
    console.log("add candidate")
    console.log(data)
    let i = await broadcastIndex(data.broadcast_id)
    if (i >= 0) {
        try {
            console.log("-------------add candidate exist")
            broadcasters[i].peer.addIceCandidate(new webrtc.RTCIceCandidate(data.candidate))
        } catch (e) {
            console.log(e)
        }
    }
}