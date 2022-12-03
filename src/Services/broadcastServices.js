const webrtc = require("wrtc")
const { MediaStream } = require('wrtc')
const { v4: uuidv4 } = require('uuid')
const config = require("../config")
const {broadcasters} = require("../Data/data")
const socketFunction = require("../Socket/socketFunction")

class Broadcaster {
    constructor(
        _id = null,
        _stream = new MediaStream(),
        _peer = new webrtc.RTCPeerConnection(),
        _socket_id
    ) {
        this.id = _id
        this.stream = _stream
        this.peer = _peer
        this.socket_id = _socket_id
    }
}


async function addBroadcast(socket_id,sdp) {
    console.log("new broadcast");
    var id = uuidv4()
    var broadcast = new Broadcaster(
        id,
        new MediaStream(),
        new webrtc.RTCPeerConnection(config.configurationPeerConnection, config.offerSdpConstraints), 
        socket_id
    );
   
     broadcasters[id] = broadcast
     
     broadcastMediaProcess(id)

     broadcastConnectionState(id)

     broadcastOnIceCandidate(id)


     await broadcastSdpProcess(id,sdp)

     return id
}

async function broadcastMediaProcess(id)
{
    try{
        broadcasters[id].peer.ontrack = (e) => broadcasters[id].stream = e.streams[0];
    }catch(e)
    {
        console.log(e)
    }
}
 async function broadcastConnectionState(id)
 {
    broadcasters[id].peer.oniceconnectionstatechange = (e) => {
        try {
            if (broadcasters[id]!=null) {
                const connectionStatus2 = broadcasters[id].peer.iceConnectionState;
                if (["disconnected", "failed", "closed"].includes(connectionStatus2)) {
                    console.log("\x1b[31m", "Broadcaster: " + id + " - " + connectionStatus2, "\x1b[0m")
                    removeBroadcast(id)
                }
                if (["connected"].includes(connectionStatus2)) {
                    console.log("\x1b[34m", "Broadcaster: " + id + " - " + connectionStatus2, "\x1b[0m")
                }
            }
        } catch (e) {
            console.log(e)
        }
    }
 }

async function broadcastOnIceCandidate(id)
{
    try {
    broadcasters[id].peer.onicecandidate = (e) => {
        if (!e || !e.candidate) return;
            var candidate = {
                'candidate': String(e.candidate.candidate),
                'sdpMid': String(e.candidate.sdpMid),
                'sdpMLineIndex': e.candidate.sdpMLineIndex,
            }
            // console.log(candidate)
            socketFunction.sendCandidateToClient( broadcasters[id].socket_id,candidate,)
        }
    } catch (e) {
        console.log(e)
    }
}
 

async function broadcastSdpProcess(id, sdp) {
    try {
        const desc = new webrtc.RTCSessionDescription(sdp);
        await broadcasters[id].peer.setRemoteDescription(desc);
        const answer = await broadcasters[id].peer.createAnswer({ 'offerToReceiveVideo': 1 });
        await broadcasters[id].peer.setLocalDescription(answer);
    } catch (e) {
        console.log(e)
    }
}


async function addCandidateFromClient(data)
{
    if(broadcasters[data["id"]]!=null)
    {
        broadcasters[data["id"]].peer.addIceCandidate(new webrtc.RTCIceCandidate(data["candidate"]))
    }
}


async function removeBroadcast(id)
{
    if(broadcasters[id]!=null)
    {
        console.log("\x1b[31m", "remove broadcaster: "+id, "\x1b[0m")
        broadcasters[id].peer.close()
        delete broadcasters[id]
    }
}

function fetch()
{
    var data= []
    for (var bs in broadcasters) {
        data.push(bs)
    }
    return data
}

module.exports = {
    addBroadcast,
    addCandidateFromClient,
    fetch
}