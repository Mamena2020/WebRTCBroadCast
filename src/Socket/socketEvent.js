const broadcastService = require("../Services/broadcastServices")
const consumerService = require("../Services/consumerService")

module.exports = (io)=>{
    io.on('connection', async function(socket) {
        console.log("new connection: " + socket.id)

        socket.emit("from-server", socket.id)

        socket.on('add-candidate-consumer', (data) => {
            consumerService.addCandidateFromClient(data)
        })
        socket.on('add-candidate-broadcast', (data) => {
            broadcastService.addCandidateFromClient(data)
        })
        
        io.on('disconnect', socket => {
            console.log("someone disconnected")
        })
    })

}