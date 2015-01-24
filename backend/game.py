import json

from world import World
from player import Player


class Game:

    players = {}

    def __init__(self):
        self.world = World()
        self.world.load('levels/example.level')

    def add_player(self, connection):
        if connection in self.players:
            raise ValueError("Player already in game")

        self.players[connection] = Player()

        data = json.dumps(self.world.serialise())
        connection.sendMessage(data.encode('utf8'))

        print("Players connected", len(self.players))

    def remove_player(self, connection):
        if connection in self.players:
            del self.players[connection]

        print("Players connected", len(self.players))
