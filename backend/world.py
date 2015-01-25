import math
import random

from item import Item
from constant_objects import levels as level_ids, weapons as weapon_id, \
    game_objects

ITEM_SPEED = 15
SPEED = 5
DEFAULT_LOOK_ANGLE = 0


class World:

    def __init__(self, tile_size=40):
        super().__init__()
        self.tiles = None
        self.tile_size = tile_size
        self.player_locations = {}
        self.item_locations = {}
        self.items_moving = {}  # map from item to (direction, speed)

    def initialize_objects(self):
        # Filter by players in the game? maybe just assign a number of worlds
        # or something
        free_tile_positions = [
            (
                colnum * self.tile_size,
                rownum * self.tile_size,
                DEFAULT_LOOK_ANGLE,
            )
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
        self.set_player_world(player)
        self.set_player_location(player)
        self.set_player_desired_items(player)
        self.set_player_starting_items(player)

    def set_player_world(self, player):
        player.world_id = random.choice(list(level_ids.values()))

    def set_player_desired_items(self, player):
        world_items = game_objects[player.world_id]
        item_1, item_2 = random.sample(list(world_items.values()), 2)
        player.needed_item_1, player.needed_item_2 = Item(item_1), Item(item_2)

    def set_player_starting_items(self, player):
        fists = game_objects[weapon_id]['start_with_fists']
        player.item_1 = player.item_2 = Item(fists)

    def set_player_location(self, player):
        if len(self.start_tile_positions) > 0:
            x, y = random.choice(self.start_tile_positions)
            self.player_locations[player] = (x, y, DEFAULT_LOOK_ANGLE)
        else:
            self.player_locations[player] = (100, 100, DEFAULT_LOOK_ANGLE)

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

    def move_player(self, player, direction, look_angle, distance=SPEED):
        try:
            angle = {
                'up': 180, 'down': 0, 'left': 270, 'right': 90,
                'upleft': 225, 'upright': 135,
                'downleft': 315, 'downright': 45,
                'upleftright': 180,
                'downleftright': 0,
            }[direction]
        except KeyError:
            angle = 0
            distance = 0

        x, y, l = self.player_locations[player]
        new_x = distance * math.sin(math.radians(angle)) + x
        new_y = distance * math.cos(math.radians(angle)) + y

        new_position = (new_x, new_y, look_angle)

        position = self.attempt_player_move(player, (x, y, l), new_position)
        self.attempt_pickup(position, player)
        self.player_locations[player] = position

        return position

    def throw(self, player, hand):
        player_location = self.player_locations[player]
        direction = player_location[2]
        if hand == 'left':
            if player.item_1_empty:
                return
            item = player.item_1
            player.reset_item_1()

            proposed_x = player_location[0]
            proposed_y = player_location[1]

            new_x = 100 * math.sin(direction) + proposed_x
            new_y = 100 * math.cos(direction + math.pi) + proposed_y

            actual_x, actual_y = self.attempt_move(
                (proposed_x, proposed_y),
                (new_x, new_y),
                object_radius=0,
                blocked=[1, 2],
            )

            print("throw_l", direction, new_x, new_y, proposed_x, proposed_y, actual_x, actual_y)
            self.item_locations[item] = (actual_x, actual_y)
            self.items_moving[item] = (player_location[2], ITEM_SPEED)

        if hand == 'right':
            if player.item_2_empty:
                return
            item = player.item_2
            player.reset_item_2()

            proposed_x = player_location[0]
            proposed_y = player_location[1]

            new_x = 100 * math.sin(direction) + proposed_x
            new_y = 100 * math.cos(direction + math.pi) + proposed_y

            actual_x, actual_y = self.attempt_move(
                (proposed_x, proposed_y),
                (new_x, new_y),
                object_radius=0,
                blocked=[1, 2],
            )
            print("throw_r", new_x, new_y, proposed_x, proposed_y, actual_x, actual_y)
            self.item_locations[item] = (actual_x, actual_y)
            self.items_moving[item] = (player_location[2], ITEM_SPEED)

    def tick(self):
        coefficient_of_friction = 0.75
        to_remove = []
        for item, (direction, speed) in self.items_moving.items():
            if item not in self.item_locations.keys():  # Item picked up
                to_remove += [item]
                continue

            self.items_moving[item] = (
                direction,
                coefficient_of_friction * speed,
            )

            if speed < 0.0001:
                to_remove += [item]

            x, y = self.item_locations[item]
            new_x = speed * math.sin(direction + math.pi) + x
            new_y = speed * math.cos(direction + math.pi) + y

            new_x, new_y = self.attempt_move(
                (x, y),
                (new_x, new_y),
                object_radius=0,
                blocked=[1, 2],
            )

            if (new_x, new_y) == (x, y):
                to_remove += [item]

            self.item_locations[item] = (new_x, new_y)

        for item in to_remove:
            del self.items_moving[item]

    def attempt_pickup(self, new_position, player, player_radius=0):
        if not (player.item_1_empty or player.item_2_empty):
            return

        to_delete = []
        for item, position in self.item_locations.items():
            if self.collides(new_position, player_radius, position, 40):
                # Nasty hardcode
                if player.item_1_empty:
                    player.item_1 = item
                    to_delete.append(item)
                elif player.item_2_empty:
                    player.item_2 = item
                    to_delete.append(item)
            if not (player.item_1_empty or player.item_2_empty):
                break  # No need to keep on trying.

        for item in to_delete:
            del self.item_locations[item]


    def attempt_player_move(self, player, old_position, new_position, player_radius=0):
        if player.has_succeeded:
            block = [1]
        else:
            block = [1, 2]

        new_pos = self.attempt_move(
            old_position,
            new_position,
            player_radius,
            block,
        )

        return new_pos

    def attempt_move(self, old_position, new_position, object_radius=0, blocked=[1, 2]):
        for (row_num, columns) in enumerate(self.tiles):
            for (col_num, cell) in enumerate(columns):
                if cell in blocked:
                    if self.collides(
                            new_position,
                            object_radius,
                            (
                                col_num * self.tile_size,
                                row_num * self.tile_size,
                            ),
                            self.tile_size,
                    ):
                        return old_position
        return new_position

    # Serialisation to structures that can be JSON'd

    def serialise_world(self, player):
        return {
            'world': self.tiles,
            'items': [
                {'id': x.item_id, 'location': y}
                for x, y in self.item_locations.items()
            ],
            'player_wanted': [
                player.needed_item_1.item_id if player.needed_item_1 else None,
                player.needed_item_2.item_id if player.needed_item_2 else None,
            ],
        }

    def serialise_state(self, player):
        return {
            'players': [
                {'id': x.id, 'location': y, 'name': x.name}
                for x, y in self.player_locations.items()
            ],
            'items': [
                {'id': x.item_id, 'location': y}
                for x, y in self.item_locations.items()
            ],
            'player_items': [
                player.item_1.item_id if player.item_1 else None,
                player.item_2.item_id if player.item_2 else None,
            ],
        }
