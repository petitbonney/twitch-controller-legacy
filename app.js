const express = require('express')
const http = require('http')
const cors = require('cors')
const chatbot = require('./src/chatbot.js')
const socket_io = require('./src/socket-manager.js')

const PORT = 8080

const app = express()

app.use(cors({ origin: '*' }))

const server = http.createServer(app)

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/index.html')
})

server.listen(PORT, () => {
    console.log(`Listening on *:${PORT}`)
})

const io = socket_io.start(server)

chatbot.start(io)

setTimeout(() => {
    chatbot.stop()
    socket_io.stop()
    server.close()
}, 5000);