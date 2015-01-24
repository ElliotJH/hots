from world import World
from player import Player


class Game(object):

    players = []

    def __init__(self):
        self.world = World()
        self.world.load('levels/example.level')

    def add_player(self, player):
        if player not in self.players:
            self.players.append(player)
            player.send_message(self.world.serialise())

    def remove_player(self, connection):
        self.players.remove(Player(connection))
