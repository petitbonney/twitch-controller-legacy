const tmi = require('tmi.js');
const dotenv = require('dotenv');
const commands = require('./commands')

dotenv.config()

const client = new tmi.Client({
	options: { debug: true },
	identity: {
		username: process.env.BOT_NAME,
		password: process.env.OAUTH_TOKEN
	},
	channels: process.env.CHANNELS.split(',')
});

client.connect();

client.on('message', (channel, tags, message, self) => {
	if(self || !message.startsWith('!')) return;

	const args = message.slice(1).split(' ');
	const command = args.shift().toLowerCase();

	if (command in commands) {
		commands[command](client, channel, tags, message, args)
	}
});
