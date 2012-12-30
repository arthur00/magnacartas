from tornado.websocket import WebSocketHandler
import json
import tornado.ioloop
import tornado.web
from logger import logger


gateway = None
def set_gateway(gw):
    """ The game sets itself as the gateway when it starts. """
    global gateway
    gateway = gw

class ClientHandler(WebSocketHandler):
    """ Websocket handler. Sends and receives messages from/to clients. """

    def __init__(self, application, request, **kwargs):
        WebSocketHandler.__init__(self, application, request, **kwargs)
        self._player = None

    def set_player(self, player):
        self._player = player

    def open(self):
        """ When a player opens a connection, don't do anything. """
        pass

    def close(self):
        """ Remove my player and close socket. """
        self._player = None
        WebSocketHandler.close(self)

    def on_close(self):
        """ Notify the player model that the client logged out. """
        if self._player:
            self._player.on_disconnect()

    def send(self, msg):
        """ Send in JSON format """
        self.write_message(json.dumps(msg))
        #logger.debug('sent ' + str(msg))

    def on_message(self, msg):
        """ Except for join, 
        other client commands are directly sent to the model. """
        m = json.loads(msg)
        #logger.debug('received ' + str(m))
        if 'join' in m:
            if not self._player: # in case the same player sends 'join' twice
                args = m['join']
                gateway.add_player(args, self)
        else:
            # if m is {'draw': {'qty':3}}
            # then call player.on_draw({'qty':3})
            for cmd, args in m.items():
                try:
                    if len(args):
                        getattr(self._player, 'on_' + cmd)(args)
                    else: # no args passed
                        getattr(self._player, 'on_' + cmd)()
                except AttributeError,e:
                    logger.error(e)


def start_server(port, url):
    app = tornado.web.Application([(url, ClientHandler)])
    app.listen(port)
    tornado.ioloop.IOLoop.instance().start()
