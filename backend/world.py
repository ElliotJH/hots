import math


class World:

    def __init__(self, tile_size=20):
        super().__init__()
        self.items = []
        self.tiles = None
        self.tile_size = tile_size
        self.player_locations = {}

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

    @staticmethod
    def collides(pos1, rad1, pos2, rad2):
        """Test for rectangular collisions for the demo"""
        x1 = pos1[0]
        y1 = pos1[1]

        x2 = pos2[0]
        y2 = pos2[1]

        # Right edge is over the left edge and
        # Left edge is not over the right edge
        right_horizontal_colliding = (
            ((x1 + rad1) > (x2 - rad2)) and ((x1 - rad1) < (x2 + rad2))
        )
        left_horizontal_colliding = (
            ((x1 - rad1) < (x2 + rad2)) and ((x1 + rad1) > (x2 - rad2))
        )
        vertical_colliding = (
            ((y1 + rad1) > (y2 - rad2)) and ((y1 - rad1) < (y2 + rad2))
        )

        horizontal_colliding = \
            right_horizontal_colliding or left_horizontal_colliding

        return horizontal_colliding and vertical_colliding

    def move_player(self, player, direction, distance=5):
        angle = {
            'up': 180, 'down': 0, 'left': 270, 'right': 90,
            'upleft': 225, 'upright': 135, 'downleft': 315, 'downright': 45,
        }[direction]

        x, y = self.player_locations[player]
        new_x = distance * math.sin(math.radians(angle)) + x
        new_y = distance * math.cos(math.radians(angle)) + y

        new_position = (new_x, new_y)

        position = self.attempt_move((x, y), new_position)
        self.player_locations[player] = position

        return position

    def attempt_move(self, old_position, new_position, player_radius=20):
        # This is massively bugged - if the player tries to move through an
        # object then we're just fine with that.

        # Massively inefficient, we don't need to check many of these at all
        for (row_num, columns) in enumerate(self.tiles):
            for (col_num, cell) in enumerate(columns):
                if self.collides(
                    new_position,
                    player_radius,
                    (col_num, row_num),
                    self.tile_size,
                ):
                    return old_position
        return new_position

    # Serialisation to structures that can be JSON'd

    def serialise_tiles(self):
        return {'world': self.tiles}

    def serialise_state(self):
        return {
            'players': [
                {'id': x.id, 'location': y}
                for x, y in self.player_locations.items()
            ],
        }
