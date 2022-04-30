// WebSocket Server
const http = require('http').createServer()

const io = require('socket.io')(http, {
	cors: {
		origin: "*"
	}
})

io.on('connection', (socket) => {
	console.log(socket.id + ' connected.')
	socket.on('room', (room) => {
		console.log(socket.id + ' joining room ' + room)
		socket.join(room)
	})
})

http.listen(8080, () => console.log('listening on http://localhost:8080'))

// Chatbot Server
const tmi = require('tmi.js')
const dotenv = require('dotenv')
const commands = require('./commands')

dotenv.config()

const client = new tmi.Client({
	options: {
		debug: true
	},
	identity: {
		username: process.env.BOT_NAME,
		password: process.env.OAUTH_TOKEN
	},
	channels: process.env.CHANNELS.split(',')
})

client.connect()

client.on('message', (channel, tags, message, self) => {
	if (self || !message.startsWith('!')) return

	const args = message.slice(1).split(' ')
	const command = args.shift().toLowerCase()

	if (command in commands) {
		commands[command](client, channel, tags, message, args, io)
	}
})