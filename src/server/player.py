from logger import logger



class Player():
    """ Basic player model. Created when a player logs in.
    Provides methods for "I disconnected" and "another player joined/left".
    """

    def __init__(self, game, name, conn_handler, pos):
        self._game = game
        self._handler = conn_handler
        self.name = name
        self.pos = pos # position in the table
        self.score = 0

    def __repr__(self):
        return '<Player self.name>'
    def __str__(self):
        return self.__repr__()


    def serialize(self):
        return {'name':self.name, 'pos': self.pos}


    @property
    def isconnected(self):
        return self._handler != None


    def disconnect(self):
        """ The player's endpoint disconnected. """
        self._game.remove_player(self)
        logger.info('player left: %s' % self.name)
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


    def welcome(self, table):
        msg = {'welcome': {'table':[p.serialize() for p in table]}}
        self.send(msg)

    def game_start(self, table, first_player):
        data = {'table':[p.serialize() for p in table]}
        data['firstPlayer'] = first_player.serialize()
        data['myPos'] = self.pos
        msg = {'gameStart': data}
        self.send(msg)

    def game_over(self, table, iswinner):
        scores = []
        for player in table:
            pdata = {'player':player.serialize()}
            pdata['score'] = player.score
            scores.append(pdata)
        msg = {'gameOver': {'scores':scores, 'winner':iswinner}}
        self.send(msg)





