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

  // This indicates who is the first player,
  // and NOT the beginning of the first turn of startingPlayer.
  // Beginning and end of turns are indicated by endTurn.
  // state = {'table': someTable,
  // 'piles': [card1, card2, ...],
  // 'startingPlayer': {'name': 'arthur'}}
  // 
  // card1 = {'name': 'Copper', 'cost': 1, 'qty': 20, 'qtyLeft': 20, 'coin': 1}
  // card2 = {'name': 'Smithy', 'cost': 4, 'qty': 10, 'qtyLeft': 10,
  // 'desc': 'Draw 3 cards'}
  this.gameStart = function(state) {
    console.log(state)
    var pileNames = new Array()
    for ( var i = 0; i < state.piles.length; i++) {
      pileNames.push(state.piles[i].name)
    }
    console.log('Game started. ' + state.startingPlayer.name + ' will start.'
        + 'Piles available: ' + pileNames.join())

  }

  // Game is over.
  // state = {'table': aTable, 'winner': aPlayer}
  this.gameOver = function(state) {
    var winner = state.winner
    console.log(winner.name + ' won with ' + winner.score + ' points')
  }

  // I clicked on "end turn"
  this.endMyTurn = function() {
    GAMECOMM.sendEndMyTurn()
  }

  // Someone's turn ended, and the next player's turn starts.
  // state = {'prev':playerWhoseTurnIsOver, 'next':playerWhoseTurnStarts}
  // !! During the first turn of the first player, there is no prev !!
  this.endTurn = function(state) {
    var pname = state.next.name
    if (pname == self.myName) {
      console.log('my turn!!')
    } else {
      console.log('turn of ' + pname)
    }
  }

  // args = {'size': 10} for a starting deck of 10 cards
  this.setDeck = function(args) {
  }

  // args = {'hand': [card1, card2, ..., card5]}
  // card1 = {'name' = '', 'cost': 1, 'fame': 0, 'desc': 'Draw 3 cards',
  // 'qty': 10, 'qtyleft': 6}
  this.drawHand = function(args) {
    var cardNames = new Array()
    var hand = args.hand
    for ( var i = 0; i < hand.length; i++) {
      cardNames.push(hand[i].name)
    }
    console.log('I draw ' + cardNames.join())
  }

  // Another player just drew his hand.
  // This is just a notification from the server.
  // args = {'player': {'name':'art'}, 'size': 5}
  this.otherDrawHand = function(args) {
    var pname = args.player.name
    var num = args.size
    console.log(pname + ' draws ' + num + ' cards into his hand')
  }

}
