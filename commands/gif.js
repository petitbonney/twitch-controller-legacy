module.exports = (client, channel, tags, message, args, io) => {
    const tag = args[0]
    if (tag) {
        client.say(channel, `@${tags.username} a choisi le thème du gif suivant : ${tag}`)
        io.to('gif').emit('tag', tag)
    }
}