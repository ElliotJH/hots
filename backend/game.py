from world import World


class Game(object):

    players = []

    def __init__(self):
        self.world = World()

    def add_player(self, player, connection):
        self.players[player] = connection
