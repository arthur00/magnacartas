from logger import logger
from random import shuffle


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


    def __repr__(self):
        return '<Player %s>' % self.name
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


    def on_endMyTurn(self):
        """ The client says his turn ended. """
        self._game.end_turn(self)


    def end_turn(self, prev_player, next_player):
        """ Notify the client that someone's turn ended, 
        and someone's turn begins.
        """
        data = {'next': next_player.serialize('name')}
        if prev_player:
            data['prev'] = prev_player.serialize('name')
        self.send('endTurn', data)


    def set_deck(self, deck):
        """ At the beginning of the game, send the length of my deck. """
        self.deck = deck
        data = {'size': len(deck)}
        self.send('setDeck', data)


    def draw_hand(self, num_cards):
        """ Draw num_cards cards from my deck to my hand.
        If my deck is empty, shuffle the discard pile, and consider it my deck.
        If I have less than num_cards in my discard + deck, 
        then I draw them all.
        """
        
        for _ in range(num_cards):
            try:
                card = self.deck.pop()
            except IndexError: # empty: replace the deck by the discard pile
                if len(self.discard) == 0: # not enough cards to draw from
                    break
                cards = self.discard[:]
                self.discard = []
                shuffle(cards)
                self.deck = cards
                card = self.deck.pop()
            self.hand.append(card)
        data = {'hand': [card.serialize() for card in self.hand]}
        self.send('drawHand', data)
        return len(self.hand)


    def other_draw_hand(self, player, num_cards):
        """ Notify me that another player drew his hand """
        data = {'player': player.serialize('name'),
                'size': num_cards}
        self.send('otherDrawHand', data)


    def discard_hand(self):
        """ Shuffle my hand and put in in the discard pile. """
        hand = self.hand[:] # copy
        self.hand = []
        shuffle(hand)
        for card in hand:
            self.discard.append(card)
        hand.reverse() # so that the 1st card is the top of the discard pile
        return hand


    def someone_discard_hand(self, player, cards):
        """ Notify me that a player discarded his hand. 
        This player CAN be myself.
        """
        data = {'player': player.serialize('name'),
                'cards': [card.serialize() for card in cards]}
        self.send('discardHand', data)
