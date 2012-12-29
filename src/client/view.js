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

function calculateGrid(container,spacing) {
  var width = container.width();
  var height = container.height();
  var cardWidth = $('.card').width();
  var cardHeight = $('.card').height();
  
  var maxY = Math.floor(height / (cardHeight + spacing));
  var maxX = Math.floor(width / (cardWidth + spacing));
  var grid = new Array(maxY);
  for (i = 0; i < maxY; i++) {
    grid[i] = new Array(maxX);
    for (j = 0; j < maxX; j++) {
      grid[i][j] = [spacing + i*(cardHeight+spacing), spacing + j*(cardWidth+spacing)];
    }
  }
  return grid;
}


function View() {
  /****************************************************************/
  /* View Init */
  /****************************************************************/
  var zlayer0 = 1;
  var zlayer1 = 1000;
  var zlayer2 = 2000;
  var zlayer3 = 3000;
  
  this.init = function() {
      // Sets up the grid spaces for placing buy cards in the buying board
      buyingGrid = calculateGrid($('#largeBuying'), 10);

      $('#buyingClose').hide();
      $('#largeBuying').hide();
      $('#hiddenLayer').hide();
      
      $('#leftShrink').hide();
      $('#leftShrink').css({rotate:180});
      $('#rightShrink').hide();
      $('#acrossShrink').hide();
      $('#acrossShrink').css({rotate: -90});
      $('#playerShrink').hide();
      $('#playerShrink').css({rotate: 90});
      
      $('#leftLargeMat').hide();
      $('#rightLargeMat').hide();
      $('#acrossLargeMat').hide();
      $('#playerLargeMat').hide();
      
      $('#buyingBoard').click(
		  function() { 
              view.showBuyingBoard("open");
              $('#buyingClose').show();
	   });
	   
      $('#buyingClose').click(
      function(e) { 
          e.stopPropagation();
          $('#buyingClose').hide();
          view.showBuyingBoard("close");
      });
      
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
		  function() { 
              view.SlidePanels($(this),"open", "left");
              $('#leftShrink').show();
	   });
		  
      $('#leftShrink').click(
		  function(e) { 
		      e.stopPropagation();
		      $('#leftShrink').hide();
              view.SlidePanels($('#leftMat'),"close", "left");
	   });
	   

      $('#rightMat').click(
		  function() { 
    		  $('#rightShrink').show();
              view.SlidePanels($(this),"open", "right");
	   });
	  
		  
      $('#rightShrink').click(
		  function(e) { 
		      $('#rightShrink').hide();
		      e.stopPropagation();
              view.SlidePanels($('#rightMat'),"close", "right");
	   });
	   
	   $('#acrossMat').click(
		  function() { 
		      $('#acrossShrink').show();
              view.SlidePanels($(this),"open", "across");
	   });
	  
		  
      $('#acrossShrink').click(
		  function(e) { 
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
            view.newCardOpponent("left");
            view.newCardOpponent("right");
            view.newCardOpponent("across");
    });
  } // End init
  
  this.disableOtherEvents = function(container) {
    $('#gameBoard').css({'pointer-events':'none'});
    container.css({'pointer-events':'auto'});
    this.greyOutOthers();
  }
  
  this.enableOtherEvents = function(container) {
    container.css({'pointer-events':''});
    $('#gameBoard').css({'pointer-events':'auto'});
    $('#gameBoard').unbind('click');
    this.cancelGreyOut();
  }

  this.disableAllEvents = function() {
    $('#gameBoard').css({'pointer-events':'none'});
  }
  
  this.enableAllEvents = function () {
    $('#gameBoard').css({'pointer-events':'auto'});
  }  
  
  this.greyOutOthers = function () {
    $('#hiddenLayer').show();
  }
  
  this.cancelGreyOut = function () {
    $('#hiddenLayer').hide();
  }
  
  /****************************************************************/
  /* Card movement */
  /****************************************************************/
  
  // Coordinates comes from game-coordinates.js.  
  this.moveCardFromHand = function(source, destination, ctype, afterMoveAnimation) {
    if (source == "player") 
      var card = $('#' + source + 'Hand ._c_'+ctype).get(0);
    else if (source == "left" || source == "right" || source == "across")
      var card = $('#' + source + 'Hand').children().get(0);
    else // source is a card 
      var card = source;
    var xstart = $(card).offset().left;
    var ystart = $(card).offset().top;
    var startPoint = [xstart,ystart];
    $('#floating').append(card);
    $(card).css({position:'fixed', top:ystart, left:xstart});
    var endPoint = null;
    if (destination == "left")
      endPoint = leftEndPoint;
    else if (destination == "right")
      endPoint = rightEndPoint;
    else if (destination == "across")
      endPoint = acrossEndPoint;
    else if (destination == "player")
      endPoint = playerEndPoint;      
          
    $(card).animate({
      crSpline: $.crSpline.buildSequence([startPoint ,endPoint])},
      500,
      function() {
        if (afterMoveAnimation)
          afterMoveAnimation($(card));
      }
    );

    if (source == 'left' || source == 'right' || source == 'player' || source == 'across')
      this.reArrangeHand(source);
  }
  
  /****************************************************************/
  /* Card management */ 
  /****************************************************************/
  
  this.generateBuyingPiles = function() {
    this.addBuyingStacks(
      [ 
        {'ctype': 'blackBeard', 'num' : 10, 'pos' : buyingGrid[0][0]},
        {'ctype': 'blackBart', 'num' : 10, 'pos' : buyingGrid[0][1]},
        {'ctype': 'anneBonny', 'num' : 10, 'pos' : buyingGrid[0][2]}
      ]
    );
  }
  
  this.addBuyingStacks = function(stacks) {
    var $buyingStack = $('#largeBuying');
    $($buyingStack.children()).remove('.card');
    for (i = 0; i < stacks.length; i++) {
      this.addBuyingStack(stacks[i].ctype,stacks[i].num,stacks[i].pos);
    }
  }
  
  this.addBuyingStack = function(ctype,num, pos) {
    var $buyingStack = $('#largeBuying');
    stack = $buyingStack.children('._c_' + ctype);

    if (stack.length == 0) {
      var $counter = $('<div/>');
      $counter.addClass('stackCounter');
      $counter.text("" + num);
      
      var $card = this.newCard(ctype);
      $card.draggable('disable');
      leftPos = pos[1];
      topPos = pos[0];
      $card.css({position: 'absolute', left:leftPos, top:topPos});
      $card.append($counter);
      $buyingStack.append($card);
    }
    else {
      num = stack.children('.stackCounter').text();
      stack.children('.stackCounter').text(parseInt(num) + 1 + "");
    }
  }
  
  this.buyCard = function(ctype, destination) {
    var $buyingStack = $('#largeBuying');
    stack = $buyingStack.children('._c_' + ctype);
    num = stack.children('.stackCounter').text();
    // Reduce counter of cards after buying
    stack.children('.stackCounter').text(parseInt(num) - 1 + "");
    
    // Create a new card to be dragged to player hand
    var newcard = this.newCard(ctype);
    $('#largeBuying').append(newcard);
    console.log(stack.offset());
    newcard.css({position: 'absolute', 'top':stack.position().top, 'left':stack.position().left, 'z-index':zlayer3+1});
    
    if (destination == "player") 
      this.playerBuyCard(ctype,newcard);
    else {
      newcard.remove();
      // Code for sending "bad habits/illnesses"
    }
  } 
  
  this.playerBuyCard = function(ctype,newcard) {
    // Move newly created card to player hand
    this.moveCardFromHand(newcard,"player",ctype, function(newcard) {view.addCardToHand(newcard);});
  }
  
  this.addCardToMat = function(ctype,pos) {
    $smallMat = $('#' + pos + 'SmallMat');
    $largeMat = $('#' + pos + 'LargeMat');

    smallStack = $smallMat.children('._c_'+ctype);
    
    if (smallStack.length == 0) {
      smallCard = view.newMatCard(ctype);
      card = this.newCard(ctype);

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
          setTimeout(function() {view.reArrangeHand("player")}, view.revertAnimationDuration);
          return true;
        }
        else {
          setTimeout(function() {view.reArrangeHand("player")});
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
  /*  Animations effect  */
  /****************************************************************/
  this.showBuyingBoard = function(action) {
    var container = $('#buyingBoard');
    var small = $('#smallBuying');
    var large = $('#largeBuying');
    var closeButton = container.children(".close");
		var easing="easeInOutExpo";
		var speed=900;
		
		var openAnim = { width: 800, height: 730, top: 10, left:112 };
		var closeAnim = { width: 300, height: 80, top: 160, left:362 };
		
    if (action == "open") {
      this.disableOtherEvents(container);
      small.hide();		
      container.css({'z-index':zlayer3});
      container.stop().animate(
			openAnim, 
			speed,easing, 
			function() {
 		      large.show();
	       	$(closeButton).css({'z-index':zlayer3})
			});
    }
    else if (action == "close") {
        large.hide();
        this.enableOtherEvents(container);
		    $(closeButton).css({'z-index':zlayer0});
			  container.stop().animate(closeAnim, speed, easing,
			  function() {
  			  container.css({'z-index':zlayer0});
			    small.show(); 
			  } 
			  );
    }
  } 

    //slide in/out left pane function
	this.SlidePanels = function(container,action, pos){
	  $outer_container = container;
	  shrink = $outer_container.children(".shrink");
	  var speed=900;
		var width = $outer_container.width();
		var easing="easeInOutExpo";
		
		if (pos == "left" || pos == "right") {
		  openAnim = {width: 80};
		  stopAnim = {width: 710};
		}
		else if (pos == "across") {
		  openAnim = {height: 80};
		  stopAnim = {height: 700};
		}
		else if (pos == "player") {
  		openAnim = {height: 80};
		  stopAnim = {height: 500};
		}
		else {
  		    return false;
		}		
		if(action=="close") {
		  this.enableOtherEvents(container);
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
    		this.disableOtherEvents(container);
		    $outer_container.css({'z-index':zlayer3});
		    $(shrink).css({'z-index':zlayer3});
			  $outer_container.stop().animate(stopAnim, speed, easing,
			  function() {
			    $outer_container.children('.smallMat').hide();
			    $outer_container.children('.largeMat').show();
			  } 
			  );		
		}
	} // end SlidePanels

  /****************************************************************/
  /*  Card animations   */
  /****************************************************************/

  this.revertAnimationDuration = 500;
  
  this.newCardOpponent = function(pos) {
    var $card = $('<div/>').attr({'class': 'faceDown card'});
    $('#' + pos + 'Hand').append($card);
    this.reArrangeHand(pos);
  }

  this.addCardToHand = function(card) {
    $('#playerHand').append(card);
    this.reArrangeHand("player");
  }
  
  this.reArrangeHand = function(pos)
  {
    var curTop = 0;
    var curLeft = 0;
    if (pos == "tableau")
      var cards = $('#actionTableau').children(".card");
    else  
      var cards = $('#' + pos + 'Hand').children(".card");
    if (pos == "player" || pos == "tableau") 
      var startZ = zlayer2;
    else
      var startZ = zlayer1;
    
    if (pos =="player" || pos == "tableau") {
        for ( i = 0; i < cards.length; i++ ) {
          $(cards[i]).css({left:curLeft, top:0, position:'absolute', 'z-index':startZ++});
          curLeft+=30;
        }
    }
    else if (pos == "left") {
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
    else if (pos == "across"){
        for ( i = 0; i < cards.length; i++ ) {
          $(cards[i]).css({rotate:180, left:curLeft, top:-110, position:'absolute', 'z-index':startZ++});
          curLeft+=30;
        }
    }
  } // end reArrangeHand

  this.addCardToTableau = function(card) {
    card.css({left: 0, top: 0, rotate: 0, position:'relative', x:0, y:0});
    card.draggable( "disable" );
    $('#actionTableau').append(card);  
    cards = $('#actionTableau').children();
    
    if (cards.length > 3) {
      this.reArrangeHand("tableau");
    }
  }
  
  this.cleanTableau = function() {
    $($('#actionTableau').children()).remove('.card');
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
} // end class View()

// on load
$(function() {
  view.init();
})
