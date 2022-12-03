const broadcastController = require("../Controllers/broadcastController")
const consumerController = require("../Controllers/consumerController")


module.exports = (app) =>{
    app.post('/broadcast', broadcastController.add);
    app.post('/consumer', consumerController.add);
    app.get('/list-broadcast', broadcastController.fetch);
}