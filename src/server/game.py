from logger import logger
from player import Player
from server.card import pick_piles, CopperCard, CartographerCard
from tornadocomm import set_gateway, start_server
import random


# how many piles to empty for the game to end
NUM_PILES_FOR_GAME_END = 1



class PirateGame():
    """ A running game instance. 
    Players are created when the game instance is created, not when they login.
    """

    def __init__(self, port, url, numplayers):
        """ Init state and start web server. """
        self.numplayers = numplayers
        self.table = []
        self.reset()
        set_gateway(self) # to receive messages from the tornado handlers
        start_server(port, url) # start tornado



    def reset(self):
        """ Remove any previously connected player.
        The game starts when enough players are connected.  
        """
        for player in self.table:
            player.kick_out()
        self.table = []
        self.game_started = False
        self.piles = {} # map card name to card class
        self.num_piles_gone = 0
        self._curindex = 0
        logger.info('game reset')



    @property
    def cur_player(self):
        return self.table[self._curindex]



    def get_player(self, pname):
        """ Return the connected player with that name. 
        Return None if not found.
        """
        for player in self.table:
            if player.name == pname:
                return player
        return None



    def add_player(self, args, handler):
        """ Add a player and notify all other currently connected clients. 
        Only accept new players if the game did not start yet.
        """
        pname = args['name']

        # dont accept the connection if the game already started 
        # or if the player is already connected
        if self.game_started or self.get_player(pname):
            handler.close()
            return None

        else:# a new player arrived
            pos = len(self.table)
            new_player = Player(self, pname, handler, pos)
            # notify all current players
            cur_players = list(self.table)
            self.table.append(new_player)
            for cur_player in cur_players:
                cur_player.ntf_playerjoined(self.table, new_player)
            # send  the current game state to the new player
            new_player.welcome(self.table, self.numplayers)
            # start the game if enough players are connected
            if len(self.table) == self.numplayers:
                self.start_game()



    def remove_player(self, player):
        """ When a player disconnects, notify other players,
        and restart the game if there is only one player left. 
        """
        self.table.remove(player)
        for cur_player in self.table:
            cur_player.ntf_playerleft(self.table, player)
        if len(self.table) == 1:
            last_player = self.table[0]
            self.ntf_gameover(last_player)



    def start_game(self):
        """ From now on, any player who leaves is considered a loser. 
        First send the piles and the table/order of the players.
        Then send the player's deck and hand.
        """

        # start the game: send the table seating and the card piles
        self.piles = pick_piles(2)
        start_player = self.cur_player
        self.game_started = True
        samplers = [card_class(self, True) for card_class in self.piles.values()]
        for player in self.table:
            player.ntf_gamestart(self.table, samplers, start_player)

        # each player prepares his hand and deck
        for player in self.table:
            deck = [CopperCard(self) for _ in range(7)]
            deck += [CartographerCard(self) for _ in range(3)]
            random.shuffle(deck)
            num_cards = player.reset_deck(deck)
            [p.ntf_resetdeck(player, num_cards) for p in self.table]
            player.drawcards(5)

        # begin starting player's turn
        logger.info('turn of: %s' % start_player.name)
        for player in self.table:
            player.ntf_endturn(None, start_player)


    def end_game(self):
        """ Determine the winner and send game over. """
        winner = self.table[0]
        for player in self.table[1:]:
            if player.score > winner.score:
                winner = player
        self.ntf_gameover(winner)


    def ntf_gameover(self, winner):
        """ A player won. Tell everyone, and restart the game. """
        logger.info('game over: %s won' % winner.name)
        for player in self.table:
            player.ntf_gameover(self.table, winner)
        self.reset()


    def player_startcleanup(self, player, discard_top, num_discarded):
        """ A player's turn ended. Tell everyone, and start next player's turn. 
        """
        if player != self.cur_player: # not the current player: cheater?
            logger.warn('player %s tried to end his turn,' % player.name +
                        'but it was the turn of %s' % self.cur_player.name)
            return

        # broadcast the start of the cleanup phase
        for p in self.table:
            p.ntf_cleanup(player, discard_top, num_discarded)

        # finish that player's cleanup phase: draw a new hand
        player.drawcards(5)

        # check for game end
        if self.num_piles_gone == NUM_PILES_FOR_GAME_END:
            for p in self.table:
                p.ntf_endturn(player, None)
            self.end_game()

        else: # game did not end: next player's turn
            self._curindex = (self._curindex + 1) % len(self.table)
            next_player = self.cur_player
            logger.info('turn of: %s' % next_player.name)
            for p in self.table:
                p.ntf_endturn(player, next_player)



    ##################  draws, buys, coins, actions

    def player_draw(self, player, numcards):
        """ Tell players that another player drew a card. """
        [p.ntf_drawcards(player, numcards) for p in self.table if p is not player]



    def player_addbuys(self, player, deltabuys, totalbuys):
        """ Tell players that another player gained +buys """
        [p.ntf_addbuys(player, deltabuys, totalbuys) for p in self.table if p is not player]



    def player_resetdeck(self, player, numcards):
        """ Notify all players that another player's deck was empty and reshuffled.
        numcards is the number of cards in the deck after it got reshuffled. 
        """
        [p.ntf_resetdeck(player, numcards) for p in self.table]



    def player_playmoney(self, player, card):
        """ A player plays a money card to buy stuffs. Notify everyone. """
        [p.ntf_playmoney(player, card) for p in self.table]



    def player_buy(self, player, coins, card_name):
        """ A player tries to buy a card from a buying pile. """
        card_class = self.piles[card_name]
        # enough money and cards left in the pile
        if coins >= card_class.cost:
            if card_class.qty_left > 0:
                card = card_class(self)
                if card.qty_left == 0:
                    self.num_piles_gone += 1
                [p.ntf_buy(player, card) for p in self.table]

            else:# the client should not have sent a buy for that card
                logger.warn('player %s' % player.name
                            + ' wants to buy a %s' % card_class.name
                            + ' but there are %d left in the pile' % card_class.qty_left)

        else: # the client should not have sent a buy for that card
            logger.warn('player %s' % player.name
                        + ' wants to buy card %s' % card_class.name
                        + ' but he has only %d coins' % coins)


