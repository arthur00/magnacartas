/*
 * Model for card game.
 */


// stores game logic and data
function Model(view) {
  hand = new Array();
  tableau = new Array();
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
  
  /*********************************************/
  /**** Helper ****/
  /*********************************************/
  
  this.getPosFromContainer = function(container) {
    if (container.attr("id").indexOf("player") > -1)
      return "player"
    else if (container.attr("id").indexOf("left") > -1) 
      return "left"
    else if (container.attr("id").indexOf("right") > -1) 
      return "right";
    else if (container.attr("id").indexOf("across") > -1) 
      return "across";
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
  }
  
  // Normal drop in hand. Adds the card to the player's hand.
  this.dropHand = function(container,card) {
    pos = this.getPosFromContainer(container);
    view.addCardToHand(pos,card);
  }
  
  // For player only!  
  this.dropDiscard = function(container,card) {
    view.addCardToDiscard(card,"player");
  }
  
  this.dropMat = function(container,card) {
    card.remove();
    ctype = this.getCtypeFromCard(card);
    pos = this.getPosFromContainer(container);
    view.addCardToMat(ctype,pos);
  }
  
  this.dropActionTableau = function(card) {
    addCardToTableau(card);
  }
}
