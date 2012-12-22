/*
 * A one-shot prototype to test a card game UI without using canvas. 
 */
view = new View();
model = new Model(view);

minStepAngle = 30;
radius = 0;
    
var isEven = function(someNumber){
    return (someNumber%2 == 0) ? true : false;
};

function View() {
  this.addCardToTableau = function(card) {
    card.css({left: 0, top: 0});
    $('#playerTableau').append(card);
  }  
    
  this.addCardToHand = function(card) {
    /*
    card.css({'position':'absolute'});
    card.css({'top':"50%"});
    card.css({'left':"50%"});*/
    $('#playerHand').append(card);
    
    cards = $('#playerHand').children();

    numCards = cards.length;
    
    stepAngle = ((180/numCards > minStepAngle) ? minStepAngle : 180/numCards)/2;
    startIndex = 0;
    
    if (!isEven(numCards)) {
      $(cards[Math.floor(numCards/2)]).transition({ rotate: 0}).transition({ x: 0, y: -radius} );
    }
    
    angle = stepAngle;  
    if (numCards > 1) {
      for ( i = 0; i < numCards/2; i++ ) {
        radians = angle * (Math.PI/180);
        
        $(cards[Math.floor(numCards/2) -i - 1]).transition({ rotate: -angle  }).transition({ x: 0, y: -radius});        
        $(cards[Math.ceil(numCards/2) + i]).transition({ rotate: angle  }).transition({ x: 0, y: -radius});
        angle=angle*2; 
      }
    }
    
  }
}


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
    containment : '#gameBoard',
    revert : 'invalid' // revert when dropped at a wrong location
  });
  $card.click(function() {
    $(this).css('z-index', curZ++)
  });

  view.addCardToHand($card);

}

// on load
$(function() {
  //$('#playerDeck').transition({rotate:30});
  // wire the logic in deck drawing
  $('#playerDeck').click(function() {
    gainCard('blackBeard');
  });
  
  // wire the hand logic
  $('#playerTableau').droppable({
    tolerance : "pointer",
    drop : function(event, ui) {
      model.dropPlayerTableau(ui.draggable);
      $(this).effect('highlight');
    }
  });
  
  $('#playerHand').droppable({
    tolerance : "pointer",
    drop : function(event, ui) {
      model.dropPlayerHand(ui.draggable);
    }
  });
  
  // wire the drop logic for the discard
  $('#playerDiscard').droppable({
    drop : function(event, ui) {
      $(this).effect('highlight');
      $(this).append(ui.draggable);
      ui.draggable.css({
        top : '10px',
        left : '10px',
        position : 'relative'
      });
      ui.draggable.draggable({ // undraggable
        disabled : true
      });
    }
  });
})
