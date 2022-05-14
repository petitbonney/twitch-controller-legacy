// Chatbot Server
exports.run = (io) => {
    const tmi = require('tmi.js')
    const dotenv = require('dotenv')
    const commands = require('./commands')

    // Get config from .env file
    dotenv.config()

    // Initialize bot
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

    // Connect bot to the tchat
    client.connect()

    // Callback on message
    client.on('message', (channel, tags, message, self) => {
        if (self || !message.startsWith('!')) return

        // Extract arguments
        const args = message.slice(1).split(' ')
        const cmd = args.shift().toLowerCase()

        // If command exists in ./commands directory, call it
        if (cmd in commands) {
            commands[cmd](client, channel, tags, message, args, io)
        }
    })
}