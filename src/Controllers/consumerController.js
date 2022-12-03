const consumerService = require("../Services/consumerService")
const {consumers }= require("../Data/data")

async function add({ body }, res) {

    var data = {
        "message": "failed",
        "data":{}
    }

    var id  = await consumerService.addConsumer(body.socket_id,body.broadcast_id, body.sdp)

    if(id!=null)
    {
        data = {
            "message": "success",
            "data":{
                "sdp": consumers[id].peer.localDescription,
                "id": id
            }
        }
    }

    res.json(data);
}

module.exports={
    add
}