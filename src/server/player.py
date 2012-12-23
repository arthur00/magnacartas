from logger import logger



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


    def send(self, msg):
        """ Send a msg through the client handler.  """
        self._handler.send(msg)


    def welcome(self, table, numplayers):
        """ Send the current configuration of the table. 
        The game has not started yet. 
        """
        logger.info('player joined: %s' % self.name)
        data = {'table':[p.serialize('name') for p in table],
                'numPlayers':numplayers
                }
        msg = {'welcome': data}
        self.send(msg)


    def player_joined(self, table, new_player):
        """ Notify the client that another player joined. """
        data = {'table': [player.serialize('name') for player in table],
                'newPlayer': new_player.serialize('name')
                }
        msg = {'playerJoined': data}
        self.send(msg)


    def player_left(self, table, old_player):
        """ Notify the client that another player left. """
        data = {'table': [player.serialize('name') for player in table],
                'oldPlayer': old_player.serialize('name')
                }
        msg = {'playerLeft': data}
        self.send(msg)


    def game_start(self, table, first_player):
        """ Notify the client of the beginning of the game """
        data = {'table':[p.serialize('name') for p in table],
                'curPlayer': first_player.serialize('name')
                }
        msg = {'gameStart': data}
        self.send(msg)


    def game_over(self, table, winner):
        """ This player has won! """
        data = {'table': [player.serialize('name', 'score') for player in table],
                'winner': winner.serialize('name', 'score')
                }
        msg = {'gameOver': data}
        self.send(msg)


    def on_endMyTurn(self):
        """ The client says his turn ended. """
        self._game.end_turn(self)


    def end_turn(self, prev_player, next_player):
        """ Notify the client that someone's turn ended, 
        and someone's turn begins.
        """
        data = {'prev': prev_player.serialize('name'),
                'next': next_player.serialize('name')
                }
        msg = {'endTurn': data}
        self.send(msg)

