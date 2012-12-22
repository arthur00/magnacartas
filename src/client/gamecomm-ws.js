// ----------------------- NETWORK --------------- 

function GameCommWebSocket() {

  if (!window.WebSocket) {
    $('#connectionStatus').html("Error: websocket not supported.");
    return;
  }

  var host = "ws://localhost:9000/game";
  this.host = host;
  var socket = new WebSocket(host); // try to connect
  var self = this;

  // socket opened: send my name
  socket.onopen = function() {
    console.log('socket opened')
    GAMEMODEL.onConnectToGameServer();
  };

  // socket closed: dont do anything
  socket.onclose = function() {
    console.log('socket closed')
  };

  // model callbacks triggered when the socket receives a message
  rcv_callbacks = {
    'welcome' : GAMEMODEL.welcome,
    'playerJoined' : GAMEMODEL.addPlayer,
    'playerLeft' : GAMEMODEL.removePlayer,
    'gameStart' : GAMEMODEL.gameStart,
    'gameOver': GAMEMODEL.gameOver
  }

  // receive handler
  socket.onmessage = function(msg) {
    m = JSON.parse(msg.data);
    // console.log(m)
    for ( var cmd in m) {
      try {
        rcv_callbacks[cmd](m[cmd])
      } catch (TypeError) { // callback not found
        console.log('Callback not found for command: ' + cmd)
      }
    }
  };

  this.sendJoinGame = function(playerId) {
    var args = {
      'name' : playerId
    }
    this.send('join', args);
  };

  // Convert a message in JSON and send it right away.
  this.send = function(msgType, content) {
    var msg = {};
    msg[msgType] = content;
    // console.log(msg)
    socket.send(JSON.stringify(msg));
  }

  // close connection to the server
  this.close = function() {
    socket.close();
  };

}