module.exports = (client, channel, tags, message, args) => {
    client.say(channel, `@${tags.username}, heya!`);
}