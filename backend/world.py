import math
import random


from item import Item
from constant_objects import levels as level_ids, game_objects, weapons as weapon_id


class World:

    def __init__(self, tile_size=40):
        super().__init__()
        self.tiles = None
        self.tile_size = tile_size
        self.player_locations = {}
        self.item_locations = {}
        self.start_position = (100, 100)

    def initialize_objects(self):
        # Filter by players in the game? maybe just assign a number of worlds
        # or something
        free_tile_positions = [
            (colnum * self.tile_size, rownum * self.tile_size)
            for rownum, row in enumerate(self.tiles)
            for colnum, tile in enumerate(row)
            if tile == 0
        ]

        for level_id in level_ids.values():
            for item_id in game_objects[level_id].values():
                item_object = Item(item_id)
                position = random.choice(free_tile_positions)
                self.item_locations[item_object] = position

    def load(self, fname):
        with open(fname, 'r') as f:
            self.tiles = [[int(i) for i in line if i != '\n'] for line in f]

        self.start_tile_positions = [
            (colnum * self.tile_size, rownum * self.tile_size)
            for rownum, row in enumerate(self.tiles)
            for colnum, tile in enumerate(row)
            if tile == 3
        ]

        self.initialize_objects()

    def add_player(self, player):
        if player in self.player_locations:
            raise ValueError("Player already in world")
        self.set_player_location(player)
        self.set_player_desired_items(player)
        self.set_player_starting_items(player)
        
    def set_player_world(self, player):
        player.world_id = random.choice(list(level_ids.keys()))

    def set_player_desired_items(self, player):
        world_items = game_objects[player.world_id]
        player.needed_item_1, player.needed_item_2 = random.sample(list(world_items.values()))

    def set_player_starting_items(self, player):
        fists = game_objects[weapon_id]['start_with_fists']
        player.item_1 = player.item_2 = fists

    def set_player_location(self, player):
        if len(self.start_tile_positions) > 0:
            self.player_locations[player] = \
                random.choice(self.start_tile_positions)
        else:
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
        try:
            angle = {
                'up': 180, 'down': 0, 'left': 270, 'right': 90,
                'upleft': 225, 'upright': 135,
                'downleft': 315, 'downright': 45,
                'upleftright': 180,
                'downleftright': 0,
            }[direction]
        except KeyError:
            return self.player_locations[player]

        x, y = self.player_locations[player]
        new_x = distance * math.sin(math.radians(angle)) + x
        new_y = distance * math.cos(math.radians(angle)) + y

        new_position = (new_x, new_y)

        position = self.attempt_move((x, y), new_position)
        self.attempt_pickup(position, player)
        self.player_locations[player] = position

        return position

    def attempt_pickup(self, new_position, player, player_radius=0):
        if player.item_1 is not None and player.item_2 is not None:
            return

        for item, position in self.item_locations.items():
            if self.collides(new_position, player_radius, position, 40):
                # Nasty hardcode
                if player.item_1 is None:
                    player.item_1 = item
                    del self.item_locations[item]
                elif player.item_2 is None:
                    player.item_2 = item
                    del self.item_locations[item]
            if player.item_1 is not None and player.item_2 is not None:
                return  # No need to keep on trying.

    def attempt_move(self, old_position, new_position, player_radius=0):
        # This is massively bugged - if the player tries to move through an
        # object then we're just fine with that.

        # Massively inefficient, we don't need to check many of these at all
        for (row_num, columns) in enumerate(self.tiles):
            for (col_num, cell) in enumerate(columns):
                if cell == 1 and self.collides(
                        new_position,
                        player_radius,
                        (col_num * self.tile_size, row_num * self.tile_size),
                        self.tile_size,
                ):
                    return old_position
        return new_position

    # Serialisation to structures that can be JSON'd

    def serialise_world(self):
        return {
            'world': self.tiles,
            'items': [
                {'id': x.item_id, 'location': y}
                for x, y in self.item_locations.items()
            ],
        }

    def serialise_state(self):
        return {
            'players': [
                {'id': x.id, 'location': y}
                for x, y in self.player_locations.items()
            ],
            'items': [
                {'id': x.item_id, 'location': y}
                for x, y in self.item_locations.items()
            ]
        }
