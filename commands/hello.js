module.exports = (client, channel, tags, message, args, io) => {
    client.say(channel, `@${tags.username}, heya!`)
}