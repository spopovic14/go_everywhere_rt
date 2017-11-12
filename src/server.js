var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const GoEverywhereUser = require('./GoEverywhereUser');

const PORT = process.env.PORT || 4700;

io.on('connection', (socket) => socket.on('authenticate', (userData) => new GoEverywhereUser(socket, userData)));
http.listen(PORT, () => console.log(`Server up on ${PORT}`));
