""" Cards are lazily instantiated: 
- each pile to buy from is only a class 
with a class variable indicating how many are left,
- when a player buys a card, that card is instantiated, 
and decreases the quantity left of the class of the card by 1

The alternative was: at game start, instantiate as many cards as needed, 
ie around 200, and create an instance of a Pile, 
where a Pile would store how many cards are left in it.
"""
from logger import logger

class Card():
    name = ''
    cost = 0 # 1 for copper, 7 for gold
    qty = 0 # how many cards can be bought in the pile, at game start
    qty_left = 0 # how many cards are left to buy

    def __init__(self, game, sampler=False):
        """ When created, a card decreases the number of cards left on the pile. 
        When initialized as a sampler, qty_left remains unchanged. """
        if self.qty_left <= 0:
            logger.error('Tried to buy card %s,' % self.name
                         + ' but there are %d left' % self.qty_left)
        else:
            self._game = game
            if not sampler:
                # __class__ is the highest parent, eg CopperCard, and not Card
                self.__class__.qty_left -= 1


    def serialize(self):
        d = {'name': self.name,
             'cost': self.cost,
             'qty': self.qty,
             'qtyLeft': self.qty_left
             }
        return d

    def __repr__(self):
        return '<Card ' + self.name + '>'
    def __str__(self):
        return self.__repr__()

###########################  money  #############################

class MoneyCard(Card):
    coins = 0 # 1 for copper, 3 for gold
    
    def serialize(self):
        d = {'coins': self.coins}
        d.update(Card.serialize(self))
        return d

class CopperCard(MoneyCard):
    name = 'Copper'
    cost = 1
    coins = 1
    qty = 50  
    



###########################  pirates  #########################


class PirateCard(Card):

    desc = ''
    fame = 0 # equivalent of victory points
    actions = 0
    coins = 0
    draws = 0
    buys = 0
    briggable = False


    def serialize(self):
        d = {'desc': self.desc}
        for attr_name in ['fame', 'actions', 'coins', 'draws', 'buys', 'briggable']:
            try:
                val = getattr(self, attr_name)
                if val:
                    d[attr_name] = val
            except AttributeError, e:
                logger.error(e)
        d.update(Card.serialize(self))
        return d

    def do_effect(self):
        pass



class CommodoreCard(PirateCard):
    name = 'Commodore'
    cost = 3
    fame = 1
    qty = 20
    briggable = True
    desc = 'Brig for 2 actions'



class SmithyCard(PirateCard):
    name = 'Smithy'
    cost = 4
    fame = 1
    draws = 3
    qty = 10
    desc = 'Draw 3 cards'

    def do_effect(self):
        self._game.cur_player.drawFromDeck(3)



###########################  buying piles  #########################

def pick_piles(num):
    """ Return a dictionary {'card.name': card_class} """
    # TODO: should draw piles randomly
    samplers = [CopperCard, CommodoreCard]
    # reset the quantities left
    for card_class in samplers: 
        card_class.qty_left = card_class.qty
    piles = {}
    for card in samplers:
        piles[card.name] = card
    return piles
