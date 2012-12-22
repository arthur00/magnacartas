from tornado.websocket import WebSocketHandler
import json
import tornado.ioloop
import tornado.web
from logger import logger


gateway = None
def set_gateway(gw):
    global gateway
    gateway = gw

class ClientHandler(WebSocketHandler):
    """ Websocket handler. Sends and receives messages from/to clients. """

    def __init__(self, application, request, **kwargs):
        WebSocketHandler.__init__(self, application, request, **kwargs)
        self._player = None

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
            self._player.disconnect()

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
            args = m['join']
            player = gateway.add_player(args, self)
            self._player = player
        else:
            # if m is {'draw': {'qty':3}}
            # then call game.on_draw({'qty':3})
            for cmd, args in m.items():
                try:
                    getattr(gateway, 'on_' + cmd)(args)
                except AttributeError:
                    logger.error('No such callback: ' + 'on_' + cmd)


def start_server(port, url):
    app = tornado.web.Application([(url, ClientHandler)])
    app.listen(port)
    tornado.ioloop.IOLoop.instance().start()
