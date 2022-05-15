const express = require('express')
const chatbot = require('./src/chatbot.js')

const app = express()
const server = require('http').createServer(app)
const io = require('./src/socket-manager.js').start(server)

require('dotenv').config()

app.use(express.static('public'))

app.get('/chatbot', (req, res) => {
    const activate = req.query.activate
    if (activate > 0 && !chatbot.isRunning()) {
        chatbot.start(io)
    } else if (activate == 0 && chatbot.isRunning()) {
        chatbot.stop()
    }
    res.status(200).send({ running: chatbot.isRunning() })
})

server.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`)
})