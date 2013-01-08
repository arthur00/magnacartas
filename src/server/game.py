from logger import logger
from player import Player
from server.card import pick_piles, CopperCard, CommodoreCard
from tornadocomm import set_gateway, start_server


# how many piles to empty for the game to end
NUM_PILES_FOR_GAME_END = 1


class PirateGame():
    """ A running game instance. 
    Players are created when the game instance is created, not when they login.
    """

    def __init__(self, port, url, numplayers):
        """ Init state and start web server. """
        self.numplayers = numplayers
        self.table = []
        self.reset()
        set_gateway(self) # to receive messages from the tornado handlers
        start_server(port, url) # start tornado



    def reset(self):
        """ Remove any previously connected player.
        The game will start when enough players are connected.  
        """
        for player in self.table:
            player.kick_out()
        self.table = []
        self.game_started = False
        self.piles = {} # map card name to card class
        self.num_piles_gone = 0
        self._curindex = 0
        logger.info('game reset')



    @property
    def cur_player(self):
        return self.table[self._curindex]

    @property
    def prev_player(self):
        index = (self._curindex - 1) % len(self.table)
        return self.table[index]

    @property
    def next_player(self):
        index = (self._curindex + 1) % len(self.table)
        return self.table[index]


    def get_player(self, pname):
        """ Return the connected player with that name. 
        Return None if not found.
        """
        for player in self.table:
            if player.name == pname:
                return player
        return None



    def add_player(self, args, handler):
        """ Add a player and notify all other currently connected clients. 
        Only accept new players if the game did not start yet.
        """
        pname = args['name']

        # dont accept the connection if the game already started 
        # or if the player is already connected
        if self.game_started or self.get_player(pname):
            handler.close()

        else:# a new player arrived
            pos = len(self.table)
            new_player = Player(self, pname, handler, pos)
            # notify all current players
            cur_players = list(self.table)
            self.table.append(new_player)
            for cur_player in cur_players:
                cur_player.ntf_playerjoined(self.table, new_player)
            # send  the current game state to the new player
            new_player.welcome(self.table, self.numplayers)
            # start the game if enough players are connected
            if len(self.table) == self.numplayers:
                self.start_game()



    def remove_player(self, player):
        """ When a player disconnects, notify other players,
        and restart the game if there is only one player left. 
        """
        self.table.remove(player)
        for cur_player in self.table:
            cur_player.ntf_playerleft(self.table, player)
        if len(self.table) == 1:
            last_player = self.table[0]
            self.bc_gameover(last_player)



    def start_game(self):
        """ From now on, any player who leaves is considered a loser. 
        First send the piles and the table/order of the players.
        Then send the player's deck and hand.
        Finally, begin the starting player's turn.
        """

        # start the game
        self.piles = pick_piles(10)
        # prepare the players decks
        player_decks = {}
        for player in self.table:
            deck = [CopperCard(self) for _ in range(7)]
            deck += [CommodoreCard(self) for _ in range(3)]
            player_decks[player] = deck
        # send the table seating and the card piles
        self.game_started = True
        samplers = [card_class(self, True) for card_class in self.piles.values()]
        for player in self.table:
            player.ntf_gameinit(self.table, samplers)

        # each player prepares his hand and deck
        for player in self.table:
            deck = player_decks[player]
            player.reset_deck(deck)
            player.draw_hand()

        # begin starting player's turn
        start_player = self.cur_player
        start_player.start_turn()



    ########################  phases

    def bc_start_phase(self, player, rsrc):
        """ Broadcast the starting phase of a player. 
        rsrc are the resources given to the player (coins, buys, actions).
        """
        for p in self.table:
            p.ntf_start_phase(player, rsrc)


    def bc_action_phase(self, player):
        """ Broadcast the action phase of a player. """
        for p in self.table:
            p.ntf_action_phase(player)



    def bc_cleanup_phase(self, player, discard_top, num_discarded):
        """ Tell everyone that a player performs his cleanup phase. """
        for p in self.table:
            p.ntf_cleanup_phase(player, discard_top, num_discarded)



    def player_end_turn(self, player):
        """ A player ended his turn. Check for game end. 
        If the game end condition is not reached,
        start next player's turn. 
        """
        # check for game end
        if self.num_piles_gone == NUM_PILES_FOR_GAME_END:
            self.end_game()
        else: # game did not end: next player's turn
            self._curindex = (self._curindex + 1) % len(self.table)
            next_player = self.cur_player
            next_player.start_turn()



    def end_game(self):
        """ Determine the winner and send game over. """
        winner = self.table[0]
        for player in self.table[1:]:
            if player.score > winner.score:
                winner = player
        self.bc_gameover(winner)


    def bc_gameover(self, winner):
        """ A player won. Tell everyone, and restart the game. """
        logger.info('game over: %s won' % winner.name)
        for player in self.table:
            player.ntf_gameover(self.table, winner)
        self.reset()



    ##################  draws, deck, hand

    def bc_draw_cards(self, player, cards):
        """ Tell players that another player drew cards. """
        for p in self.table:
            p.ntf_draw_cards(player, cards)



    def bc_resetdeck(self, player, numcards):
        """ Notify all players that a player's deck was empty and reshuffled.
        numcards is the number of cards in the deck after it got reshuffled. 
        """
        for p in self.table:
            p.ntf_reset_deck(player, numcards)



    #####################  resources: actions, buys, coins

    def bc_gain_resources(self, player, resources):
        """ Notify all players that a player gained some resources. """
        for p in self.table:
            p.ntf_gain_resources(player, resources)



    def bc_playmoney(self, player, moneycards):
        """ A player plays a money card to buy stuffs. Notify everyone. """
        for p in self.table:
            p.ntf_playmoney(player, moneycards)



    def player_buy(self, player, coins, card_name):
        """ A player tries to buy a card from a buying pile. """
        card_class = self.piles[card_name]
        # enough money and cards left in the pile
        if coins >= card_class.cost:
            if card_class.qty_left > 0:
                card = card_class(self)
                if card.qty_left == 0:
                    self.num_piles_gone += 1
                player.buy_card(card)
                for p in self.table:
                    p.ntf_buy(player, card)

            else:# the client should not have sent a buy for that card
                logger.error('player %s' % player.name
                            + ' wants to buy a %s' % card_class.name
                            + ' but there are %d left in the pile' % card_class.qty_left)

        else: # the client should not have sent a buy for that card
            logger.error('player %s' % player.name
                        + ' wants to buy card %s' % card_class.name
                        + ' but he has only %d coins' % coins)


    #####################  play cards

    def bc_start_play_card(self, player, card):
        """ Notify all players that a player starts playing a card. """
        for p in self.table:
            p.ntf_start_play_card(player, card)

    def bc_end_play_card(self, player, card):
        """ Notify all players that a card is done with its effects. """
        for p in self.table:
            p.ntf_end_play_card(player, card)



