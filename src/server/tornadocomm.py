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

    def on_close(self):
        """ Notify the player model that the client logged out. """
        if self._player:
            self._player.disconnect()

    def send(self, msg):
        self.write_message(json.dumps(msg))
        logger.debug('sent ' + str(msg))

    def on_message(self, msg):
        m = json.loads(msg)
        logger.debug('received ' + str(m))
        if 'join' in m:
            pname = m['join']['name']
            player = gateway.add_player(pname, self)
            self._player = player


def start_server(port, url):
    app = tornado.web.Application([(url, ClientHandler)])
    app.listen(port)
    tornado.ioloop.IOLoop.instance().start()