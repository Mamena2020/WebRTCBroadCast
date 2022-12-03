
var io = null

function init(sio)
{
    io =sio
}
function sendCandidateToClient(socket_id,candidate)
{
    io.to(socket_id).emit("candidate-from-server",candidate)
}

module.exports = {
    init,
    sendCandidateToClient
}