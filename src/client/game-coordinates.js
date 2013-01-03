/* Magnacartas: Coordinates */
/* Stores all coordinates using values in the stylesheet */ 

function Coordinates() {
  coordinates = {
      'player' : {
        'Hand' : [$('#playerHand').offset().left,$('#playerHand').offset().top],
        'Mat' : [512,610-160],
        'Deck' : [$('#playerDeck').offset().left, $('#playerDeck').offset().top],
        'Discard' : [$('#playerDiscard').offset().left, $('#playerDiscard').offset().top]
      },
      'left' : {
        'Hand' : [50,240],
        'Mat' : [50+80,240],
        'Deck' : [$('#leftDeck').offset().left, $('#leftDeck').offset().top],
        'Discard' : [$('#leftDiscard').offset().left, $('#leftDiscard').offset().top]
      },
      'right' : {
        'Hand' : [1024-50,240],
        'Mat' : [1024-50-80,240],
        'Deck' : [$('#rightDeck').offset().left, $('#rightDeck').offset().top],
        'Discard' : [$('#rightDiscard').offset().left, $('#rightDiscard').offset().top]
      },
      'across' : {
        'Hand' : [$('#acrossHand').offset().left,$('#acrossHand').offset().top],
        'Mat' : [512,100],
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
