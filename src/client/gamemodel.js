/*
 * The model for a game.
 */

function GameModel(playerId) {

  var self = this
  this.myName = playerId;
  this.table = new Array();
  this.numPlayers = null;

  /**
   * 
   * player joins, leaves, game starts, ends
   * 
   */

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
  // args = {'table': [player1, player2],
  // 'piles': [card1, card2, ...],
  // 
  // card1 = {'name': 'Copper', 'cost': 1, 'qty': 20, 'qtyLeft': 20, 'coins': 1}
  // card2 = {'name': 'Smithy', 'cost': 4, 'qty': 10, 'qtyLeft': 10,
  // 'desc': 'Draw 3 cards'}
  this.gameInit = function(args) {
    var pileNames = new Array()
    for ( var i = 0; i < args.piles.length; i++) {
      pileNames.push(args.piles[i].name)
    }
    console.log('Game init. Piles available: ' + pileNames.join())

  }

  // Game is over.
  // args = {'table': aTable, 'winner': aPlayer}
  this.gameOver = function(args) {
    var winner = args.winner
    console.log(winner.name + ' won with ' + winner.score + ' points')
  }

  /**
   * 
   * start turn cleanup phase end turn
   * 
   */

  // A player starts his turn.
  // args = {'player':{'name':'arthur'}, 'effect':{'actions':1,'buys':1}}
  this.startPhase = function(args) {
    var pname = args.player.name
    if (pname == self.myName) {
      console.log('Begin my turn')
    } else {
      console.log('Begin turn of ' + pname)
    }
  }

  // A player starts his action phase.
  // args = {'player':{'name':'arthur'}}
  this.actionPhase = function(args) {
    var pname = args.player.name
    if (pname == self.myName) {
      console.log('Begin my action phase')
    } else {
      console.log('Begin action phase of ' + pname)
    }
  }

  // The cleanup phase of a player starts.
  // args = {'player': {'name':'arthur'}, 'top':card1, 'num':6}
  // card1 = {'name': 'Copper', ...}
  // if Arthur's clean up phase results in discarding 6 cards
  // from tableau + hand, and the top card of his discard pile is a Copper
  this.cleanupPhase = function(args) {
    var pname = args.player.name
    if (pname == self.myName) {
      console.log('I discard ' + args.num + ' cards. Top: ' + args.top.name)
    } else {
      console.log(pname + ' discards ' + args.num + ' cards. Top: '
          + args.top.name)
    }
  }

  // A player (can be me) gained resources (actions, buys, coins).
  // args = {'player': {'name': 'arthur', 'resources': rsrc}
  // rsrc = {'coins': 1, 'actions': 2, 'buys': 1}
  this.gainResources = function(args) {
    var pname = args.player.name
    var resources = args.resources
    // compute list of bonuses
    var bonuses = new Array()
    for ( var resource in resources) {
      bonuses.push('+' + resources[resource] + ' ' + resource)
    }
    // print
    if (pname == self.myName) {
      console.log('I get ' + bonuses.join())
    } else {
      console.log(pname + ' gets ' + bonuses.join())
    }
  }

  /**
   * 
   * play money card(s) buy
   * 
   */

  // Someone placed money card(s) down to buy stuffs.
  // args = {'player': {'name': 'arthur'}, 'moneyCards': [card1, card2]}
  // card1 = {'name': 'Copper', 'cost': 1, 'qty': 20, 'qtyLeft': 20, 'coin': 1}
  this.someonePlayMoney = function(args) {
    var pname = args.player.name
    var cnames = new Array()
    var coins = 0
    for ( var i = 0; i < args.moneyCards.length; i++) {
      cnames.push(args.moneyCards[i].name)
      coins += args.moneyCards[i].coins
    }
    if (pname == self.myName) {
      console
          .log('I play ' + cnames.join() + ' and gain ' + coins + ' coin(s)')
    } else {
      console.log(pname + ' plays ' + cnames.join() + ' and gains ' + coins
          + ' coin(s)')
    }
  }

  // A player just bought a card. CAN be myself.
  // The card should go on top of the discard.
  // The quantity left for this card should be decreased by 1.
  // args = {'player': {'name': 'arthur'}, 'card': card1}
  this.someoneBuy = function(args) {
    var pname = args.player.name
    var cName = args.card.name
    var qtyLeft = args.card.qtyLeft
    if (pname == self.myName) {
      console.log('I buy ' + cName + '. ' + qtyLeft + ' left in the pile.')
    } else {
      console.log(pname + ' buys ' + cName + '. ' + qtyLeft
          + ' left in the pile.')
    }
  }

  /**
   * 
   * draw cards reset deck
   * 
   */

  // Someone (could be me) draws a card to his hand.
  // TODO: also do draw a card from deck to discard pile
  // args = {'cards': [card1, card2]}
  // card1 = {'name' = '', 'cost': 1, 'fame': 0, 'desc': 'Draw 3 cards',
  // 'qty': 10, 'qtyleft': 6}
  this.drawCards = function(args) {
    var pname = args.player.name
    if (pname == self.myName) {
      var cardNames = new Array()
      for ( var i = 0; i < args.cards.length; i++) {
        cardNames.push(args.cards[i].name)
      }
      console.log('I draw ' + cardNames.join())
    } else {
      console.log(pname + ' draws ' + args.qty + ' cards')
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
  
  
  // A player starts playing a card.
  // args = {'player':{'name':''}, 'card':card}
  this.startPlayCard = function(args) {
    var pname = args.player.name
    var cname = args.card.name
    if (pname == self.myName) {
      console.log('I play ' + cname)
    } else {
      console.log(pname + ' plays ' + cname)
    }
  }

}
