from serverbasic.basicgame import BasicGame
from serverbasic.player import BasicPlayer


class PiratePlayer(BasicPlayer):

    def __init__(self, game, name, handler):
        BasicPlayer.__init__(self, game, name, handler)

    def serialize(self):
        return {'name':self.name}


class PirateGame(BasicGame):
    """ """

    def __init__(self, port, url):
        BasicGame.__init__(self, port, url, PiratePlayer)

