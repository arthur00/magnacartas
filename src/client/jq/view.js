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

// on load
$(function() {

  // create a bunch of cards
  for (cid in cardData) {
    var c = cardData[cid]

    var $img = $('<img/>').attr({
      id : cid,
      src : 'img/' + c.img
    })

    var $title = $('<h3/>').text(c.name)

    var $cost = $('<span/>').text(c.cost).attr({
      'class' : 'cost'
    })

    var $effects = $('<span/>').html(c.effect).attr({
      'class' : 'effect'
    })

    var $card = $('<div/>').attr({
      'class' : 'card'
    }).append($title, $cost, $img, $effects)

    $('body').append($card)
  }

  // hack to keep cards on top of each others when dragged
  var curZ = 1;
  $('.card').draggable({
    start : function() {
      $(this).css("z-index", curZ++)
    },
    containment : 'body'
  })

})
