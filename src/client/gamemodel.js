/*
 * Model for card game.
 */

/*********************************************/
/**** Global Variables ****/
/** ****************************************** */

_left = "left";
_right = "right";
_across = "across";
_player = "player";

_hand = "Hand";
_mat = "Mat";
_deck = "Deck";
_discard = "Discard";

_open = "open";
_close = "close";

_card = "card";
_tableau = "tableau";
_buying = "buying";

_table = "table";

function GameModel(playerId) {

  var self = this
  this.myName = playerId;
  this.table = new Array();
  this.numPlayers = null;
  this.cardData = {};
  this.players = {}
  this.myTurn = false
  // when i play a card on the tableau, block the view
  // and wait for the server to tell me the effect of that card.
  // Use this stack to keep track of blocks.
  // When the stack is empty, unblock the view.
  this.cardPlayBlocks = []
  // resource counters for all players at once/shared
  this.actions = 0
  this.buys = 0
  this.coins = 0

  var hand = new Array();
  var tableau = new Array();

  // -------- INITIALIZATION ---------------------------

  var init = function() {
  }

  var addCardToHand = function(card) {
    hand.push(card);
    GAMEVIEW.addCardToHand(card);
  }

  var addCardToTableau = function(card) {
    tableau.push(card);
    GAMEVIEW.addCardToTableau(card);
  }

  this.setDeck = function(pos, value) {
    // TODO: store locally in model
    GAMEVIEW.setDeck(pos, value);
  }

  this.setDiscard = function(pos, value, topCard) {
    // TODO: store locally in model
    GAMEVIEW.setDiscard(pos, value, topCard);
  }

  /** ****************************************** */
  /** ** Helper *** */
  /** ****************************************** */

  this.getPosFromContainer = function(container) {
    if (container.attr("id").indexOf(_player) > -1)
      return _player
    else if (container.attr("id").indexOf(_left) > -1)
      return _left
    else if (container.attr("id").indexOf(_right) > -1)
      return _right;
    else if (container.attr("id").indexOf(_across) > -1)
      return _across;
  }

  this.getCtypeFromCard = function(card) {
    // Get ctype from card
    var classes = card.attr("class").split(" ");
    for (i = 0; i < classes.length; i++) {
      var idx = classes[i].indexOf("_c_");
      if (idx > -1) {
        ctype = classes[i].slice(idx + 3);
        return ctype;
      }
    }
  }

  /** ****************************************** */
  /** ** view Events *** */
  /** ****************************************** */

  // if it's my turn, make the tableau droppable when i drag a card from my hand
  this.startDraggingCard = function(card) {
    if (self.myTurn) {
      ctype = this.getCtypeFromCard(card);
      // TODO: check if ctype is action card
      if (self.actions > 0) {
        GAMEVIEW.activateDroppable([ null, _tableau ])
      }
    }
  }

  // Fires before the droppable event! Nice..
  // http://stackoverflow.com/questions/8092771/jquery-drag-and-drop-checking-for-a-drop-outside-a-droppable
  this.stopDraggingCard = function(card) {
    GAMEVIEW.deActivateAllDroppables()
  }

  // Normal drop in hand. Adds the card to the player's hand.
  this.dropHand = function(container, card) {
    pos = this.getPosFromContainer(container);
    GAMEVIEW.addCardToHand(pos, card);
    GAMEVIEW.reArrangeHand(_player);
  }

  this.dropDeck = function(container, card) {
    // Currently nothing. In the future, may allow for cards that goes on top of
    // deck.
    card.remove();
    GAMEVIEW.reArrangeHand(_player);
  }

  // For player only!
  this.dropDiscard = function(container, card) {
    GAMEVIEW.addCardToDiscard(card, _player);
    GAMEVIEW.reArrangeHand(_player);
  }

  this.dropMat = function(container, card) {
    card.remove();
    ctype = this.getCtypeFromCard(card);
    pos = this.getPosFromContainer(container);
    GAMEVIEW.addCardToMat(ctype, pos);
    GAMEVIEW.reArrangeHand(_player);
  }

  // action card is dropped on tableau
  this.dropActionTableau = function(card) {
    addCardToTableau(card);
    cardName = this.getCtypeFromCard(card);
    GAMEVIEW.disableAllEvents();
    GAMEVIEW.reArrangeHand(_player);
    self.cardPlayBlocks.push(cardName)
    GAMECOMM.sendPlay(cardName)
  }

  this.dropBuyingBoard = function(card) {

  }

  /**
   * 
   * mechanics
   * 
   */

  // add resources about the current player
  // and re-display the counters in the view
  this.addResources = function(effect) {
    if ('actions' in effect) {
      self.actions += effect.actions
    }
    if ('buys' in effect) {
      self.buys += effect.buys
    }
    if ('coins' in effect) {
      self.coins += effect.coins
    }
    GAMEVIEW.setResource(self.actions, self.buys, self.coins)
  }

  /**
   * 
   * network callbacks
   * 
   * 
   */

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
    // players
    var table = args['table']
    self.table = table
    // find my position in the table
    var myIndex = 0
    for (myIndex = 0; myIndex < table.length; myIndex++) {
      if (self.myName == table[myIndex].name) {
        break
      }
    }
    // 2 ppl: other player is across me
    if (table.length == 2) {
      var viewAreas = [ _across ]
    } else { // works for 3 and 4 players
      var viewAreas = [ _left, _across, _right ]
    }

    // add my play area first
    self.players[self.myName] = {
      'player' : table[myIndex],
      'deckSize' : null,
      'viewArea' : _player
    }
    GAMEVIEW.activatePlayer(viewAreas[i])

    // keep iterating until i find myself again
    var playerIndex = myIndex + 1, viewIndex = 0
    while (table[playerIndex % table.length].name != self.myName) {
      var player = table[playerIndex % table.length]
      self.players[player.name] = {
        'player' : player,
        'viewArea' : viewAreas[viewIndex]
      }
      GAMEVIEW.activatePlayer(viewAreas[viewIndex])
      viewIndex++
      playerIndex++
    }

    // piles
    var buyGridDims = GAMEVIEW.getBuyingStackSize()
    var i = 0, j = 0, k = 0
    var piles = []
    while (i < args.piles.length) {
      var card = args.piles[i]
      self.cardData[card.name] = card
      var pile = {
        'ctype' : card.name,
        'num' : card.qtyLeft,
        'pos' : {
          'x' : j,
          'y' : k
        }
      }
      piles.push(pile)
      // update j and k
      j++
      if (j >= buyGridDims.x) {
        j = 0
        k++
      }
      i++
    } // end while
    GAMEVIEW.addBuyingStacks(piles)
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
    self.addResources(args.effect)
  }

  // A player starts his action phase.
  // args = {'player':{'name':'arthur'}}
  this.actionPhase = function(args) {
    var pname = args.player.name
    if (pname == self.myName) {
      self.myTurn = true
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

  // Network callback
  // A player (can be me) gained resources (actions, buys, coins).
  // args = {'player': {'name': 'arthur', 'resources': resources}
  // resources = {'coins': 1, 'actions': 2, 'buys': 1}
  this.gainResources = function(args) {
    var pname = args.player.name
    var resources = args.resources
    self.addResources(args.resources)
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
  // args = {'player':{'name':'arthur'}, 'cards': [card1, card2]}
  // card1 = {'name' = '', 'cost': 1, 'fame': 0, 'desc': 'Draw 3 cards',
  // 'qty': 10, 'qtyleft': 6}
  // -- OR --
  // args = {'player':{'name':'arthur'}, 'qty':2}
  this.drawCards = function(args) {
    var pname = args.player.name
    var source = [ self.players[pname].viewArea, _deck ]
    var dest = [ self.players[pname].viewArea, _hand ]
    var numCards = 0;

    if ('cards' in args) { // I drew: face-up cards
      for ( var i = 0; i < args.cards.length; i++) {
        var cardType = args.cards[i].name
        GAMEVIEW.moveCard(source, dest, cardType)
      }
      numCards = args.cards.length
    } else { // someone else: face-down cards
      for ( var i = 0; i < args.qty; i++) {
        GAMEVIEW.moveCard(source, dest)
      }
      numCards = args.qty
    }
    // update the deck counts
    var playerArea = self.players[pname].viewArea
    self.players[pname].deckSize -= numCards
    GAMEVIEW.setDeck(playerArea, self.players[pname].deckSize)
  }

  // A player's deck runs out and is replaced by his discard.
  // Also called at game start when setting the initial deck.
  // args = {'player': {'name': 'arthur'}, 'size': 10}
  this.someoneResetDeck = function(args) {
    var pname = args.player.name
    var numCards = args.size
    self.players[pname].deckSize = numCards
    var playerArea = self.players[pname].viewArea
    GAMEVIEW.setDeck(playerArea, numCards)

  }

  // callback from server
  // A player starts playing a card.
  // args = {'player':{'name':''}, 'card':card}
  this.startPlayCard = function(args) {
    var pname = args.player.name
    var cname = args.card.name
    // not the current player, move card from other player's hand to tableau
    if (pname != self.myName) {
      var playerArea = self.players[pname].viewArea
      GAMEVIEW.moveCard([ playerArea, _hand ], [ _table, _tableau ], cname)
    }
    // everyone applys the resource cost
    // TODO: by default, cards cost 1 action
    var effect = {
      'actions' : -1
    }
    self.addResources(effect)
  }

  // callback from server
  // A card is done with its effects.
  // args = {'player':{'name':''}, 'card':card}
  this.endPlayCard = function(args) {
    var pname = args.player.name
    var cname = args.card.name
    // if I played that card, unblock
    if (pname == self.myName) {
      var myCname = self.cardPlayBlocks.pop()
      if (myCname != cname) {
        throw 'Error when unblocking card action: ' + myCname + ' vs ' + cname
      }
      // if no cards are blocking anymore, unblock
      if (self.cardPlayBlocks.length == 0) {
        GAMEVIEW.enableAllEvents()
      }

    }

  }

}
