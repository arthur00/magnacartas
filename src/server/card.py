""" Cards are lazily instantiated: 
- each pile to buy from is only a class 
with a class variable indicating how many are left,
- when a player buys a card, that card is instantiated, 
and decreases the quantity left of the class of the card by 1

The alternative was: at game start, instantiate as many cards as needed, 
ie around 200, and create an instance of a Pile, 
where a Pile would store how many cards are left in it.
"""

class Card():
    name = ''
    cost = 0 # 1 for copper, 7 for gold
    fame = 0 # equivalent of victory points
    qty = 0 # how many cards can be bought in the pile, at game start
    qty_left = 0 # how many cards are left to buy

    def __init__(self, game, sampler=False):
        """ When initialized as a sampler, qty_left remains unchanged. """
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
        if self.fame:
            d['fame'] = self.fame
        return d

    def __repr__(self):
        return '<Card ' + self.name + '>'
    def __str__(self):
        return self.__repr__()

###########################  money  #############################

class MoneyCard(Card):
    coin = 0 # 1 for copper, 3 for gold

    def serialize(self):
        d = {'coin': self.coin}
        d.update(Card.serialize(self))
        return d

class CopperCard(MoneyCard):
    name = 'Copper'
    cost = 1
    coin = 1
    qty = 15
    qty_left = 15

class SilverCard(MoneyCard):
    name = 'Silver'
    cost = 4
    coin = 2
    qty = 8
    qty_left = 8




###########################  pirates  #########################


class PirateCard(Card):

    desc = ''

    def serialize(self):
        d = {'desc': self.desc}
        d.update(Card.serialize(self))
        return d

    def do_effect(self):
        pass


class CommodoreCard(PirateCard):
    name = 'Commodore'
    cost = 3
    fame = 1
    qty = 20
    qty_left = 20
    desc = 'Brig for 2 actions'



class SmithyCard(PirateCard):
    name = 'Smithy'
    cost = 4
    fame = 1
    qty = 10
    qty_left = 10
    desc = 'Draw 3 cards'

    def do_effect(self):
        self._game.cur_player.drawFromDeck(3)



###########################  buying piles  #########################

def pick_piles(num):
    """ Return a dictionary {'card.name': card_class} """
    # TODO: should draw piles randomly
    samplers = [CopperCard, CommodoreCard]
    piles = {}
    for card in samplers:
        piles[card.name] = card
    return piles
