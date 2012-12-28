from logger import logger
from player import Player
from server.card import pick_piles, CopperCard, CommodoreCard
from tornadocomm import set_gateway, start_server
import random



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
        self.piles = []
        self._curindex = 0



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
                cur_player.player_joined(self.table, new_player)
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
            cur_player.player_left(self.table, player)
        if len(self.table) == 1:
            last_player = self.table[0]
            self.game_over(last_player)



    def game_over(self, winner):
        """ A player won. Tell everyone, and restart the game. """
        logger.info('game over: %s won' % winner.name)
        for player in self.table:
            player.game_over(self.table, winner)
        self.reset()



    def start_game(self):
        """ From now on, any player who leaves is considered a loser. 
        First send the piles and the table/order of the players.
        Then send the player's deck and hand.
        """

        # start the game: send the player seating and the card piles
        self.piles = pick_piles(2, self)
        start_player = self.table[self._curindex]
        self.game_started = True
        for player in self.table:
            player.game_start(self.table, self.piles, start_player)

        # each player prepares his hand and deck
        starting_deck = [CopperCard() for _ in range(7)]
        starting_deck += [CommodoreCard(self) for _ in range(3)]
        for player in self.table:
            pdeck = list(starting_deck) # copy
            random.shuffle(pdeck)
            num_cards = player.reset_deck(pdeck)
            [p.someone_reset_deck(player, num_cards) for p in self.table]
            for _ in range(5):
                player.draw_card()
                [p.other_draw_card(player) for p in self.table if p is not player]

        # begin starting player's turn
        logger.info('turn of: %s' % start_player.name)
        for player in self.table:
            player.end_turn(None, start_player)



    def end_turn(self, player):
        """ A player says he's ending his turn. Check if it was his turn. 
        Then next player. """
        cur_player = self.table[self._curindex]

        if player == cur_player:
            # TODO: discard tableau
            
            # discard old hand 
            cards = player.discard_hand()
            for card in cards:
                [p.someone_discard_card_from_hand(player, card) for p in self.table]
            # draw new hand
            for _ in range(5):
                player.draw_card()
                [p.other_draw_card(player) for p in self.table if p is not player]
            # next player's turn 
            self._curindex = (self._curindex + 1) % len(self.table)
            next_player = self.table[self._curindex]
            logger.info('turn of: %s' % next_player.name)
            for p in self.table:
                p.end_turn(cur_player, next_player)

        else: # not the current player: cheater?
            logger.warn('player %s tried to end his turn,' % player.name +
                        'but it was the turn of %s' % cur_player.name)



    def player_reset_deck(self, player):
        """ A player's deck is empty. Ask the player to reset his deck, 
        and notify all players. """
        num_cards = player.reset_deck()
        [p.someone_reset_deck(player, num_cards) for p in self.table]
        
        
        