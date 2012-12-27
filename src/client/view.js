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
  var zlayer0 = 1;
  var zlayer1 = 1000;
  var zlayer2 = 2000;
  var zlayer3 = 3000;
  
  this.init = function() {
      $('#leftShrink').hide();
      $('#leftShrink').css({rotate:180});
      $('#rightShrink').hide();
      $('#acrossShrink').hide();
      $('#acrossShrink').css({rotate: 90});
      $('#playerShrink').hide();
      $('#playerShrink').css({rotate: 90});
      
      $('#leftLargeMat').hide();
      $('#rightLargeMat').hide();
      $('#acrossLargeMat').hide();
      $('#playerLargeMat').hide();
      
      $('#playerMat').click(
		  function() { //mouse over
              view.SlidePanels($(this),"open", "player");
              $('#playerShrink').show();
	   });
		  
      $('#playerShrink').click(
		  function(e) { //mouse out
		      e.stopPropagation();
		      $('#playerShrink').hide();
              view.SlidePanels($('#playerMat'),"close", "player");
	   });
                  
      $('#leftMat').click(
		  function() { //mouse over
              view.SlidePanels($(this),"open", "left");
              $('#leftShrink').show();
	   });
		  
      $('#leftShrink').click(
		  function(e) { //mouse out
		      e.stopPropagation();
		      $('#leftShrink').hide();
              view.SlidePanels($('#leftMat'),"close", "left");
	   });
	   

      $('#rightMat').click(
		  function() { //mouse over
    		  $('#rightShrink').show();
              view.SlidePanels($(this),"open", "right");
	   });
	  
		  
      $('#rightShrink').click(
		  function(e) { //mouse out
		      $('#rightShrink').hide();
		      e.stopPropagation();
              view.SlidePanels($('#rightMat'),"close", "right");
	   });
	   
	   $('#acrossMat').click(
		  function() { //mouse over
		      $('#acrossShrink').show();
              view.SlidePanels($(this),"open", "across");
	   });
	  
		  
      $('#acrossShrink').click(
		  function(e) { //mouse out
		      $('#acrossShrink').hide();
		      e.stopPropagation();
              view.SlidePanels($('#acrossMat'),"close", "across");
	   });


    // wire the logic in deck drawing
    $('#playerDeck').click(function() {
      $card = view.newCard('blackBeard');
      view.addCardToHand($card);
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
    
    $('#playerDiscard').click(
        function() {
            view.newCardOpponent($('#leftCards'),"left");
            view.newCardOpponent($('#rightCards'),"right");
            view.newCardOpponent($('#acrossCards'),"across");
    });
  } // End init
  
  /****************************************************************/
  /* Card movement */
  /****************************************************************/
  var leftEndPoint = [50,240];
  var rightEndPoint = [1024-50,240];
  var topEndPoint = [50,240];
  
  this.drawCardFromPlayer = function(destination, ctype) {
    var card = $('#playerHand ._c_'+ctype).get(0);
    var xstart = $(card).offset().left;
    var ystart = $(card).offset().top;
    var startPoint = [xstart,ystart];
    $('#floating').append(card);
    $(card).css({position:'fixed', top:ystart, left:xstart});    
    if (destination == "left") {
      $(card).animate({
        crSpline: $.crSpline.buildSequence([startPoint, [400,0], [800,200],leftEndPoint])},
        1000,
        function() { $(card).hide("explode",500); setTimeout(function() {$(card).remove()},500) }
      );
    }
    else if (destination == "right") {
      $(card).animate({
        crSpline: $.crSpline.buildSequence([startPoint, [400,0], [800,200],rightEndPoint])},
        1000,
        function() { $(card).hide("explode",500); setTimeout(function() {$(card).remove()},500) }
      );
    }
    else if (destination == "across") {
      $(card).animate({
        crSpline: $.crSpline.buildSequence([startPoint, [400,0], [800,200],topEndPoint])},
        1000,
        function() { $(card).hide("explode",500); setTimeout(function() {$(card).remove()},500) }
      );
    }
    else {
      return False;
    }
  }
  
  /****************************************************************/
  /* Card management */ 
  /****************************************************************/
  
  this.addCardToMat = function(ctype,pos) {
    $smallMat = $('#' + pos + 'SmallMat');
    $largeMat = $('#' + pos + 'LargeMat');

    smallStack = $smallMat.children('._c_'+ctype);
    
    if (smallStack.length == 0) {
      smallCard = view.newMatCard(ctype);
      card = view.newCard(ctype);

      var $counterSmall = $('<div/>');
      $counterSmall.addClass('stackCounter');
      $counterSmall.text('1');
      
      $(smallCard).append($counterSmall);
      
      var $counterBig = $('<div/>');
      $counterBig.addClass('stackCounter');
      $counterBig.text('1');
      
      $(smallCard).append($counterSmall);
      $(card).append($counterBig);

      $smallMat.append(smallCard);
      $largeMat.append(card);
    }
    else {
      bigStack = $largeMat.children('._c_' + ctype);
      
      num = smallStack.children('.stackCounter').text();
      
      smallStack.children('.stackCounter').text(parseInt(num) + 1 + "");
      bigStack.children('.stackCounter').text(parseInt(num) + 1 + "");
    }
  }
  
  this.newMatCard = function(ctype) {
    var c = cardData[ctype];
    var $card = $('<div/>');
    $card.addClass('smallCard _c_'+ctype);
    var $img = $('<img/>').attr({
      src : 'img/' + c.img,
      width: '100%'
    });
    $card.append($img);
    return $card;
  }
  
  // gain a card in hand given the card id
  this.newCard = function(ctype) {

    var c = cardData[ctype];
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
      'class' : 'card _c_'+ctype,
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
    return $card;
    
  } // end newCard
  
  /****************************************************************/
  /*  Scrolling effect  */
  /****************************************************************/
    //slide in/out left pane function
	this.SlidePanels = function(container,action, pos){
	  $outer_container = container;
	  shrink = $outer_container.children(".shrink");
	    var speed=900;
		if (pos == "left" || pos == "right") {
		  openAnim = {width: 80};
		  stopAnim = {width: 710};
		}
		else if (pos == "across") {
		  openAnim = {height: 80};
		  stopAnim = {height: 710};
		}
		else if (pos == "player") {
  		openAnim = {height: 80};
		  stopAnim = {height: 500};
		}
		else {
  		    return false;
		}		
		var width = $outer_container.width();
		var easing="easeInOutExpo";
		if(action=="close") {
		  $outer_container.children('.largeMat').hide();		
      $outer_container.children('.smallMat').show();		
			$outer_container.stop().animate(
			openAnim, 
			speed,easing, 
			function() {

     		  $outer_container.css({'z-index':zlayer0});
	       	$(shrink).css({'z-index':zlayer0+1})
			});
		} 
		else {
		    $outer_container.css({'z-index':zlayer3});
		    $(shrink).css({'z-index':zlayer3});
			  $outer_container.stop().animate(stopAnim, speed, easing,
			  function() {
			    $outer_container.children('.smallMat').hide();
			    $outer_container.children('.largeMat').show();
			  } 
			  );		
		}
	}

  /****************************************************************/
  /*  Card animations   */
  /****************************************************************/

  this.revertAnimationDuration = 500;
  
  this.newCardOpponent = function(opponentHand, pos) {
    var $card = $('<div/>').attr({'class': 'faceDown card'});
    opponentHand.append($card);
    
    var curTop = 0;
    var curLeft = 0;
    var cards = opponentHand.children(".card");
    var startZ = zlayer1;
    
    if (pos == "left") {
        for ( i = 0; i < cards.length; i++ ) {
          $(cards[i]).css({rotate:90, top:curTop, left:-80, position:'absolute', 'z-index':startZ++});
          curTop+=30;
        }
    }
    else if (pos == "right") {
        for ( i = 0; i < cards.length; i++ ) {
          $(cards[i]).css({rotate:-90, top:curTop, right:-80, position:'absolute', 'z-index':startZ++});
          curTop+=30;
        }
    }
    else {
        for ( i = 0; i < cards.length; i++ ) {
          $(cards[i]).css({rotate:180, left:curLeft, top:-110, position:'absolute', 'z-index':startZ++});
          curLeft+=30;
        }
    }
  }

  this.addCardToTableau = function(card) {
    card.css({left: 0, top: 0, rotate: 0, position:'relative', x:0, y:0});
    card.draggable( "disable" );
    $('#actionTableau').append(card);  
    cards = $('#actionTableau').children();
    
    if (cards.length > 3) {
      this.spreadHand(cards);
    }
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
    startZ = zlayer2;
    
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
