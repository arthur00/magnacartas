/*
 * Model for card game.
 */

/*********************************************/
/**** Global Variables ****/
/*********************************************/

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

// stores game logic and data
function Model(view) {
  var hand = new Array();
  var tableau = new Array();
  // -------- INITIALIZATION ---------------------------

  var init = function() {
  }
  
  var addCardToHand = function(card) {
    hand.push(card);
    view.addCardToHand(card);
  }
  
  var addCardToTableau = function(card){
    tableau.push(card);
    view.addCardToTableau(card);
  }
  
  this.setDeck = function(pos,value) {
    //TODO: store locally in model
    view.setDeck(pos,value);
  }  
  
  this.setDiscard = function(pos,value,topCard) {
    //TODO: store locally in model
    view.setDiscard(pos,value,topCard);
  }
  
  /*********************************************/
  /**** Helper ****/
  /*********************************************/
  
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
    for (i=0; i < classes.length; i++) {
      var idx = classes[i].indexOf("_c_");
      if (idx > -1) {
        ctype = classes[i].slice(idx+3);
        return ctype;
      }
    }
  }
 
  /*********************************************/
  /**** Events ****/
  /*********************************************/
  this.startDraggingCard = function(card) {
    ctype = this.getCtypeFromCard(card);
    // Turn on/off droppables
  }
  
  this.stopDraggingCard = function(card) {
    // Fires before the droppable event! Nice.. 
    // http://stackoverflow.com/questions/8092771/jquery-drag-and-drop-checking-for-a-drop-outside-a-droppable
  }
  
  // Normal drop in hand. Adds the card to the player's hand.
  this.dropHand = function(container,card) {
    pos = this.getPosFromContainer(container);
    view.addCardToHand(pos,card);
    view.reArrangeHand(_player);
  }
  
  this.dropDeck = function(container,card) {
    // Currently nothing. In the future, may allow for cards that goes on top of deck.
    card.remove();
    view.reArrangeHand(_player);
  }
  
  // For player only!  
  this.dropDiscard = function(container,card) {
    view.addCardToDiscard(card,_player);
    view.reArrangeHand(_player);
  }
  
  this.dropMat = function(container,card) {
    card.remove();
    ctype = this.getCtypeFromCard(card);
    pos = this.getPosFromContainer(container);
    view.addCardToMat(ctype,pos);
    view.reArrangeHand(_player);
  }
  
  this.dropActionTableau = function(card) {
    addCardToTableau(card);
    view.reArrangeHand(_player);
  }
}
