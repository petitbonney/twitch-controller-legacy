// WebSocket Server
const socketIO = require('socket.io')

let server, io

exports.start = (server) => {
    io = socketIO(server, { cors: { origin: '*' } })

    io.on('connection', (socket) => {
        console.log(socket.id + ' connected.')
        socket.on('room', (room) => {
            console.log(socket.id + ' joining room ' + room)
            socket.join(room)
        })
    })

    return io
}

exports.stop = () => {
    if (io) {
        io.disconnectSockets()
    }
}