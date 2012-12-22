/*
 * The model for a game.
 */

function GameModel(playerId) {

  this.playerId = playerId;

  this.onConnectToGameServer = function() {
    GAMECOMM.sendJoinGame(this.playerId)
  }

  // another player joined
  // player is a dict
  this.addPlayer = function(args) {
    console.log(args)
  }

  // another player left
  // player is a dict
  this.removePlayer = function(args) {
    console.log(args)
  }

  // init game data.
  // players is a list of player
  this.welcome = function(args) {
    console.log(args)
  }

  this.gameStart = function(args) {
    console.log(args)
  }

  this.gameOver = function(args) {
    console.log(args)
  }

}
