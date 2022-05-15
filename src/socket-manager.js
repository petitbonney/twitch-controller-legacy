// WebSocket Server
const getSocketIO = require('socket.io')

let io

/**
 * Start http and io servers.
 * @returns Socket IO object.
 */
exports.start = (server) => {
    io = getSocketIO(server, {
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

    return io
}

/**
 * Close http server, and disconnect all sockets.
 */
exports.stop = () => {
    io.disconnectSockets()
}