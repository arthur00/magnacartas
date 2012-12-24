

class Card():
    name = ''
    cost = 0 # 1 for copper, 7 for gold
    fame = 0 # equivalent of victory points
    qty = 0 # how many cards can be bought in the pile, at game start
    qty_left = 0 # how many cards are left to buy

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
    qty = 20
    qty_left = 20

class SilverCard(MoneyCard):
    name = 'Silver'
    cost = 4
    coin = 2
    qty = 8
    qty_left = 8




###########################  pirates  #########################


class PirateCard(Card):

    desc = ''

    def __init__(self, game):
        self._game = game

    def serialize(self):
        d = {'desc': self.desc}
        d.update(Card.serialize(self))
        return d


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

def pick_piles(num, game):
    # TODO: should draw piles randomly
    piles = [CopperCard(), SmithyCard(game)]
    return piles
