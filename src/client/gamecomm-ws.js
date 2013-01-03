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
    GAMEMODEL.onConnectToGameServer();
  };

  // socket closed: dont do anything
  socket.onclose = function() {
    console.log('socket closed')
  };

  // model callbacks triggered when the socket receives a message
  var rcv_callbacks = {
    'welcome' : GAMEMODEL.welcome,
    'playerJoined' : GAMEMODEL.playerJoined,
    'playerLeft' : GAMEMODEL.playerLeft,
    'gameInit' : GAMEMODEL.gameInit,
    'gameOver' : GAMEMODEL.gameOver,
    'startPhase': GAMEMODEL.startPhase,
    'actionPhase': GAMEMODEL.actionPhase,
    'cleanupPhase' : GAMEMODEL.cleanupPhase,
    'gainResources' : GAMEMODEL.gainResources,
    'resetDeck' : GAMEMODEL.someoneResetDeck,
    'drawCards' : GAMEMODEL.drawCards,
    'playMoney' : GAMEMODEL.buyPhase,
    'buy' : GAMEMODEL.someoneBuy,
    'startPlayCard': GAMEMODEL.startPlayCard,
    'endPlayCard': GAMEMODEL.endPlayCard,
  }

  // receive handler
  socket.onmessage = function(msg) {
    m = JSON.parse(msg.data);
    // console.log(m)
    for ( var cmd in m) {
      try {
        rcv_callbacks[cmd](m[cmd])
      } catch (error) { // callback not found
        console.log(error)
        if (error instanceof TypeError) {
          console.log('Maybe a callback was not found for command: ' + cmd)
        }
      }
    }
  };

  // {'join': {'name':'arthur'}}
  this.sendJoinGame = function(playerId) {
    var args = {
      'name' : playerId
    }
    this.send('join', args);
  };

  // {'endMyTurn': {}}
  this.sendEndMyTurn = function() {
    this.send('endMyTurn', {})
  }

  // {'playAllMyMoneys': {}}
  this.sendPlayAllMyMoneys = function() {
    this.send('playAllMyMoneys', {})
  }

  // {'buy': {'name': 'Copper'}}
  this.sendBuy = function(cardName) {
    var args = {
      'name' : cardName
    }
    this.send('buy', args)
  }

  // {'play': {'name': 'Smithy'}}
  this.sendPlay = function(cardName) {
    var args = {
      'name' : cardName
    }
    this.send('play', args)
  }

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