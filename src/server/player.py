from logger import logger


class Player():
    """ Basic player model. Created when a player logs in.
    Provides methods for "I disconnected" and "another player joined/left".
    """

    def __init__(self, game, name, conn_handler):
        self._game = game
        self.name = name
        self._handler = conn_handler


    def serialize(self):
        return {'name':self.name}


    @property
    def isconnected(self):
        return self._handler != None


    def disconnect(self):
        """ The player's endpoint disconnected. """
        logger.info('player left: %s' % self.name)
        self._game.remove_player(self.name)
        self._handler = None


    def kickout(self, new_handler):
        """ Kick a player out of the game. Notify that player."""
        msg = {'kick': {}}
        self.send(msg)
        self._handler.close()
        self._handler = new_handler


    def send(self, msg):
        """ Send a msg through the client handler.  """
        self._handler.send(msg)


    def player_joined(self, player):
        """ Notify the client that another player joined. """
        msg = {'playerJoined': player.serialize()}
        self.send(msg)


    def player_left(self, player):
        """ Notify the client that another player left. """
        msg = {'playerLeft': player.serialize()}
        self.send(msg)


    def welcome(self, players):
        splayers = [player.serialize() for player in players]
        msg = {'welcome': {'players':splayers}}
        self.send(msg)


