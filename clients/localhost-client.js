const socket = require('socket.io-client')('http://localhost:4700');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var axios = require('axios');
var qs = require('qs');

var request = function (method, uri, d = null, token = '') {
  if (!method) {
    console.error('API function call requires method argument')
    return
  }
  if (!uri) {
    console.error('API function call requires uri argument')
    return
  }
  var url = uri
  console.log('sending request to ' + url)
  var h = {}
  if (token) {
    h['Authorization'] = 'Bearer ' + token
  }
  var params = {}
  return axios({
    method,
    url,
    data: qs.stringify(d),
    params,
    headers: h
  })
}

var authenticate = (username, password) => {
  return request("POST", "https://online-go.com/oauth2/token/", {
    "client_id": "eEMzUcZLmQmfjfoNO4bEJZOqC2K85eivXiL1u9kl",
    "client_secret": "yv6PY85TyGbCQJ6a8mL0eQwCZhPDrMgbpCVlbAIFSFGTK0FgEASiaRkKaxYKBToOlYO3TZi7w5Kc6EbTH8kvONsqgc7SuZdfOSoqfBnLCfVEppiSyyYXsCkVKCxfvXXj",
    "grant_type": "password",
    "username": username,
    "password": password
  }).then((response) => {
    var accessToken = response.data['access_token']
    var refreshToken = response.data['refresh_token']
    return request("GET", "http://online-go.com/api/v1/me/", null, accessToken).then((response1) => {
      var userId = response1.data['id']
      return request('GET', "http://online-go.com/api/v1/ui/config", null, accessToken).then((configResponse) => {
        return {
          userId: userId,
          chatAuth: configResponse.data['chat_auth'],
          incidentAuth: configResponse.data['incident_auth'],
          notificationAuth: configResponse.data['notification_auth'],
          username: configResponse.data.user.username
        };
      });
    });
  })
      .catch((error) => {
        console.log(error);
      });
}

//socket.on('testing', (payload) => console.log(payload));
//socket.on('chat', (payload) => console.log(payload))

socket.on('public-chat', (payload) => console.log(payload));
socket.on('private-chat', (payload) => console.log(payload));
socket.on('connect', () => {
  authenticate('peradetlic', 'qweqwe').then((userData) => {
    console.log(userData);
    socket.emit('authenticate', userData);

  });
});
var sendPrivateMessage = function(reciverId, reciverUsername, message)
{
  socket.emit('private-chat', {player_id: reciverId, username: reciverUsername, message: message});
}

setInterval(() => {
  sendPrivateMessage(483521,'VukBozovic','test poruka');
}, 5000);

