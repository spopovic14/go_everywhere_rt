var axios = require('axios');
var qs = require('qs')

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

var socket = require('socket.io-client')("https://online-go.com", {
  reconnection: true,
  reconnectionDelay: 750,
  reconnectionDelayMax: 10000,
  transports: ["websocket"],
  upgrade: false,
});
socket.open();
socket.on('active_game', log);
socket.on('notification', log);
socket.on('net/pong', log);
socket.on('game', log);
socket.on('seekgraph/global', log);
var last_clock_drift = 0.0;
var last_latency = 0.0;

socket.on('net/pong', (data) => {
  let now = Date.now();
  let latency = now - data.client;
  let drift = ((now - latency / 2) - data.server);
  last_latency = latency;
  last_clock_drift = drift;
});

socket.on('event', log);
socket.on('chat-message', log)
socket.on('disconnect', () => console.log("nooooo"));
socket.on('sid', () => console.log("sdfaasdfasdf"));
socket.on('private-message', log);

const socketListener = (userData) => {
  console.log('Trying to connect user:');
  console.log(userData);

  console.log("konektovan");
  socket.emit('hostinfo');
  socket.emit('net/ping', {
    client: Date.now(),
    drift: last_clock_drift,
    latency: last_latency
  });

  socket.emit('ui-pushes/subscribe', { channel: "announcements" });
  socket.emit('ui-pushes/subscribe', { channel: "undefined" });
  socket.emit('notification/connect', {
    "player_id": userData.userId,
    "auth": userData.notificationAuth
  });
  socket.emit('adblock', 'not_checked');
  socket.emit('automatch/list');
  socket.emit("authenticate", {
    "auth": userData.chatAuth,
    "player_id": userData.userId,
    "username": userData.username
  });
  socket.emit("chat/connect", {
    "auth": userData.chatAuth,
    "player_id": userData.userId,
    "ranking": 0,
    "username": userData.username,
    "ui_class": "timeout provisional"
  });
  socket.emit("incident/connect", {
    "player_id": userData.userId,
    "auth": userData.incidentAuth
  });
  socket.emit('chat/join', {
    'channel': "global-english"
  })
  socket.emit("ad", "supporter");
  socket.emit("ad", "supporter");
  socket.emit("seek_graph/connect", { 'channel': 'global' })

}

socket.on('connect', () => {
  authenticate("peradetlic", "qweqwe").then((userData) => socketListener(userData));
  authenticate("mytestusername", "dusan4323").then((userData) => socketListener(userData));
});
