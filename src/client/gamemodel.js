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

  // when i play a card on the tableau, or buy a new card, block the view
  // and wait for the server to tell me the effect of that card.
  // Use this stack to keep track of blocks.
  // When the stack is empty, unblock the view.
  this.cardBlocks = []
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
    GAMEVIEW.reArrangeHand(_player);
    GAMEVIEW.networkDisableView();
    self.cardBlocks.push(cardName)
    GAMECOMM.sendPlay(cardName)
  }

  this.dropBuyingBoard = function(card) {

  }

  // called when user buys a card from a pile
  // display the animation: card goes from buying pile to my discard
  // dont modify my local resources
  // tell the server, and wait for its reply to unlock the screen
  this.dblClickBuy = function(card) {
    var ctype = this.getCtypeFromCard(card);
    GAMEVIEW.buyCard(ctype, [ _player, _discard ]);
    GAMEVIEW.networkDisableView();
    self.cardBlocks.push(ctype)
    GAMECOMM.sendBuy(ctype)
  }

  // user clicked on RECRUIT button
  this.toBuyPhase = function() {
    GAMECOMM.sendPlayAllMyMoneys()
  }

  // user clicked on end turn btn
  this.endMyTurn = function () {
    GAMECOMM.sendEndMyTurn()
  }
  
  /**
   * 
   * mechanics
   * 
   */

  // set resources, then update the view
  this.setResources = function(effect) {
    self.actions = 0
    self.buys = 0
    self.coins = 0
    self.addResources(effect)
  }
  
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
    self.players[self.myName] = new Player(table[myIndex], _player)
    GAMEVIEW.activatePlayer(viewAreas[i])

    // keep iterating until i find myself again
    var playerIndex = myIndex + 1, viewIndex = 0
    while (table[playerIndex % table.length].name != self.myName) {
      var player = table[playerIndex % table.length]
      self.players[player.name] = new Player(player, viewAreas[viewIndex])
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
    self.setResources(args.effect)
    var pname = args.player.name
    if (pname == self.myName) {
      self.myTurn = true
      GAMEVIEW.toMyStartPhase()
    }

  }

  // A player starts his action phase.
  // show the recruit button
  // args = {'player':{'name':'arthur'}}
  this.actionPhase = function(args) {
    var pname = args.player.name
    if (pname == self.myName) {
      GAMEVIEW.toMyActionPhase()
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
      self.myTurn = false
    }
    self.players[pname].endTurn(args.num, args.top.name)
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
  // card1 = {'name': 'Copper', 'cost': 1, 'qty': 20, 'qtyLeft': 20, 'coins': 1}
  this.buyPhase = function(args) {
    var pname = args.player.name
    var coins = 0
    var cnames = [], cname = ''
    var playerArea = self.players[pname].viewArea
    for ( var i = 0; i < args.moneyCards.length; i++) {
      cname = args.moneyCards[i].name
      cnames.push(cname)
      coins += args.moneyCards[i].coins
      // move treasures from hand to tableau
      GAMEVIEW.moveCard([ playerArea, _hand ], [ _table, _tableau ], cname)
    }
    // apply the +coins effect
    var effect = {
      'coins' : coins
    }
    self.addResources(effect)
    // tell the view to wire the buy for cards I can afford to buy
    var buyableCards = []
    for (cname in self.cardData) {
      var card = self.cardData[cname]
      if (card.cost <= self.coins) {
        buyableCards.push(card.name)
      }
    }
    // allow the view to buy stuffs only if it's my turn
    if (self.myName == pname) {
      GAMEVIEW.toMyBuyPhase(buyableCards)
    }

  }

  // A player just bought a card. CAN be myself.
  // The card should go on top of the discard.
  // The quantity left for this card should be decreased by 1.
  // args = {'player': {'name': 'arthur'}, 'card': card1}
  this.someoneBuy = function(args) {
    var pname = args.player.name
    var cname = args.card.name
    var qtyLeft = args.card.qtyLeft
    // apply the buy effect
    var effect = {
      'buys' : -1,
      'coins' : -args.card.cost
    }
    self.addResources(effect)

    // whatever player, increase discard pile by one, and place new card on top
    self.players[pname].addToDiscard(cname)

    // if I am the one who bought that card, unblock the view
    if (pname == self.myName) {
      var myCname = self.cardBlocks.pop()
      if (myCname != cname) {
        throw 'Error when unblocking card buy: ' + myCname + ' vs ' + cname
      }
      // if no cards are blocking anymore, unblock
      if (self.cardBlocks.length == 0) {
        GAMEVIEW.networkEnableView()
      }
      // if i can buy more stuff,
      // tell the view to wire the buy for cards I can afford to buy
      // otherwise, tell the server to end my turn
      if (self.buys > 0) {
        var buyableCards = []
        for (cname in self.cardData) {
          var card = self.cardData[cname]
          if (card.cost <= self.coins) {
            buyableCards.push(card.name)
          }
        }
        GAMEVIEW.enableBuyingStacks(buyableCards)
      } else {
        GAMECOMM.sendEndMyTurn();
      }
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
    GAMEVIEW.setDiscard(playerArea, 0, null);
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
      var myCname = self.cardBlocks.pop()
      if (myCname != cname) {
        throw 'Error when unblocking card play: ' + myCname + ' vs ' + cname
      }
      // if no cards are blocking anymore, unblock
      if (self.cardBlocks.length == 0) {
        GAMEVIEW.networkEnableView()
      }

    }

  }

}

// data container for player
function Player(playerData, viewArea) {

  this.name = playerData.name
  this.viewArea = viewArea
  this.deck = {
    size : 0
  }
  this.discard = {
    size : 0,
    top : null
  }

  var self = this

  // add card to top of discard pile and increase counter by 1
  this.addToDiscard = function(cardName) {
    self.discard.size += 1
    self.discard.top = cardName
    // display animation for remote players
    if (self.viewArea != _player) {
      GAMEVIEW.buyCard(cardName, [ self.viewArea, _discard ]);
    }
    GAMEVIEW.setDiscard(self.viewArea, self.discard.size, cardName)
  }

  // set my discard area
  this.endTurn = function(size, topName) {
    self.discard.size += size
    self.discard.top = topName
    GAMEVIEW.endTurnClean(self.viewArea, self.discard.size, topName);

  }
}
