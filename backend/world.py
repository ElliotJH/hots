class World(object):
    def __init__(self):
        self.items = []
        self.tiles = None
        super(World, self).__init__()
    def load(self, fname):
        with open(fname, 'r') as f:
            self.tiles = [[int(i) for i in line if i != '\n'] for line in f]
