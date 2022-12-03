const configurationPeerConnection = {
    iceServers: [{
        urls: "stun:stun.stunprotocol.org"
    }]
}

const offerSdpConstraints = {
    "mandatory": {
        "OfferToReceiveAudio": true,
        "OfferToReceiveVideo": true,
    },
    "optional": [],
}

module.exports = {
    configurationPeerConnection,
    offerSdpConstraints
}