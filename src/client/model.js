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

  /**** Events ****/
  this.dropPlayerHand = function(card) {
    addCardToHand(card);
  }
  
  this.dropActionTableau = function(card) {
    addCardToTableau(card);
  }
  
}
