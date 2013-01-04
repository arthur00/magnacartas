/* Magnacartas: Coordinates */
/* Stores all coordinates using values in the stylesheet */ 

function Coordinates() {
  coordinates = {
      'player' : {
        'Hand' : [$('#playerHand').offset().left,$('#playerHand').offset().top],
        'Mat' : [$('#playerMat').offset().left,$('#playerMat').offset().top],
        'Deck' : [$('#playerDeck').offset().left, $('#playerDeck').offset().top],
        'Discard' : [$('#playerDiscard').offset().left, $('#playerDiscard').offset().top]
      },
      'left' : {
        'Hand' : [$('#leftHand').offset().left,$('#leftHand').offset().top],
        'Mat' : [$('#leftMat').offset().left,$('#leftMat').offset().top],
        'Deck' : [$('#leftDeck').offset().left, $('#leftDeck').offset().top],
        'Discard' : [$('#leftDiscard').offset().left, $('#leftDiscard').offset().top]
      },
      'right' : {
        'Hand' : [$('#rightHand').offset().left,$('#rightHand').offset().top],
        'Mat' : [$('#rightMat').offset().left,$('#rightMat').offset().top],
        'Deck' : [$('#rightDeck').offset().left, $('#rightDeck').offset().top],
        'Discard' : [$('#rightDiscard').offset().left, $('#rightDiscard').offset().top]
      },
      'across' : {
        'Hand' : [$('#acrossHand').offset().left,$('#acrossHand').offset().top],
        'Mat' : [$('#acrossMat').offset().left,$('#acrossMat').offset().top],
        'Deck' : [$('#acrossDeck').offset().left, $('#acrossDeck').offset().top],
        'Discard' : [$('#acrossDiscard').offset().left, $('#acrossDiscard').offset().top]
      },
      'table' : {
        'buying' : [$('#smallBuying').offset().left, $('#smallBuying').offset().top],
        'tableau' : [$('#actionTableau').offset().left, $('#actionTableau').offset().top]
      }
  }
}
$(function() {
  new Coordinates();
})
