const webrtc = require("wrtc")
const { v4: uuidv4 } = require('uuid')
const config = require("../config")
const {broadcasters,consumers} = require("../Data/data")
const socketFunction = require("../Socket/socketFunction")

class Consumer {
    constructor(_id = null, _peer = new webrtc.RTCPeerConnection(), _socket_id = null, broadcast_id=null) {
        this.id = _id
        this.peer = _peer
        this.socket_id = _socket_id,
        this.broadcast_id = broadcast_id
    }
}

async function addConsumer(socket_id,broadcast_id, sdp) {
    var id = uuidv4()
    var consumer = new Consumer(id, new webrtc.RTCPeerConnection(config.configurationPeerConnection, config.offerSdpConstraints), socket_id,broadcast_id)
    
    consumers[id] = consumer
    
    consumerOnIceCandidate(id)

    consumerConnectionState(id)

    await sdpProcess(id,broadcast_id,sdp)

    return id
}

async function sdpProcess(id,broadcast_id, sdp) {
    try {
        var desc = new webrtc.RTCSessionDescription(sdp);
        await consumers[id].peer.setRemoteDescription(desc);

        broadcasters[broadcast_id].stream.getTracks().forEach(track =>
             consumers[id].peer.addTrack(track, broadcasters[broadcast_id].stream)
        );
       
        const answer = await consumers[id].peer.createAnswer({ 'offerToReceiveVideo': 1 });
        await consumers[id].peer.setLocalDescription(answer);
    } catch (e) {
        console.log(e)
    }
}

async function consumerConnectionState(id)
{
   consumers[id].peer.oniceconnectionstatechange = (e) => {
       try {
           if (consumers[id]!=null) {
               const connectionStatus2 = consumers[id].peer.iceConnectionState;
               if (["disconnected", "failed", "closed"].includes(connectionStatus2)) {
                   console.log("\x1b[31m", "Consumer: " + id + " - " + connectionStatus2, "\x1b[0m")
                   removeConsumer(id)
               }
               if (["connected"].includes(connectionStatus2)) {
                   console.log("\x1b[34m", "Consumer: " + id + " - " + connectionStatus2, "\x1b[0m")
               }
           }
       } catch (e) {
           console.log(e)
       }
   }
}

async function consumerOnIceCandidate(id)
{
    try {
    consumers[id].peer.onicecandidate = (e) => {
        if (!e || !e.candidate) return;
            var candidate = {
                'candidate': String(e.candidate.candidate),
                'sdpMid': String(e.candidate.sdpMid),
                'sdpMLineIndex': e.candidate.sdpMLineIndex,
            }
            // console.log(candidate)
            socketFunction.sendCandidateToClient( consumers[id].socket_id,candidate)
        }
    } catch (e) {
        console.log(e)
    }
}
async function addCandidateFromClient(data)
{
    if(consumers[data["id"]]!=null)
    {
        consumers[data["id"]].peer.addIceCandidate(new webrtc.RTCIceCandidate(data["candidate"]))
    }
}


async function removeConsumer(id)
{
    if(consumers[id]!=null)
    {
        console.log("\x1b[31m", "remove consumer: "+id, "\x1b[0m")
        consumers[id].peer.close()
        delete consumers[id]
    }
}

module.exports = {
    addConsumer,
    addCandidateFromClient
}