const broadcastService = require("../Services/broadcastServices")
const {broadcasters }= require("../Data/data")

async function add({ body }, res) {

    var data = {
        "message": "failed",
        "data":{}
    }

    var id  = await broadcastService.addBroadcast(body.socket_id,body.sdp)

    if(id!=null)
    {
        data = {
            "message": "success",
            "data":{
                "sdp": broadcasters[id].peer.localDescription,
                "id": id
            }
        }
    }

    res.json(data);
}


async function fetch(req,res){
    var data = await broadcastService.fetch()
    res.json(data);
}


module.exports={
    add,
    fetch
}