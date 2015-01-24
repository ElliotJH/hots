import random

from constant_objects import game_objects, weapons as weapon_id


class Player:

    def __init__(self):
        super().__init__()
        self.id = random.randint(10000, 99999)

        self.item_1 = None  # Should be 'fist'
        self.item_2 = None
        self.timeout = 0

        self.needed_item_1 = None  # Should be a randomly chosen item
        self.needed_item_2 = None

        self.world_id = None

    @property
    def item_1_empty(self):
        fists = game_objects[weapon_id]['start_with_fists']
        return self.item_1 is None or self.item_1.item_id == fists

    @property
    def item_2_empty(self):
        fists = game_objects[weapon_id]['start_with_fists']
        return self.item_2 is None or self.item_2.item_id == fists

    def reset_item_1(self):
        self.item_1 = game_objects[weapon_id]['start_with_fists']
    def reset_item_2(self):
        self.item_2 = game_objects[weapon_id]['start_with_fists']

    @property
    def has_succeeded(self):
        return (
            self.item_1 == self.needed_item_1
            and self.item_2 == self.needed_item_2
        )

    def decrement_timeout(self, amount):
        if self.timeout > amount:
            self.timeout -= amount
        else:
            self.timeout = 0

    def add_timeout(self, amount):
        self.timeout += amount  # we want some logic to stop this getting huge
