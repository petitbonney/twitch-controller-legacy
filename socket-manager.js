// WebSocket Server
exports.createServer = () => {
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

    return io
}