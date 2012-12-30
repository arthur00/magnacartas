/* Magnacartas: Coordinates */
/* Stores all coordinates using values in the stylesheet */ 

function Coordinates() {
  coordinates = {
      'player' : {
        'hand' : [512,610],
        'mat' : [512,610-160],
        'deck' : [$('#playerDeck').offset().left, $('#playerDeck').offset().top],
        'discard' : [$('#playerDiscard').offset().left, $('#playerDiscard').offset().top]
      },
      'left' : {
        'hand' : [50,240],
        'mat' : [50+80,240],
        'deck' : [$('#leftDeck').offset().left, $('#leftDeck').offset().top],
        'discard' : [$('#leftDiscard').offset().left, $('#leftDiscard').offset().top]
      },
      'right' : {
        'hand' : [1024-50,240],
        'mat' : [1024-50-80,240],
        'deck' : [$('#rightDeck').offset().left, $('#rightDeck').offset().top],
        'discard' : [$('#rightDiscard').offset().left, $('#rightDiscard').offset().top]
      },
      'across' : {
        'hand' : [512,20],
        'mat' : [512,100],
        'deck' : [$('#acrossDeck').offset().left, $('#acrossDeck').offset().top],
        'discard' : [$('#acrossDiscard').offset().left, $('#acrossDiscard').offset().top]
      },
      'buying' : {
        'buying' : [$('#smallBuying').offset().left, $('#smallBuying').offset().top]
      }
  }
}
$(function() {
  new Coordinates();
})
