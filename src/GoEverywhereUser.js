const SocketIOClient = require('socket.io-client');
const generateUUID = require('uuid/v1');

const ogsUrl = "https://online-go.com";
const ogsClientConfig = {
  reconnection: true,
  reconnectionDelay: 750,
  reconnectionDelayMax: 10000,
  transports: ["websocket"],
  upgrade: false,
};

const handlePing = (socket) => {
  // TODO: handle ping/pong with user latency/drift
}

class User {

  constructor(geSio, userData) {
    console.log('some idiot actually connected lmao');
    this.geSio = geSio;
    this.userData = userData;
    this.ogsSio = SocketIOClient(ogsUrl, ogsClientConfig);

    //default joined chats
    this.joinedChats = ['english', 'offtopic'];

    this.handleDisconnect();
    this.registerOGSListener();
    this.registerGEListeners();
    this.joinChats();
    this.mainLogic();
  }

  fooBar(payload) {
    this.geSio.emit('testing', payload);
  }

  handleIncomingChatMsg(payload) {

    //converting into our specification
    let geAccount = {
      server: "OGS",
      id: payload["id"],
      username: payload["username"],
      rank: payload["ranking"],
      additionalInfo: {
        country: payload["country"],
        rating: payload["rating"]
      }
    };

    let geMessage = {
      from: geAccount,
      to: null,
      message: payload["message"] //TODO: message encoding
    };

    this.geSio.emit('chat-message', geMessage);

  }

  test2(payload) {
    this.geSio.emit('chat', payload)
  }

  handleDisconnect() {
    this.geSio.on('disconnect', () => this.ogsSio.close());
    // TODO: additional cleanup?
  }

  handlePrivateMessage(payload) {
    this.geSio.emit('private-chat', payload);
  }

  handlePublicMessage(type, payload) {
    this.geSio.emit('public-chat', {payload, type}); // TODO: unpack payload?
  }

  registerOGSListener() {
    this.ogsSio.on('active_game', this.fooBar.bind(this));
    this.ogsSio.on('notification', this.fooBar.bind(this));
    this.ogsSio.on('net/pong', this.fooBar.bind(this));
    this.ogsSio.on('game', this.fooBar.bind(this));
    this.ogsSio.on('seekgraph/global', this.fooBar.bind(this));
    this.ogsSio.on('private-message', this.fooBar.bind(this));
    //incoming chat requests handling
    this.ogsSio.on('chat-message', (payload) => this.handlePublicMessage('message', payload)); //sent and recived messages go through this channel
    this.ogsSio.on('chat-part', (payload) => this.handlePublicMessage('leave', payload));  // when another user joins any of the chat channels we will get notified
    this.ogsSio.on('chat-join', (payload) => this.handlePublicMessage('join', payload)); // when another user joins any chat channel we will get notified
    // when entering or leaving the chat channel we emit which channel is it
    //handling private chat
    this.ogsSio.on('chat/pm', (payload) => this.handlePrivateMessage(payload));
    this.ogsSio.on('private-message', (payload) => this.handlePrivateMessage(payload));
  }

  registerGEListeners() {

    this.geSio.on('chat',
        (payload) => this.ogsSio.emit('chat/send', {...payload, uuid: generateUUID()})
    );

    this.geSio.on('private-chat', (payload) => {
      let message = {
          ...payload,uid:'asd.1'
      };
      this.ogsSio.emit('chat/pm', message);
    });

  }

  registerForChat(channel) {
    //here we register for individual chats
    channel = 'global-' + channel; // FIXME
    this.ogsSio.emit('chat/join', {channel});
  }

  joinChats() {
    //default channels that are joind on login
    this.joinedChats.forEach(this.registerForChat.bind(this));
  }


  mainLogic() {
    this.ogsSio.emit('hostinfo');

    this.ogsSio.emit('ui-pushes/subscribe', {channel: "announcements"});
    this.ogsSio.emit('ui-pushes/subscribe', {channel: "undefined"});
    this.ogsSio.emit('notification/connect', {
      "player_id": this.userData.userId,
      "auth": this.userData.notificationAuth
    });
    this.ogsSio.emit('adblock', 'not_checked');
    this.ogsSio.emit('automatch/list');
    this.ogsSio.emit("authenticate", {
      "auth": this.userData.chatAuth,
      "player_id": this.userData.userId,
      "username": this.userData.username
    });
    this.ogsSio.emit("chat/connect", {
      "auth": this.userData.chatAuth,
      "player_id": this.userData.userId,
      "ranking": 0,
      "username": this.userData.username,
      "ui_class": "timeout provisional"
    });
    this.ogsSio.emit("incident/connect", {
      "player_id": this.userData.userId,
      "auth": this.userData.incidentAuth
    });
    // this.ogsSio.emit('chat/join', {
    // 'channel': "global-english"
    // })

    this.ogsSio.emit("ad", "supporter");
    this.ogsSio.emit("ad", "supporter");
    this.ogsSio.emit("seek_graph/connect", {'channel': 'global'});
    return;
  }

  enterMatchmaking() {
    // We might need to use uuid v5?
    const uuid = generateUUID();
    this.ogsSio.emit('automatch/find_match', {
      uuid,
      size_speed_options: [
        {
          size: "19x19",
          speed: "live"
        }
      ],
      lower_rank_diff: 3,
      upper_rank_diff: 3,
      rules: {
        condition: "no-preference",
        value: "japanese"
      },
      time_control: {
        condition: "no-preference",
        value: {
          system: "byoyomi"
        }
      },
      handicap: {
        condition: "no-preference",
        value: "enabled"
      }
    });
  }

}

module.exports = User;
