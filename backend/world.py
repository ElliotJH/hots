import numpy
import math

class World:

    def __init__(self, tile_width=20):
        super().__init__()
        self.items = []
        self.players = {}
        self.tiles = None
        self.tile_size = 20

    def load(self, fname):
        with open(fname, 'r') as f:
            self.tiles = [[int(i) for i in line if i != '\n'] for line in f]

    def as_dict(self):
        return {'world': self.tiles}

    def add_player(self, player):
        if not player in self.players:
            self.players[player] = (0, 0)

    @staticmethod
    def collides(pos1, rad1, pos2, rad2):
        """Test for rectangular collisions for the demo"""
        x1 = pos1[0]
        y1 = pos1[1]

        x2 = pos2[0]
        y2 = pos2[1]

        #Right edge is over the left edge and
        #Left edge is not over the right edge
        horizontal_colliding = ((x1 + rad1) > (x2 - rad2)) and ((x1 - rad1) < (x2 + rad2))
        vertical_colliding = ((y1 + rad1) > (y2 - rad2)) and ((y1 - rad1) < (y2 + rad2))
        
        return horizontal_colliding and vertical_colliding
        
    def move(self, player, direction, distance=10):
        old_position = self.players[player]
        new_x = distance * math.sin(direction) + old_position[0]
        new_y = distance * math.cos(direction) + old_position[1]

        new_position = (new_x, new_y)

        position = self.move(old_position, new_position)
        self.players[player] = position
        
        return position

    def attempt_move(self, old_position, new_position, player_radius=20):
        #This is massively bugged - if the player tries to move through an object then we're just fine with that.

        #Massively inefficient, we don't need to check many of these at all
        for (rownum, columns) in enumerate(tiles):
            for (colnum, cell) in enumerate(row):
                if self.collides(new_position, player_radius, (colnum, rownum), self.tile_width):
                    return old_position
        return new_position
        
        
        
