/*
 * A one-shot prototype to test a card game UI without using canvas. 
 */

view = new View();
model = new Model(view);

normalCardSize = {height:160, width:100};
smallCardSize = {height:80, width:50};

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
  var cardWidth = normalCardSize.width;
  var cardHeight = normalCardSize.height;
  
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
      
      $('.openclose').css({rotate:45, 'z-index':zlayer1});
      
      $('.largeMat').hide();

      
      /***************************************/
      /* Clickables */
      /***************************************/
      
      $('#buyingBoard').click(
		  function() { 
              view.showBuyingBoard(_open);
              $('#buyingClose').show();
	   });
	   
      $('#buyingClose').click(
      function(e) { 
          e.stopPropagation();
          $('#buyingClose').hide();
          view.showBuyingBoard(_close);
      });

      $('.openclose').click(
		  function(e) {
		          if ($(this).css("rotate") == "45deg")
                view.SlidePanels($($(this).parent()),_open);
              else
                view.SlidePanels($(this).parent(),_close);
	   });

   
    
    /***************************************/
    /* Droppables */
    /***************************************/
    
    $('#actionTableau').droppable({
      tolerance : "pointer",
      drop : function(event, ui) {
        model.dropActionTableau(ui.draggable);
        $(this).effect('highlight');
      }
    });
    //$('#actionTableau').droppable("disable");
    
    $('.handArea').droppable({
      tolerance : "pointer",
      drop : function(event, ui) {
        model.dropHand($(this),ui.draggable);
      }
    });
    //$('.handArea').droppable("disable");
    
    $('.mat').droppable({
      tolerance: "pointer",
      drop : function(event,ui) {
        model.dropMat($(this),ui.draggable);
      }
    });
    //$('.mat').droppable("disable");
    
    
    $('#playerDiscard').droppable({
      drop : function(event, ui) {
        model.dropDiscard($(this), ui.draggable);
      }
    });
    //$('.discard').droppable("disable");
    
    $('#playerDeck').droppable({
      drop : function(event, ui) {
        model.dropDeck($(this), ui.draggable);
      }
    });
    
    
    /*******************************************/
    /* Hacks */
    /*******************************************/
    // Hack to add cards, should be removed on deployment
    $('#playerDiscard').click(
        function() {
            view.addCardToHand(_left);
            view.addCardToHand(_right);
            view.addCardToHand(_across);
    });
    
    // wire the logic in deck drawing
    $('#playerDeck').click(function() {
      var $card = view.newCard('blackBeard');
      view.addCardToHand(_player, $card);
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
  /* Div Management */
  /****************************************************************/
  
  this.activateDroppable = function(area, method) {
    if (area[1] == _hand)
      $('#'+area[0]+'Hand').droppable("enable");
    else if (area[1] == _mat)
      $('#'+area[0]+'Mat').droppable("enable");
    else if (area[1] == _deck)
      $('#'+area[0]+'Deck').droppable("enable");
    else if (area[1] == _discard)
      $('#'+area[0]+'Discard').droppable("enable");
    
    if (method) {
      // TODO: Replace drop and other methods for the area
    }
  }
  
  /****************************************************************/
  /* Set Piles */
  /****************************************************************/
  
  this.setDeck = function(pos,value) {
    var deck = $('#'+ pos + _deck);
    deck.children('.stackCounter').text(value+"");
  }
  
  this.setDiscard = function(pos,value,topCardType) {
    var discard = $('#'+ pos + _discard);
    discard.children('.stackCounter').text(value+"");
    var card = this.newCard(topCardType);
    this.addCardToDiscard(card,pos);
  }
  
  /****************************************************************/
  /* Card movement */
  /****************************************************************/
  
  // Coordinates comes from game-coordinates.js.
  // Source: tuple [source player, area]. E.g. [_player,_hand], [_left,_mat], [_right,_discard].
  //         if card is the source:  [_card,card]
  this.moveCard = function(source, destination, ctype, afterMoveAnimation) {
    //var startPoint = coordinates[source]
    var animEasing="easeInOutExpo";
		var speed=900;
		var sourceSize="normal";
		var destinationSize="normal";
    
    var card = null;
    var startPoint = null;
    // If source is a card, no need to create one to move.
    if (source[0] == _card) {
        card = source[1];
    }
    else {
      startPoint = coordinates[source[0]][source[1]];
      // Am I moving a card from someone's hand? If so, actually remove it from the player's hand. 
      if (source[1] == _hand) {
        if (source[0] == _player) {
          card = $('#playerHand ._c_'+ctype).get(0);
          if (!card)
            throw "No card in hand!";
          startPoint = null;
        }
        else if (source[0] == _left || source[0] == _right || source[0] == _across) {
            card = $('#' + source[0] + 'Hand').children().get(0);
            if (ctype) {
              startPoint = [$(card).offset().left, $(card).offset().top];
              $(card).remove();
              card = view.newCard(ctype);
            }
         }
      }
      
      // Moving from a player's mat. Tricky, since I need to remove the card from his mat.
      else if (source[1] == _mat) {
        var largeStack = $('#'+source[0]+'LargeMat').children('._c_' + ctype);
        var smallStack = $('#'+source[0]+'SmallMat').children('._c_' + ctype);
        var num = smallStack.children('.stackCounter').text();
        // Reduce counter of cards after moving a card from it
        card = this.newCard(ctype);
        if (num > 1) {
          smallStack.children('.stackCounter').text(parseInt(num) - 1 + "");
          largeStack.children('.stackCounter').text(parseInt(num) - 1 + "");
          
          // Create a new card to be dragged to player hand
        }
        else {
          smallStack.remove();
          largeStack.remove();
        }
      }
      // Moving from a player's deck. Common case of drawing for example
      else if (source[1] == _deck) {
        sourceSize = "small";
        if (!ctype) { // facedown movement
          if (source[0] == _player) {
            card = this.newFacedownCard("normal");
          }
          else { /* left, across, right */
            card = this.newFacedownCard("small");
          }
        }
        else {
          if (source[0] == _player) {
            card = this.newCard(ctype);
          }
          else {
            card = this.newSmallCard(ctype);
          }
        }
      }
      // Moving from a player's discard
      else if (source[1] == _discard) {
        sourceSize = "small";      
        throw "Discard as a source not yet supported."
        // TBD: Do we need this ever? Except when reshuffling, but that should be separate..      
      }
    }
    // Use the created card and send it to the destination
    if (!startPoint) {
      var xstart = $(card).offset().left;
      var ystart = $(card).offset().top;
      var startPoint = [xstart,ystart];
    }

    // Move div outside of current parent to the "floating" parent
    $('#floating').append(card);    
    // Set the starting position in a fixed scale
    $(card).css({position:'fixed', left:startPoint[0], top:startPoint[1]});
    // Set it back to absolute (which in floating == fixed), to allow for overflow:hidden
    $(card).css({position:'absolute', 'z-index':zlayer3+1});
    
    var endPoint = coordinates[destination[0]][destination[1]];
    var moveAnimation =  {left: endPoint[0], top: endPoint[1]}
    var stepAnim = null;
    // afterMoveAnimation is used to customize behavior after moving. If not specified,
    // default behavior kicks in, adding card to hand, mat, deck, or discard.
    if (!afterMoveAnimation) {
      if (destination[1] == _mat) {
        afterMoveAnimation = function(_card_) {
          _card_.remove();
          view.addCardToMat(ctype,destination[0]);
        }
      }
      // Add card to hand of the destination player
      else if (destination[1] == _hand) {
        if (destination[0] == _player) {
          afterMoveAnimation = function(_card_) {
            _card_.remove();
            view.addCardToHand(_player,view.newCard(ctype));
          }
        }
        else {
          afterMoveAnimation = function(_card_) {
            view.addCardToHand(destination[0]);
            _card_.remove();
          }
        }
      }
      else if (destination[1] == _deck) {
        if (destination[0] != _player)
          destinationSize = "small";
        afterMoveAnimation = function(_card_) {
            _card_.remove();
        }  
      }
      else if (destination[1] == _discard) {
        if (destination[0] != _player)
            destinationSize = "small";
        afterMoveAnimation = function(_card_) {
        view.addCardToDiscard(_card_,destination[0]);
        }          
      }
      else if (destination[1] == "buying") {
        afterMoveAnimation = function(_card_) {
          view.addBuyingStack(ctype,1);
          _card_.remove();
        }
      }
    }

    if (sourceSize != destinationSize) {    
      if (destinationSize == "small") {
        // Shrink to opponent's deck size.
        moveAnimation['width'] = smallCardSize.width;
        moveAnimation['height'] = smallCardSize.height;
        
        var cardHeight = normalCardSize.height;
        var nameFontSize = parseInt($('.card>.name').css('font-size'));
        var effectFontSize = parseInt($('.card>.effect').css('font-size'));
        var costFontSize = parseInt($('.card>.cost').css('font-size'));
        
        stepAnim = function(now,fx) {
          if (fx.prop == "height") {
            p = fx.now / cardHeight;
            fn = Math.round(p*nameFontSize);
            fe = Math.round(p*effectFontSize);
            fc = Math.round(p*costFontSize);
            
            $name = $(this).children('.card>.name');
            $effect = $(this).children('.card>.effect');
            $cost = $(this).children('.card>.cost');
            
            $name.css({'font-size':fn+"px"});
            $effect.css({'font-size':fe+"px"});
            $cost.css({'font-size':fc+"px"});
          }
        }
      }
      else if (sourceSize == "small") { 
        // Shrink to opponent's deck size.
        moveAnimation['width'] = normalCardSize.width;
        moveAnimation['height'] = normalCardSize.height;
        
        var cardHeight = normalCardSize.height;
        var nameFontSize = parseInt($('.card>.name').css('font-size'));
        var effectFontSize = parseInt($('.card>.effect').css('font-size'));
        var costFontSize = parseInt($('.card>.cost').css('font-size'));
        
        stepAnim = function(now,fx) {
          if (fx.prop == "height") {
            p = fx.now / cardHeight;
            fn = Math.round(p*nameFontSize);
            fe = Math.round(p*effectFontSize);
            fc = Math.round(p*costFontSize);
            
            $name = $(this).children('.card>.name');
            $effect = $(this).children('.card>.effect');
            $cost = $(this).children('.card>.cost');
            
            $name.css({'font-size':fn+"px"});
            $effect.css({'font-size':fe+"px"});
            $cost.css({'font-size':fc+"px"});
          }
        }
      }
    }
    console.log(startPoint,endPoint,moveAnimation);
    console.log($(card));
    $(card).animate(moveAnimation, 
        {
          duration: speed, 
          easing: animEasing,
			    complete: function() {
            if (afterMoveAnimation) {
              $(card).css({'z-index':0});
              afterMoveAnimation($(card));
            }
          },
          step: stepAnim
        });

    // Reorganize hand of player, if card came from someone's hand.
    if (source[1] == _hand)
      this.reArrangeHand(source[0]);
  } // end of moveCard
  
    
  /****************************************************************/
  /* Buying Methods */ 
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
      $card.dblclick(function() {
        view.buyCard(ctype,[_player,_discard]);
      });
      leftPos = pos[1];
      topPos = pos[0];
      $card.css({position: 'absolute', left:leftPos, top:topPos});
      $card.append($counter);
      $buyingStack.append($card);
    }
    else {
      cur = stack.children('.stackCounter').text();
      stack.children('.stackCounter').text(parseInt(cur) + num + "");
    }
  }
  
  this.buyCard = function(ctype, destination) {
    var $buyingStack = $('#largeBuying');
    var stack = $buyingStack.children('._c_' + ctype);
    var num = stack.children('.stackCounter').text();
    // Reduce counter of cards after buying
    stack.children('.stackCounter').text(parseInt(num) - 1 + "");
    
    // Create a new card to be dragged to player hand
    var newcard = this.newCard(ctype);
    $('#largeBuying').append(newcard);
    if (stack.position().left == 0) {
      position = $('#buyingBoard').width()/2;
      postype = 'absolute';
      $('#buyingBoard').append(newcard);
    }
    else {
      position = stack.position();
      postype = 'absolute';
    }
    newcard.css({position: postype, 'top':position.top, 'left':position.left, 'z-index':zlayer3+1});
     
    
    if (destination[0] == _player) {
      this.moveCard([_card,newcard],[_player,destination[1]],ctype);
    }
    else {
      this.moveCard([_card,newcard],[destination[0],destination[1]],ctype);
      this.showBuyingBoard(_close);
    }
  } 
  
  /****************************************************************/
  /*  Create New Card (Mat/Shrunk/Normal/Facedown)  */
  /****************************************************************/
  
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
  
  this.newFacedownCard = function(size) {
    if (!size)
      size = "normal";
    
    var card = null;
    
    if (size == "normal") {    
      card = $('<div/>').attr({
        'class' : 'cardSized faceDown'
      })
    }
    else if (size == "small") {
      card = $('<div/>').attr({
        'class' : 'smallDeck faceDown'
      })
    }
    return card;
  }
  
  
  // Creates a new small card (discard/deck of opponents);
  this.newSmallCard = function(ctype) {
    var card = this.newCard(ctype);
    return this.shrinkCard(card);
  }

  // Shrink card to discard/deck size of opponents
  this.shrinkCard = function(card) {
    card.css({width: smallCardSize.width, height:smallCardSize.height} );
    
    effect = card.children('.card>.effect');
    $(effect).css({'font-size':Math.round(parseInt($('.card>.cost').css('font-size'))/2) });
    cost = card.children('.card>.cost');
    $(cost).css({'font-size':Math.round(parseInt($('.card>.effect').css('font-size'))/2) });
    cardName = card.children('.card>.name');
    $(cardName).css({'font-size':Math.round(parseInt($('.card>.name').css('font-size'))/2) });
    
    return card;
  }
  
  // Creates a new card of ctype.
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

    $card.draggable({
      start : function() {
        $(this).css({rotate:'', x:'', y:'', transform:''});
        model.startDraggingCard($(this));
      },
      revert : function(socketObj) {
        if(socketObj === false)
        {
          setTimeout(function() {view.reArrangeHand(_player)}, view.revertAnimationDuration);
          return true;
        }
        else {
          setTimeout(function() {view.reArrangeHand(_player)});
          return false;
        }
      },
      revertDuration: view.revertAnimationDuration,
      //containment : '#gameBoard',
      stack: '.card',
      opacity: 0.5,
    });
    return $card;
    
  } // end newCard
  
  /****************************************************************/
  /*  Div Animation effects (Buying/Mat)  */
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
		
    if (action == _open) {
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
    else if (action == _close) {
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
	  if (!pos) {
	    pos = container.attr("id");
	  }
	  $outer_container = container;
	  $openclose = $outer_container.children('.openclose');
	  var speed=900;
		var width = $outer_container.width();
		var easing="easeInOutExpo";
		
		if (pos == "leftMat" || pos == "rightMat") {
		  openAnim = {width: 80};
		  stopAnim = {width: 710};
		}
		else if (pos == "acrossMat") {
		  openAnim = {height: 80};
		  stopAnim = {height: 700};
		}
		else if (pos == "playerMat") {
  		openAnim = {height: 80};
		  stopAnim = {height: 500};
		}
		else {
  		    return false;
		}
		if(action==_close) {
		  this.enableOtherEvents(container);
		  $outer_container.children('.largeMat').hide();	
      $outer_container.children('.smallMat').show();
      $openclose.transition({"rotate":"45"});
			$outer_container.stop().animate(
			openAnim, 
			speed,easing, 
			function() {
     		  $outer_container.css({'z-index':zlayer0});
	       	//$(shrink).css({'z-index':zlayer0+1})
			});
		} 
		else {
    		this.disableOtherEvents(container);
    		$openclose.transition({"rotate":"0"});
		    $outer_container.css({'z-index':zlayer3});
			  $outer_container.stop().animate(stopAnim, speed, easing,
			  function() {
			    $outer_container.children('.smallMat').hide();
			    $outer_container.children('.largeMat').show();
			  } 
			  );		
		}
	} // end SlidePanels

  /****************************************************************/
  /*  AddCardTo Methods   */
  /****************************************************************/

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

  this.revertAnimationDuration = 500;
  this.addCardToHand = function(pos,card) {
    if (pos == _player) {
      $('#playerHand').append(card);
    }
    else {
      var $card = $('<div/>').attr({'class': 'faceDown cardSized'});
      $('#' + pos + 'Hand').append($card);
    }
    this.reArrangeHand(pos);
  }
  
  this.reArrangeHand = function(pos)
  {
    var curTop = 0;
    var curLeft = 0;
    if (pos == _tableau)
      var cards = $('#actionTableau').children(".card");
    else if (pos == _player) 
      var cards = $('#' + pos + 'Hand').children(".card");
    else 
      var cards = $('#' + pos + 'Hand').children(".faceDown");
    if (pos == _player || pos == _tableau) 
      var startZ = zlayer2;
    else
      var startZ = zlayer1;
    
    if (pos ==_player || pos == _tableau) {
        for ( i = 0; i < cards.length; i++ ) {
          $(cards[i]).css({left:curLeft, top:0, position:'absolute', 'z-index':startZ++});
          curLeft+=30;
        }
    }
    else if (pos == _left) {
        for ( i = 0; i < cards.length; i++ ) {
          $(cards[i]).css({rotate:90, top:curTop, left:-80, position:'absolute', 'z-index':startZ++});
          curTop+=30;
        }
    }
    else if (pos == _right) {
        for ( i = 0; i < cards.length; i++ ) {
          $(cards[i]).css({rotate:-90, top:curTop, right:-80, position:'absolute', 'z-index':startZ++});
          curTop+=30;
        }
    }
    else if (pos == _across){
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
      this.reArrangeHand(_tableau);
    }
  }
  
  this.addCardToDiscard = function(card,pos) {
    $($('#'+pos+'Discard').children()).remove();
    card.css({top:0,left:0});
    card.draggable("disable");
    $('#'+pos+'Discard').append(card);
  }
  
  
  /*********************/
  /* Cleaning Methods */
  /*********************/
  this.cleanTableau = function(destination) {
    cardsTableau = ($('#actionTableau').children('.card'));
    this.reArrangeHand(_tableau);
    for (i=0; i < cardsTableau.length; i++) {
      this.moveCard([_card,$(cardsTableau[i])],[destination,_discard], cardsTableau[i]);
    }
  }
  
  this.cleanHand = function(source) {
    if (source == _player)
      cardClass = ".card";
    else
      cardClass = ".cardSized";
    cardsHand = ($('#'+source+'Hand').children(cardClass));
    for (i=0; i < cardsHand.length; i++) {
      if ((source == _left) || (source == _right)) {
        if (source == _left)
          $(cardsHand[i]).css({_left:30});
        else if (source == _right)
          $(cardsHand[i]).css({_left:-30});
      }
      else if (source == _across)
        $(cardsHand[i]).css({"top":0});
        
      $(cardsHand[i]).transition({"rotate":0});    
      this.moveCard([_card,$(cardsHand[i])],[source,_discard], cardsHand[i]);
    }
  }
  
  /*****************************/
  /* Unused Methods (Future?)
  /*****************************/
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
