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



    def ntf_playerjoined(self, table, new_player):
        """ Notify the client that another player joined. """
        data = {'table': [player.serialize('name') for player in table],
                'newPlayer': new_player.serialize('name')
                }
        self.send('playerJoined', data)



    def ntf_playerleft(self, table, old_player):
        """ Notify the client that another player left. """
        data = {'table': [player.serialize('name') for player in table],
                'oldPlayer': old_player.serialize('name')
                }
        self.send('playerLeft', data)



    ########################  game start/end

    def ntf_gamestart(self, table, piles, start_player):
        """ Notify the client of the beginning of the game """
        data = {'table': [p.serialize('name') for p in table],
                'piles': [card.serialize() for card in piles],
                'startingPlayer': start_player.serialize('name')
                }
        self.send('gameStart', data)



    def ntf_gameover(self, table, winner):
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
            logger.error('player %s sent endTurn message out of his turn' % self.name)



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
            # TODO: should also send how many actions, buys, and coins  
        if prev_player:
            data['prev'] = prev_player.serialize('name')
        self.send('endTurn', data)



    ###########################  draw, discard, hand, deck, buys, actions, coins 

    def resetdeck(self, deck=[]):
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
        self._game.player_resetdeck(self, len(self.deck))



    def ntf_resetdeck(self, player, num_cards):
        """ Notify me that a player shuffled his deck and emptied his discard pile.
        This player CAN be me. 
        """
        data = {'player': player.serialize('name'),
                'size': num_cards}
        self.send('resetDeck', data)



    def drawcards(self, num_cards):
        """ Draw n cards from my deck into my hand. 
        If the deck runs out, 
        tell the game so that all other players know I reshuffle.
        Send draws in batches. For example, if my deck has 2 cards left,
        my discard has 10 cards left, and I need to draw 5 cards,
        then I send a batch of 2, then a deck reset, and finally a batch of 3. 
        """
        remaining = num_cards
        batch_cards = [] # cards drawn from the deck until the deck resets
        while remaining > 0:
            if len(self.deck) > 0:
                card = self.deck.pop()
            else: # deck is empty
                # send non-empty batch of cards
                if len(batch_cards) > 0:
                    data = {'cards': [card.serialize() for card in batch_cards]}
                    self.send('drawCards', data)
                    self._game.player_draw(self, len(batch_cards))
                    batch_cards = []
                # replace deck by discard pile
                if len(self.discard) == 0: # discard is also empty
                    return # dont draw any card
                self.resetdeck()
                card = self.deck.pop()
            # add card to hand anyway
            self.hand.append(card)
            batch_cards.append(card)
            remaining -= 1
        # send last batch (it is not empty)
        data = {'cards': [card.serialize() for card in batch_cards]}
        self.send('drawCards', data)
        self._game.player_draw(self, len(batch_cards))



    def ntf_drawcards(self, player, numcards):
        """ Notify me that another player drew his hand """
        data = {'player': player.serialize('name'),
                'qty': numcards}
        self.send('otherDrawCards', data)



    def addbuys(self, num):
        """ Notify the game that I gained extra +buys. """
        self.buys += num
        self._game.player_addbuys(self, num, self.buys)


    def ntf_addbuys(self, player, deltabuys, totalbuys):
        """ Notify me that a player (can be myself) gained +buys """
        data = {'player': player.serialize('name'),
                'deltabuys': deltabuys,
                'totalbuys': totalbuys}


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
            self._game.player_playmoney(self, moneycards)
        else:
            logger.error('player %s sent playAllMyMoney out of action phase' % self.name)



    def ntf_playmoney(self, player, moneycards):
        """ Notify me that a player placed a money card down to buy stuffs. """
        data = {'player': player.serialize('name'),
                'moneyCards': [card.serialize() for card in moneycards]}
        # TODO: should also send a bonus effect containing +coins
        self.send('playMoney', data)



    def on_buy(self, args):
        """ Player client tells me he buys ONE card. args = {'name': 'Copper'} """
        if self._phase is PHASE_BUYING and self.buys > 0 and 'name' in args:
            card_name = args['name']
            self._game.player_buy(self, self.coins, card_name)
        else:
            logger.error('Player %s asked to buy,' % self.name
                         + ' but he is not allowed to, or the name is missing.')


    def ntf_buy(self, player, card):
        """ A player (maybe me) just bought a card. """
        if player.name == self.name:
            self.discard.append(card)
            self.buys -= 1
            self.coins -= card.cost
            logger.info('%s buys %s' % (self.name, card.name))
        data = {'player': player.serialize('name'),
                'card': card.serialize()}
        self.send('buy', data)



    #######################  play a card

    def on_play(self, args):
        """ Client plays a card. Check it's player's turn.
        Check that he has actions left, and that the card is in his hand. 
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
                handcard.do_effect()
            else: # no such card in hand
                logger.error('Player %s wants to play card %s' % (self.name, card_name)
                             + ' but he does not have this card in hand.')
        else:
            logger.error('Player %s wants to play a card' % self.name
                         + ' but he is not allowed to, or the name is missing.')



