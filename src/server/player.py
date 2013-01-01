from logger import logger
from random import shuffle
from server.card import MoneyCard
from server.resource import Resource

PHASE_NOTMYTURN = 'notmyturn'
PHASE_STARTING = 'starting'
PHASE_ACTION = 'action'
PHASE_BUYING = 'buy'
PHASE_CLEANUP = 'cleanup' # when you discard your tableau and draw a new hand

HAND_SIZE = 5 # how many cards players draw at cleanup phase


class Player():
    """ Basic player model. Created when a player logs in.
    Provides methods for "I disconnected" and "another player joined/left".
    """

    def __init__(self, game, name, conn_handler, pos):
        self._game = game
        self._handler = conn_handler
        conn_handler.set_player(self)

        self.name = name
        self.score = 0
        self.deck = []
        self.hand = []
        self.discard = []
        self.tableau = []

        self._phase = PHASE_NOTMYTURN
        self.coins = 0 # how many coins i have in play
        self.buys = 1 # buys during my buying phase
        self.actions = 1 # actions during my action phase


    def __repr__(self):
        return '<Player %s - %s>' % (self.name, self._phase)
    def __str__(self):
        return self.__repr__()


    def serialize(self, *attr_names):
        """ player's name is always sent. 
        serialize('score') should return 
        {'name': self.name, 'score: self.score} 
        """
        d = {'name': self.name}
        for attr in attr_names:
            d[attr] = getattr(self, attr)
        return d


    @property
    def isconnected(self):
        return self._handler != None



    def on_disconnect(self):
        """ My socket closed. Notify the game. """
        if self._handler:
            self._game.remove_player(self)
            self._handler = None
            logger.info('player left: %s' % self.name)



    def kick_out(self):
        """ The game kicks me out, eg when the game has ended. """
        self._handler.close()
        logger.info('player kicked: %s' % self.name)



    def send(self, cmd, data):
        """ Send a msg through the client handler.  """
        self._handler.send({cmd: data})



    ############################  player joined/left 

    def welcome(self, table, numplayers):
        """ Send the current configuration of the table. 
        The game has not started yet. 
        """
        logger.info('player joined: %s' % self.name)
        data = {'table':[p.serialize() for p in table],
                'numPlayers':numplayers
                }
        self.send('welcome', data)



    def ntf_playerjoined(self, table, new_player):
        """ Notify the client that another player joined. """
        data = {'table': [player.serialize() for player in table],
                'newPlayer': new_player.serialize()
                }
        self.send('playerJoined', data)



    def ntf_playerleft(self, table, old_player):
        """ Notify the client that another player left. """
        data = {'table': [player.serialize() for player in table],
                'oldPlayer': old_player.serialize()
                }
        self.send('playerLeft', data)



    ########################  game start/end

    def ntf_gameinit(self, table, piles):
        """ Notify the client of the beginning of the game """
        data = {'table': [p.serialize() for p in table],
                'piles': [card.serialize() for card in piles],
                }
        self.send('gameInit', data)



    def ntf_gameover(self, table, winner):
        """ This player has won! """
        data = {'table': [player.serialize('score') for player in table],
                'winner': winner.serialize('score')
                }
        self.send('gameOver', data)



    ##########################  start turn, action phase, cleanup, end turn

    def start_turn(self):
        """ Start my turn """
        if self._phase is not PHASE_NOTMYTURN:
            logger.warn('Player %s starts his turn, ' % self.name
                        + ' but his phase was %s' % self._phase)
        self._phase = PHASE_STARTING
        start_rsrc = Resource(action=1, buy=1)
        self.set_resources_no_broadcast(start_rsrc)
        logger.info('turn of: %s' % self.name)
        self._game.bc_start_phase(self, start_rsrc)
        # TODO: check for start phase actions and bonuses
        self._phase = PHASE_ACTION
        self._game.bc_action_phase(self)


    def ntf_start_phase(self, player, effect):
        """ Notify me that someone started his turn, and gained some effect. 
        """
        data = {'player': player.serialize(),
                'effect': effect.serialize()
                }
        self.send('startPhase', data)


    def ntf_action_phase(self, player):
        """ Notify me that someone started his action phase. """
        data = {'player': player.serialize()}
        self.send('actionPhase', data)



    def on_endMyTurn(self):
        """ The client says this player ends his turn.
        Perform cleanup and end my turn.
        """
        if self._phase in [PHASE_ACTION, PHASE_BUYING]:
            self._phase = PHASE_CLEANUP
            self.perform_cleanup()
            self._phase = PHASE_NOTMYTURN
            self._game.player_end_turn(self)
        else:
            logger.error('player %s ' % self.name
                         + ' sent endTurn message out of his turn')


    def perform_cleanup(self):
        """ Move cards in my tableau and my hand to my discard. 
        Draw a new hand.
        """
        # TODO: check if another player has effects to trigger 
        # at the beginning or during my cleanup phase (eg Amber)
        num_discarded = 0
        shuffle(self.tableau)
        while self.tableau:
            card = self.tableau.pop()
            self.discard.append(card)
            num_discarded += 1
        shuffle(self.hand)
        while self.hand:
            card = self.hand.pop()
            self.discard.append(card)
            num_discarded += 1
        discard_top = self.discard[-1]
        self._game.bc_cleanup_phase(self, discard_top, num_discarded)
        self.draw_hand()



    def ntf_cleanup_phase(self, cur_player, discard_top, num_discarded):
        """ Notify the client that someone's cleanup phase begins.
        discard_top is the top card of the discard pile.
        """
        data = {'player': cur_player.serialize(),
                'top': discard_top.serialize(),
                'num': num_discarded}
        self.send('cleanupPhase', data)
        # TODO: check if this player has effects to trigger 
        # at the end of another player's cleanup phase (eg Amber)



    ##################  resources: buys, actions, coins 


    def set_resources_no_broadcast(self, resources):
        """ Resources contains +buys, +actions, and +coins. """
        self.actions = resources.actions
        self.buys = resources.buys
        self.coins = resources.coins


    def add_resources(self, resources):
        """ Resources contains +buys, +actions, and +coins. 
        Tell the server to broadcast my new gain in resources.
        """
        self.actions += resources.actions
        self.buys += resources.buys
        self.coins += resources.coins
        self._game.bc_gain_resources(self, resources)


    def ntf_gain_resources(self, player, resources):
        """ """
        data = {'player': player.serialize(),
                'resources': resources.serialize()
                }
        self.send('gainResources', data)



    #####################  draw, discard, hand, deck,

    def draw_hand(self):
        self.draw_cards(HAND_SIZE)



    def draw_cards(self, num_cards):
        """ Draw n cards from my deck into my hand. 
        If the deck runs out, 
        tell the game so that all other players know I reshuffle.
        Send draws in batches. For example, if my deck has 2 cards left,
        my discard has 10 cards left, and I need to draw 5 cards,
        then I send a batch of 2, then a deck reset, 
        and finally a batch of 3.
        TODO: should also do draw from deck to discard pile 
        """
        remaining = num_cards
        batch_cards = [] # cards drawn from the deck until the deck resets
        while remaining > 0:
            if len(self.deck) > 0:
                card = self.deck.pop()
            else: # deck is empty
                # send non-empty batch of cards
                if len(batch_cards) > 0:
                    self._game.bc_draw_cards(self, batch_cards)
                    batch_cards = []
                # replace deck by discard pile
                if len(self.discard) == 0: # discard is also empty
                    return # dont draw any card
                self.reset_deck()
                card = self.deck.pop()
            # add card to hand anyway
            self.hand.append(card)
            batch_cards.append(card)
            remaining -= 1
        # send last batch (it is not empty)
        self._game.bc_draw_cards(self, batch_cards)


    def ntf_draw_cards(self, player, cards):
        """ Notify me that a player (can be me) draws cards. 
        If it's me, send me the cards.
        If not me, only send how many cards are drawn. 
        """
        data = {'player': player.serialize()}
        if player.name == self.name:
            data['cards'] = [card.serialize() for card in cards]
        else:
            data['qty'] = len(cards)
        self.send('drawCards', data)



    def reset_deck(self, deck=[]):
        """ Shuffle my discard pile and put it as my deck.  
        At the beginning of the game, this should be called 
        with a non-empty deck.
        In any case, return the number of cards in my deck. 
        """
        if deck:
            cards = deck
        else:
            cards = list(self.discard) # copy
            self.discard = []

        shuffle(cards)
        self.deck = cards
        self._game.bc_resetdeck(self, len(self.deck))


    def ntf_reset_deck(self, player, num_cards):
        """ Notify me that a player shuffled his deck 
        and emptied his discard pile.
        This player CAN be me. 
        """
        data = {'player': player.serialize(),
                'size': num_cards}
        self.send('resetDeck', data)



    ###############  put down money, buy a card 

    def on_playAllMyMoneys(self):
        """ Put my money cards in the tableau.  
        Count and store the amount of money available to me. 
        """
        if self._phase is PHASE_ACTION:
            self._phase = PHASE_BUYING
            moneycards = []
            for card in self.hand:
                if isinstance(card, MoneyCard):
                    self.coins += card.coins
                    moneycards.append(card)
            logger.info('%s spends %d coins' % (self.name, self.coins))
            self._game.bc_playmoney(self, moneycards)
        else:
            logger.error('player %s ' % self.name
                         + ' sent playAllMyMoney out of action phase')



    def ntf_playmoney(self, player, moneycards):
        """ Notify me that a player placed a money card down to buy stuffs. 
        """
        data = {'player': player.serialize(),
                'moneyCards': [card.serialize() for card in moneycards]}
        # TODO: should also send a bonus effect containing +coins
        self.send('playMoney', data)



    def on_buy(self, args):
        """ Player client tells me he buys ONE card. 
        args = {'name': 'Copper'} 
        """
        if self._phase is PHASE_BUYING and self.buys > 0 and 'name' in args:
            card_name = args['name']
            self._game.bc_buy(self, self.coins, card_name)
        else:
            logger.error('Player %s asked to buy,' % self.name
                         + ' but he is not allowed to, or name is missing.')


    def ntf_buy(self, player, card):
        """ A player (maybe me) just bought a card. """
        if player.name == self.name:
            self.discard.append(card)
            self.buys -= 1
            self.coins -= card.cost
            logger.info('%s buys %s' % (self.name, card.name))
        data = {'player': player.serialize(),
                'card': card.serialize()}
        self.send('buy', data)



    #######################  play a card

    def on_play(self, args):
        """ My client plays a card. Check it is my turn.
        Check that I have actions left, and that the card is in my hand. 
        Then execute the card.
        args = {'name': 'Smithy'}
        """
        if self._phase is PHASE_ACTION and self.actions > 0 and 'name' in args:
            card_name = args['name']
            in_hand = False
            for handcard in self.hand:
                if handcard.name == card_name:
                    in_hand = True
                    break
            if in_hand:
                self.actions -= 1
                logger.info('%s plays %s' % (self.name, card_name))
                self._game.bc_start_play_card(self, handcard)
                handcard.do_effect()
            else: # no such card in hand
                logger.error('Player %s ' % self.name
                             + ' wants to play card %s' % card_name
                             + ' but he does not have this card in hand.')
        else:
            logger.error('Player %s wants to play a card' % self.name
                         + ' but he is not allowed to, or name is missing.')


    def ntf_start_play_card(self, player, card):
        """ A player (maybe me) starts playing a card. 
        TODO: send the cost to play the card (default = 1 action)
        """
        data = {'player': player.serialize(),
                'card': card.serialize()
                }
        self.send('startPlayCard', data)
        

