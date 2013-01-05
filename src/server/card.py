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
from server.resource import Resource

class Card():

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
             'qtyLeft': self.__class__.qty_left,
             'img': self.img
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
    img = 'img/copper.jpg'
    name = 'Copper'
    cost = 1
    coins = 1
    qty = 50

class SilverCard(MoneyCard):
    img = 'img/silver.jpg'
    name = 'Silver'
    cost = 4
    coins = 2
    qty = 8

class GoldCard(MoneyCard):
    img = 'img/gold.jpg'
    name = 'Gold'
    cost = 7
    coins = 3
    qty = 8




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
    img = 'img/commodore.jpg'
    name = 'Commodore'
    cost = 3
    fame = 1
    qty = 30
    briggable = True
    desc = 'Brig for 2 actions'

    # TODO: brig for 2a


class AdmiralCard(PirateCard):
    img = 'img/admiral.jpg'
    name = 'Admiral'
    cost = 9
    fame = 6
    qty = 8



class CartographerCard(PirateCard):
    img = 'img/cartographer.jpg'
    name = 'Cartographer'
    cost = 7
    fame = 3
    draws = 3
    buys = 1
    qty = 8

    def do_effect(self):
        self._game.cur_player.draw_cards(3)
        self._game.cur_player.add_resources(Resource(buy=1))


class QuartermasterCard(PirateCard):
    img = 'img/quartermaster.jpg'
    name = 'Quartermaster'
    cost = 6
    fame = '?'
    draws = 1
    buys = 1
    coins = 1
    actions = 1
    qty = 8
    desc = 'Worth 2/-2 fame if you have an odd/even number of them'

    def do_effect(self):
        self._game.cur_player.draw_cards(1)
        self._game.cur_player.add_resources(Resource(buy=1, coin=1, action=1))


class PurserCard(PirateCard):
    img = 'img/purser.jpg'
    name = 'Purser'
    cost = 5
    buys = 1
    coins = 3
    qty = 10

    def do_effect(self):
        self._game.cur_player.add_resources(Resource(buy=1, coins=3))
        for p in self._game.table:
            if p != self._game.cur_player:
                p.draw_cards(1)


class SeahagCard(PirateCard):
    img = 'img/seahag.jpg'
    name = 'Seahag'
    cost = 5
    coins = 1
    qty = 10

    def do_effect(self):
        self._game.cur_player.add_resources(Resource(coin=1))
        # prev_player = self._game.prev_player
        # next_player = self._game.next_player
        # TODO: send mutiny card to each neighbor


class GunnerCard(PirateCard):
    img = 'img/gunner.jpg'
    name = 'Gunner'
    cost = 5
    draws = 1
    qty = 10

    def do_effect(self):
        self._game.cur_player.draw_cards(1)
        self._game.cur_player.add_resources(Resource(actions=2))
        # TODO: may discard 1 card for others to discard one card from their hand


class BosunCard(PirateCard):
    img = 'img/olivier_levasseur.jpg'
    name = 'Bosun'
    cost = 4
    draws = 2
    qty = 10

    def do_effect(self):
        self._game.cur_player.draw_cards(2)
        # TODO: discard up to 2 cards to get up to 2 actions


class CookCard(PirateCard):
    img = 'img/cook.jpg'
    name = 'Cook'
    cost = 5
    draws = 1
    coins = 1
    actions = 1
    qty = 10

    def do_effect(self):
        self._game.cur_player.draw_cards(1)
        self._game.cur_player.add_resources(Resource(coins=1, actions=1))


class CooperCard(PirateCard):
    img = 'img/cooper.jpg'
    name = 'Cooper'
    cost = 4
    draws = 2
    buys = 2
    qty = 10

    def do_effect(self):
        self._game.cur_player.draw_cards(2)
        self._game.cur_player.add_resources(Resource(buys=2))


class RaiderCard(PirateCard):
    img = 'img/black_beard.jpg'
    name = 'Raider'
    cost = 3
    coins = 2
    qty = 10

    def do_effect(self):
        self._game.cur_player.add_resources(Resource(coins=2))
        # TODO: look at a player's deck top card. Discard or put it back.


class NavigatorCard(PirateCard):
    img = 'img/navigator.jpg'
    name = 'Navigator'
    cost = 3
    actions = 2
    qty = 10

    def do_effect(self):
        self._game.cur_player.add_resources(Resource(actions=2))


class SurgeonCard(PirateCard):
    img = 'img/surgeon.jpg'
    name = 'Surgeon'
    cost = 3
    actions = 1
    qty = 10

    def do_effect(self):
        self._game.cur_player.add_resources(Resource(buy=1, coins=5))
        # TODO: block scurvy or mutinies thrown at you if in your hand
        # TODO: return 1 scurvy or mutiny from your brig to the piles


class MerchantCard(PirateCard):
    img = 'img/black_bart.jpg'
    name = 'Merchant'
    cost = 3
    coins = 2
    qty = 10
    desc = 'brig for 1a. 4/8/12 fame per 2/3/4 brigged'
    briggable = True

    def do_effect(self):
        self._game.cur_player.add_resources(Resource(coins=2))
        # TODO: brig for 1a
        # TODO: brig bonus score


class ParrotCard(PirateCard):
    img = 'img/parrot.jpg'
    name = 'Parrot'
    cost = 2
    fame = 1
    buys = 1
    qty = 10
    briggable = True
    desc = '3/7 fame per set of 2/3 different animals in your brig'

    def do_effect(self):
        self._game.cur_player.add_resources(Resource(buy=1))


class CatCard(PirateCard):
    img = 'img/cat.jpg'
    name = 'Cat'
    cost = 2
    fame = 1
    coins = 1
    briggable = True
    qty = 10
    desc = '3/7 fame per set of 2/3 different animals in your brig'

    def do_effect(self):
        self._game.cur_player.add_resources(Resource(coin=1))


class MonkeyCard(PirateCard):
    img = 'img/monkey.jpg'
    name = 'Monkey'
    cost = 2
    fame = 1
    draws = 1
    briggable = True
    qty = 10
    desc = '3/7 fame per set of 2/3 different animals in your brig'

    def do_effect(self):
        self._game.cur_player.draw_cards(1)


#########################  captains  ##############################




###########################  buying piles  #########################

def pick_piles(num):
    """ Return a dictionary {'card.name': card_class} """
    # TODO: should draw action pirate piles randomly
    samplers = [CopperCard, SilverCard, GoldCard,
                CommodoreCard, AdmiralCard, # briggables
                CartographerCard, QuartermasterCard, #6 ad 7 cost
                PurserCard, CookCard, # 5
                CooperCard, # 4
                NavigatorCard, MerchantCard, #3
                ParrotCard, CatCard, MonkeyCard]
    # reset the quantities left
    for card_class in samplers:
        card_class.qty_left = card_class.qty
    piles = {}
    for card in samplers:
        piles[card.name] = card
    return piles
