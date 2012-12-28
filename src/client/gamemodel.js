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
    var pileNames = new Array()
    for ( var i = 0; i < state.piles.length; i++) {
      pileNames.push(state.piles[i].name)
    }
    console.log('Game started. ' + state.startingPlayer.name + ' will start. '
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

  // A player's deck runs out and is replaced by his discard.
  // Also called at game start when setting the initial deck.
  // args = {'player': {'name': 'arthur'}, 'size': 10}
  this.someoneResetDeck = function(args) {
    var pname = args.player.name
    if (pname == self.myName) {
      console.log('I shuffle my deck (' + args.size + ' cards)')
    } else {
      console.log(pname + ' shuffles his deck (' + args.size + ' cards)')
    }
  }

  // I draw a card into my hand.
  // args = {'card': card1}
  // card1 = {'name' = '', 'cost': 1, 'fame': 0, 'desc': 'Draw 3 cards',
  // 'qty': 10, 'qtyleft': 6}
  this.drawCard = function(args) {
    console.log('I draw ' + args.card.name)
  }

  // Another player just drew a card into his hand.
  // This is just a notification from the server.
  // args = {'player': {'name':'art'}}
  this.otherDrawCard = function(args) {
    console.log(args.player.name + ' draws a card')
  }

  // A player discarded a card from his hand. This player CAN be myself.
  // args = {'player': {'name': 'arthur'}, 'card': card1}
  this.someoneDiscardFromHand = function(args) {
    var pname = args.player.name
    var cName = args.card.name
    if (pname == self.myName) {
      console.log('I discard ' + cName)
    } else {
      console.log(pname + ' discard ' + cName)
    }
  }

}
