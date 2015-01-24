from world import World


class Game(object):

    players = []

    def __init__(self):
        self.world = World()
        self.world.load('levels/example.level')

    def add_player(self, player):
        if player not in self.players:
            self.players.append(player)

    def remove_player(self, player):
        self.players.remove(player)
