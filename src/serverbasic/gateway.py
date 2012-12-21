""" Hack to get around cyclic imports between tornado and the basic game. """

__game_gateway = None # global because used by the tornado client handlers

def set_gateway(gateway):
    """ The game instance must set itself as the gateway.
    That way, tornado can call the game directly without cyclic imports.
    """
    global __game_gateway
    __game_gateway = gateway

def gateway():
    return __game_gateway
