/*
 * The model for a game.
 */

function GameModel(playerId) {

  var self = this
  this.myName = playerId;
  this.table = new Array();
  this.numPlayers = null;

  this.onConnectToGameServer = function() {
    GAMECOMM.sendJoinGame(self.myName)
  }

  // for a game with 2 players, if arthur connects first, and tho second,
  // state = {'numPlayers': 2, 'table': someTable}
  // someTable = [somePlayer, otherPlayer]
  // somePlayer = {'name':'arthur'}
  // otherPlayer = {'name': 'tho'}
  this.welcome = function(state) {
    var table = state['table']
    self.numPlayers = state['numPlayers']
  }

  // another player joined.
  // state = {'table': someTable, 'newPlayer': playerWhoJoined}
  this.playerJoined = function(state) {
    var pname = state.newPlayer.name
    console.log(pname + ' joined')
  }

  // another player left.
  // state = {'table': someTable, 'oldPlayer': playerWhoLeft}
  this.playerLeft = function(state) {
    var pname = state.oldPlayer.name
    console.log(pname + ' left')
  }

  // This marks the beginning of the first turn of startingPlayer.
  // state = {'table': someTable, 'curPlayer': startingPlayer}
  this.gameStart = function(state) {
    var pname = state.curPlayer.name
    if (pname == self.myName) {
      console.log('my turn!!')
    } else {
      console.log('turn of ' + pname)
    }
  }

  // Game is over.
  // state = {'table': aTable, 'winner': aPlayer}
  this.gameOver = function(state) {
    winner = state.winner
    console.log(winner.name + ' won with ' + winner.score + ' points')
  }

  // I clicked on "end turn"
  this.endMyTurn = function() {
    GAMECOMM.sendEndMyTurn()
  }

  // Someone's turn ended, and the next player's turn starts.
  // state = {'prev':playerWhoseTurnIsOver, 'next':playerWhoseTurnStarts}
  this.endTurn = function(state) {
    console.log('turn of ' + state.next.name)
  }

  // a dummy callback for the network
  this.dummy = function(args) {
  }

}
