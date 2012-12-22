from logger import logger
from player import Player
from tornadocomm import set_gateway, start_server



class PirateGame():
    """ A running game instance. 
    Players are created when the game instance is created, not when they login.
    """

    def __init__(self, port, url, numplayers):
        """ Init state and start web server. """
        self.reset(numplayers)
        set_gateway(self) # to receive messages from the tornado handlers
        start_server(port, url) # start tornado


    def reset(self, numplayers):
        """ Init the game state. """
        self.numplayers = numplayers
        self.table = []
        self.game_started = False
        self.curindex = 0

        
    def serialize(self):
        """ Return the list of connected players. """
        splayers = [player.serialize() for player in self.table]
        state = {'players': splayers}
        if self.game_started:
            state['curindex'] = self.curindex
        return state


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
        Return the new player instance to the socket.
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
            for cur_player in self.table:
                cur_player.player_joined(new_player)
            self.table.append(new_player)
            logger.info('player joined: %s' % str(pname))
            # send him the current game state 
            new_player.welcome(self.table)
            if len(self.table) >= self.numplayers: #enough players to start
                self.start_game()

            return new_player


    def remove_player(self, player):
        """ Remove player if he was connected already. """
        try:
            self.table.remove(player)
            for cur_player in self.table:
                cur_player.player_left(player)
            if len(self.table) == 1:
                self.game_over()
        except ValueError: # player not in the table
            logger.error('player not found: %s' % player.name)


    def start_game(self):
        self.game_started = True
        start_player = self.table[self.curindex]
        for player in self.table:
            player.game_start(self.table, start_player)


    def game_over(self):
        """ The winner is the player with highest score. 
        Notify everyone of the winner, and reset the game.
        """
        winner = self.table[0]
        for player in self.table[1:]:
            if player.score > winner.score:
                winner = player
        for player in self.table:
            if player == winner:
                player.game_over(self.table, True)
            else:
                player.game_over(self.table, False)
        
        self.reset(self.numplayers)
        
        
        