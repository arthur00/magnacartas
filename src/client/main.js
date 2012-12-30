/*
 * Launcher.
 * Start the model, view, and communication components.
 */

// global variables
var GAMEMODEL;
var GAMEVIEW;
var GAMECOMM;

// return a random 5-character user name
var getRandomName = function() {
  return Math.random().toString(36).substr(2, 5);
}

// on load
$(function() {
  var playerId = getRandomName();
  document.title = 'game of -- ' + playerId
  console.log('you are ' + playerId)
  GAMEMODEL = new GameModel(playerId);
  GAMEVIEW = new GameViewJquery();
  GAMECOMM = new GameCommWebSocket();

  $('#endTurnBtn').click(function() {
    GAMECOMM.sendEndMyTurn()
  })
  $('#playTreasuresBtn').click(function() {
    GAMECOMM.sendPlayAllMyMoneys()
  })
  $('#buyCopperBtn').click(function() {
    GAMECOMM.sendBuy('Copper')
  })
  $('#buyCommodoreBtn').click(function() {
    GAMECOMM.sendBuy('Commodore')
  })
  
});
