import json

from world import World
from player import Player

MIN_PLAYERS = 1
LOBBY_TIMEOUT = 10


class Game:

    def __init__(self):
        super().__init__()
        self.players = {}

        self.reset()

    def reset(self):
        self.tick_count = 0
        self.start_timeout = 0
        self.starting = False
        self.world = World()
        self.world.load('levels/example.level')

    def add_player(self, connection):
        if connection in self.players:
            raise ValueError("Player already in game")

        player = Player()
        self.players[connection] = player
        self.world.add_player(player)

        data = {
            'id': player.id,
        }

        data.update(**self.world.serialise_world(player))

        self.send(connection, data, 'world')
        print("Players connected", len(self.players))

        if len(self.players) >= MIN_PLAYERS:
            self.start()

    def remove_player(self, connection):
        if connection in self.players:
            player = self.players[connection]
            del self.players[connection]
            self.world.remove_player(player)

        print("Players connected", len(self.players))

        if not len(self.players):
            self.reset()

    def tick(self):
        self.tick_count += 1
        self.world.tick()
        for connection, player in self.players.items():
            if player.has_succeeded:
                self.end(player)
                return

        for connection, player in self.players.items():
            data = self.world.serialise_state(player)
            data.update(tick=self.tick_count)
            self.send(connection, data, 'tick')

        self.start_if_needed()

    def receive_message(self, connection, message):
        command = json.loads(message)
        if command['type'] == 'movement':
            self.world.move_player(
                self.players[connection],
                command['direction'],
                command['angle'],
            )
        elif command['type'] == 'throw_left':
            try:
                self.world.throw(self.players[connection], 'left')
            except ValueError:
                pass
        elif command['type'] == 'throw_right':
            try:
                self.world.throw(self.players[connection], 'right')
            except ValueError:
                pass
        elif command['type'] == 'join':
            self.players[connection].name = command['name']
            print(command['name'], 'joined')

    def start_if_needed(self):
        if not self.starting:
            return

        print(self.start_timeout)
        if self.start_timeout == 0:
            self.send_start()
            self.starting = False
        else:
            self.start_timeout -= 1

    def start(self):
        self.starting = True
        self.start_timeout = LOBBY_TIMEOUT
        for connection in self.players.keys():
            self.send(connection, {}, 'starting')

    def send_start(self):
        for connection in self.players.keys():
            self.send(connection, {
                'state': 'game',
                'tick': self.tick_count,
            }, 'state')

    def end(self, winner):
        for connection in self.players.keys():
            self.send(connection, {
                'state': 'end',
                'tick': self.tick_count,
            }, 'state')
            self.send(connection, {'winner': winner.id}, 'winner')

    # Utility Methods

    def send(self, connection, data, message_type):
        data.update(type=message_type)
        connection.sendMessage(json.dumps(data).encode('utf8'))
