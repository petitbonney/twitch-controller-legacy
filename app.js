const io = require('./socket-manager.js').createServer()
require('./chatbot.js').run(io)