from logger import logger
from player import Player
from server.card import pick_piles, CopperCard, SmithyCard
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
        starting_deck = [CopperCard() for _ in range(4)]
        starting_deck += [SmithyCard(self) for _ in range(3)]
        for player in self.table:
            pdeck = list(starting_deck) # deep copy
            random.shuffle(pdeck)
            player.set_deck(pdeck)
            player.draw_hand(5)
            for other_player in self.table:
                if other_player is not player:
                    other_player.other_draw_hand(player, 5)

        # begin starting player's turn
        for player in self.table:
            player.end_turn(None, start_player)



    def end_turn(self, player):
        """ A player says he's ending his turn. Check if it was his turn. 
        Then next player. """
        cur_player = self.table[self._curindex]

        if player == cur_player:
            self._curindex = (self._curindex + 1) % len(self.table)
            next_player = self.table[self._curindex]
            logger.info('turn of: %s' % next_player.name)
            for p in self.table:
                p.end_turn(cur_player, next_player)

        else: # not the current player: cheater?
            logger.warn('player %s tried to end his turn,' % player.name +
                        'but it was the turn of %s' % cur_player.name)


