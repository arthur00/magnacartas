from logger import logger
from random import shuffle
from server.card import MoneyCard

PHASE_NOTMYTURN = 'notmyturn'
PHASE_STARTING = 'starting'
PHASE_ACTION = 'action'
PHASE_BUYING = 'buy'
PHASE_CLEANUP = 'cleanup' # when you discard your tableau and draw a new hand



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
        self.coins = 0 # how many coins i have in play, during my buying phase
        self.buys = 1 # buys during my buying phase
        self.actions = 1 # actions during my action phase


    def __repr__(self):
        return '<Player %s - %s>' % (self.name, self._phase)
    def __str__(self):
        return self.__repr__()


    def serialize(self, *attr_names):
        """ serialize('name', 'score') should return 
        {'name': self.name, 'score: self.score} 
        """
        d = {}
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
        data = {'table':[p.serialize('name') for p in table],
                'numPlayers':numplayers
                }
        self.send('welcome', data)



    def player_joined(self, table, new_player):
        """ Notify the client that another player joined. """
        data = {'table': [player.serialize('name') for player in table],
                'newPlayer': new_player.serialize('name')
                }
        self.send('playerJoined', data)



    def player_left(self, table, old_player):
        """ Notify the client that another player left. """
        data = {'table': [player.serialize('name') for player in table],
                'oldPlayer': old_player.serialize('name')
                }
        self.send('playerLeft', data)



    ########################  game start/end
    
    def game_start(self, table, piles, start_player):
        """ Notify the client of the beginning of the game """
        data = {'table': [p.serialize('name') for p in table],
                'piles': [card.serialize() for card in piles],
                'startingPlayer': start_player.serialize('name')
                }
        self.send('gameStart', data)



    def game_over(self, table, winner):
        """ This player has won! """
        data = {'table': [player.serialize('name', 'score') for player in table],
                'winner': winner.serialize('name', 'score')
                }
        self.send('gameOver', data)



    ########################## cleanup, next turn
    
    def on_endMyTurn(self):
        """ The client says his turn ended. 
        Move cards in the tableau and hand to the discard.
        """
        if self._phase in [PHASE_ACTION, PHASE_BUYING]:
            self._phase = PHASE_CLEANUP
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
            self._game.player_startcleanup(self, discard_top, num_discarded)
        else:
            logger.warn('player %s sent endTurn message out of his turn' % self.name)



    def ntf_cleanup(self, cur_player, discard_top, num_discarded):
        """ Notify the client that someone's cleanup phase begins.
        discard_top is the top card of the discard pile.
        """
        data = {'player': cur_player.serialize('name'),
                'top': discard_top.serialize(),
                'num': num_discarded}
        self.send('cleanup', data)



    def ntf_endturn(self, prev_player, next_player):
        """ Notify the client that the cleanup phase of the current player ended, 
        and that someone's turn begins.
        prev_player is None during the first turn of the first player.
        next_player is None during the last turn.
        """
        if prev_player and self.name == prev_player.name: # end of my turn
            # reset my actions, coins, and buys
            self.coins = 0
            self.actions = 1
            self.buys = 1
            self._phase = PHASE_NOTMYTURN
        if next_player and self.name == next_player.name: # beginning of my turn
            # TODO: if I have a private maid, trigger a starting phase
            # no starting maid: trigger action phase directly
            self._phase = PHASE_ACTION

        # send the information anyway
        data = {}
        if next_player:
            data['next'] = next_player.serialize('name')
        if prev_player:
            data['prev'] = prev_player.serialize('name')
        self.send('endTurn', data)



    ###########################  hand, deck, discard

    def reset_deck(self, deck=[]):
        """ Shuffle my discard pile and put it as my deck.  
        At the beginning of the game, this should be called with a non-empty deck.
        In any case, return the number of cards in my deck. 
        """
        if deck:
            self.deck = deck
        else:
            cards = list(self.discard) # copy
            self.discard = []
            shuffle(cards)
            self.deck = cards
        return len(self.deck)



    def ntf_resetdeck(self, player, num_cards):
        """ Notify me that a player shuffled his deck and emptied his discard pile.
        This player CAN be me. 
        """
        data = {'player': player.serialize('name'),
                'size': num_cards}
        self.send('resetDeck', data)



    def draw_card(self):
        """ Draw a card from my deck into my hand. 
        If the deck runs out, 
        tell the game so that all other players know I reshuffle.
        """
        try:
            card = self.deck.pop()
        except IndexError: # deck is empty: replace by the discard pile
            if len(self.discard) == 0: # discard is also empty
                return # dont draw any card
            self._game.player_resetdeck(self)
            card = self.deck.pop()

        self.hand.append(card)
        data = {'card': card.serialize()}
        self.send('drawCard', data)



    def other_draw_card(self, player):
        """ Notify me that another player drew his hand """
        data = {'player': player.serialize('name')}
        self.send('otherDrawCard', data)



    ###############  put down money, buy a card 

    def on_playAllMyMoneys(self):
        """ Put my money cards in the tableau.  
        Count and store the amount of money available to me. 
        """
        if self._phase == PHASE_ACTION:
            self._phase = PHASE_BUYING
            for card in self.hand:
                if isinstance(card, MoneyCard):
                    self.coins += card.coins
                    self._game.player_playmoney(self, card)
        else:
            logger.warn('player %s sent playAllMyMoney out of action phase' % self.name)



    def ntf_playmoney(self, player, card):
        """ Notify me that a player placed a money card down to buy stuffs. """
        data = {'player': player.serialize('name'),
                'card': card.serialize()}
        self.send('playMoney', data)



    def on_buy(self, args):
        """ Player client tells me he buys ONE card. args = {'name': 'Copper'} """
        try:
            card_name = args['name']
        except KeyError:
            logger.error('player %s sent a buy message'
                         + ' but the card name was missing')
            return

        if self._phase == PHASE_BUYING:
            if self.buys > 0:
                self._game.player_buy(self, self.coins, card_name)
            else: # the client should not have sent a buy
                logger.warn('player %s sent a buy message' % self.name
                            + ' but he has only %d buys' % self.buys)
        else:# the client should not have sent a buy
            logger.warn('player %s' % self.name
                        + ' sent a buy message out of his buying phase')



    def ntf_buy(self, player, card):
        """ A player (maybe me) just bought a card. """
        if player.name == self.name:
            self.discard.append(card)
            self.buys -= 1
        data = {'player': player.serialize('name'),
                'card': card.serialize()}
        self.send('buy', data)

