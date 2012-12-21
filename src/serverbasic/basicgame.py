from gateway import set_gateway
from logger import logger
from tornadocomm import start_server




class BasicGame():
    """ A running game instance. 
    Players are created when the game instance is created, not when they login.
    """

    def __init__(self, port, url, PlayerClass):
        """ Start with empty data (eg no available card piles) """
        global game
        game = self # for use in the communication layer
        self.players = {}
        self.__Player = PlayerClass # internal
        # set myself as gateway to receive messages from the tornado handlers
        set_gateway(self)
        # start tornado
        start_server(port, url)


    def add_player(self, pname, handler):
        """ Add a player. If he was connected already, close the old connection.
        Notify all other currently connected clients.
        Return the new instance of the player.
        """
        # kick the player with that name out if he's already connected
        if pname in self.players.keys():
            logger.error('player was already connected: %s' % str(pname))
            self.players[pname].kickout()
            del self.players[pname]
        # in any case, create new player and send him the game state
        new_player = self.__Player(self, pname, handler)
        # notify all current players
        players = self.players.values()
        for cur_player in players:
            cur_player.player_joined(new_player)
        # add the new player
        self.players[pname] = new_player
        players = self.players.values()
        new_player.welcome(players)
        logger.info('player joined: %s' % str(pname))
        return new_player


    def remove_player(self, pname):
        """ Remove player if he was connected already. """
        try:
            player = self.players[pname]
            del self.players[pname]
            for cur_player in self.players.values():
                cur_player.player_left(player)
        except KeyError:
            logger.error('player not found: %s' % pname)




