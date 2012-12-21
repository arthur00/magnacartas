from serverbasic.basicgame import logger


class BasicPlayer():
    """ Basic player model. Created when a player logs in.
    Provides methods for "I disconnected" and "another player joined/left".
    """

    def __init__(self, game, name, conn_handler):
        self._game = game
        self.name = name
        self._handler = conn_handler


    def serialize(self):
        """ Your custom player class should override this method
        and return a dictionary of player attributes to send on the network.
        """
        raise NotImplementedError


    @property
    def isconnected(self):
        return self._handler != None


    def disconnect(self):
        """ The player's endpoint disconnected. """
        logger.info('player left: %s' % self.name)
        self._game.remove_player(self.name)
        self._handler = None


    def kickout(self):
        """ Kick a player out of the game. """
        self._handler.close()
        self._handler = None


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


