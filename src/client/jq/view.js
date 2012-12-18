/*
 * A one-shot prototype to test a card game UI without using canvas. 
 */

// model data
var cardData = {
  'anneBonny' : {
    'name' : 'Anne Bonny',
    'cost' : 5,
    'img' : 'anne_bonny.jpg',
    'effect' : '+3 cards'
  },
  'blackBart' : {
    'name' : 'Black Bart',
    'cost' : 4,
    'img' : 'black_bart.jpg',
    'effect' : '+1 card<br/>+1 buy'
  },
  'blackBeard' : {
    'name' : 'Black Beard',
    'cost' : 3,
    'img' : 'black_beard.jpg',
    'effect' : '+1 coin'
  }
}

// hack to keep cards on top of each others when clicked or dragged
var curZ = 1;

// gain a card in hand given the card id
var gainCard = function(cid) {

  var c = cardData[cid]
  var $img = $('<img/>').attr({
    src : 'img/' + c.img
  });
  var $title = $('<span/>').text(c.name).attr({
    'class' : 'name'
  });
  var $cost = $('<span/>').text(c.cost).attr({
    'class' : 'cost'
  });
  var $effects = $('<span/>').html(c.effect).attr({
    'class' : 'effect'
  });

  var $card = $('<div/>').attr({
    'class' : 'card',
  }).append($title, $cost, $img, $effects);
  // keep cards on top of each others when clicked or dragged
  $card.draggable({
    start : function() {
      $(this).css("z-index", curZ++)
    },
    containment : '#body',
    revert : 'invalid' // revert when dropped at a wrong location
  });
  $card.click(function() {
    $(this).css('z-index', curZ++)
  });

  $('#hand').append($card);
}

// on load
$(function() {

  // wire the logic in deck drawing
  $('#deck').click(function() {
    gainCard('blackBeard');
  });

  // add face-down cards on the deck pile
  var $fdCard1 = $('<div>').attr({
    'class' : 'stacktop'
  }).css({
    top : '20px',
    left : '20px'
  });
  var $fdCard2 = $('<div>').attr({
    'class' : 'stacktop'
  }).css({
    top : '30px',
    left : '30px'
  });
  $('#deck').append($fdCard1, $fdCard2);

  // wire the drop logic for the discard
  $('#discard').droppable({
    drop : function(event, ui) {
      $(this).effect('highlight');
    }
  });


})
