/*
 * A one-shot prototype to test a card game UI without using canvas. 
 */
view = new View();
model = new Model(view);

minStepAngle = 10;
minorRadius = 100;
majorRadius = 600;
radius = 100;

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


    
var isEven = function(someNumber){
    return (someNumber%2 == 0) ? true : false;
};


function View() {
  /****************************************************************/
  /* View Init */
  /****************************************************************/
  
  this.init = function() {
      $('#leftOpponent').hover(
		  function(){ //mouse over
        view.SlidePanels($(this),"close", "left");		
		  },
		  function(){ //mouse out
        view.SlidePanels($(this),"open", "left");
		  }
	  );

      $('#rightOpponent').hover(
		  function(){ //mouse over
        view.SlidePanels($(this),"close", "right");		
		  },
		  function(){ //mouse out
        view.SlidePanels($(this),"open", "right");
		  }
	  );

    $('#acrossOpponent').hover(
		  function(){ //mouse over
        view.SlidePanels($(this),"close", "top");		
		  },
		  function(){ //mouse out
        view.SlidePanels($(this),"open", "top");
		  }
	  );


    // wire the logic in deck drawing
    $('#playerDeck').click(function() {
      view.newCard('blackBeard');
    });
    
    // wire the hand logic
    $('#actionTableau').droppable({
      tolerance : "pointer",
      drop : function(event, ui) {
        model.dropActionTableau(ui.draggable);
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
          position: 'absolute',
          top : '0',
          left : '0'
        });
        ui.draggable.draggable({ // undraggable
          disabled : true
        });
      }
    });
  } // End init
  
  /****************************************************************/
  /* Card management */
  /****************************************************************/
  
  // gain a card in hand given the card id
  this.newCard = function(cid) {

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
        $(this).css({rotate:'', x:'', y:'', transform:''});
      },
      revert : function(socketObj) {
        if(socketObj === false)
        {
          setTimeout(function() {view.spreadHand($('#playerHand').children())}, view.revertAnimationDuration);
          return true;
        }
        else {
          setTimeout(function() {view.spreadHand($('#playerHand').children())});
          return false;
        }
      },
      revertDuration: view.revertAnimationDuration,
      containment : '#gameBoard',
      stack: '.card',
      opacity: 0.5,
    });

    view.addCardToHand($card);
  } // end newCard
  
  /****************************************************************/
  /*  Scrolling effect  */
  /****************************************************************/
    //slide in/out left pane function
	this.SlidePanels = function(container,action, pos){
	  $outer_container = container;
		var speed=900;
		if (pos == "left" || pos == "right") {
		  openAnim = {width: 100};
		  stopAnim = {width: 710};
		}
		else if (pos == "top") {
		  openAnim = {height: 100};
		  stopAnim = {height: 710};
		}
		else {
  		return false;
		}
		
		var width = $outer_container.width();
		var easing="easeInOutExpo";
		if(action=="open"){
			$outer_container.stop().animate(
			openAnim, 
			speed,easing, 
			function() {
			  $outer_container.css({'background-color':''});
			});

			
		} else {
			$outer_container.stop().animate(stopAnim, speed, easing);		
      $outer_container.css({'background-color':'green'});
		}
	}

  /****************************************************************/
  /*  Card animations   */
  /****************************************************************/

  this.revertAnimationDuration = 500;

  this.addCardToTableau = function(card) {
    card.css({left: 0, top: 0, rotate: 0, position:'relative', x:0, y:0});
    card.draggable( "disable" );
    $('#actionTableau').append(card);
  }
  
  this.reArrangeHand = function(cards) {
    // this.rotateHand(cards);
    this.spreadHand(cards);
  }
  
  this.rotateHand = function(cards) {
    
    numCards = cards.length;
    
    //stepAngle = ((180/numCards > minStepAngle) ? minStepAngle : 180/numCards)/2;
    stepAngle = 15;
    startIndex = 0;
    
    if (!isEven(numCards)) {
      $(cards[Math.floor(numCards/2)]).transition({ rotate: 0}, 10).transition({ x: 0, y: -radius}, 50 );
      $(cards[Math.floor(numCards/2)]).css({'left':150, 'position':'absolute'});
    }
    
    angle = stepAngle;  
    if (numCards > 1) {
      for ( i = 0; i < numCards/2; i++ ) {

        radians = angle * (Math.PI/180);
        
        //radius = minorRadius/majorRadius * Math.sqrt(Math.pow(majorRadius,2) - Math.tan(radians) * minorRadius);
        
        $(cards[Math.floor(numCards/2) -i - 1]).transition({ rotate: -angle }, 10).transition({ x: 0, y: -radius}, 50);        
        $(cards[Math.ceil(numCards/2) + i]).transition({ rotate: angle  }, 10).transition({ x: 0, y: -radius}, 50);
        $(cards[Math.floor(numCards/2) -i - 1]).css({'left':150, 'position':'absolute'});
        $(cards[Math.ceil(numCards/2) + i]).css({'left':150, 'position':'absolute'});        

        angle+=stepAngle; 
      }
    }    
  } // end rotateHand
  
  this.spreadHand = function(cards) {
    curLeft = 0;
    startZ = 1000;
    
    for ( i = 0; i < cards.length; i++ ) {
      $(cards[i]).css({left:curLeft, top:0, position:'absolute', 'z-index':startZ++});
      curLeft+=30;
    }
  } // end spreadHand
    
  this.addCardToHand = function(card) {
    $('#playerHand').append(card);
    
    cards = $('#playerHand').children();
    this.reArrangeHand(cards);
  }
  
} // end class View()

// on load
$(function() {
  view.init();
})
