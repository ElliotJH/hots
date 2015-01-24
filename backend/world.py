class World:

    player_locations = {}

    def __init__(self):
        super().__init__()
        self.items = []
        self.tiles = None

    def load(self, fname):
        with open(fname, 'r') as f:
            self.tiles = [[int(i) for i in line if i != '\n'] for line in f]

    def add_player(self, player):
        if player in self.player_locations:
            raise ValueError("Player already in world")

        self.player_locations[player] = (100, 100)

    def remove_player(self, player):
        if player in self.player_locations:
            del self.player_locations[player]

    # Serialisation to structures that can be JSON'd

    def serialise_tiles(self):
        return {'world': self.tiles}

    def serialise_state(self):
        return {
            'players': {
                x.id: y for x, y in self.player_locations.items()
            },
        }
