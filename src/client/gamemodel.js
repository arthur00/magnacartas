/*
 * The model for a game.
 */

function GameModel(playerId) {

  this.playerId = playerId;

  this.onConnectToGameServer = function() {
    GAMECOMM.sendJoinGame(this.playerId)
  }

  /*
   * player is a dict
   */
  this.addPlayer = function(player) {
    console.log(player)
  }

  /*
   * player is a dict
   */
  this.removePlayer = function(player) {
    console.log(player)
  }

  /*
   * players is a list of player
   */
  this.welcome = function(players) {
    console.log(players)
  }

}
