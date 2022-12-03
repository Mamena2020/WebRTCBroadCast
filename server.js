const host = "localhost";
// const host = "192.168.1.7"
const port = "3000"

const express = require('express')
const app = express()

const bodyParser = require('body-parser')

const http = require('http')
const server = http.Server(app);

const socketIO = require('socket.io')
const io = socketIO(server)

app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

server.listen(port,
    host,
    () => console.log('server started: ' + host + ":" + port));
    
require("./src/Route/route")(app)
require("./src/Socket/socketEvent")(io)
require("./src/Socket/socketFunction").init(io)




