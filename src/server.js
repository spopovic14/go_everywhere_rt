var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const GoEverywhereUser = require('./GoEverywhereUser');


io.on('connection', (socket) => socket.on('authenticate', (userData) => new GoEverywhereUser(socket, userData)));
http.listen(3000, () => console.log('Server up on 3000'));
