class World(object):
    def __init__(self):
        self.items = []
        self.tiles = None
        super(World, self).__init__()
    def load(fname):
        with open(fname, 'r') as f:
            self.tiles = [[int(i) for i in line] for line in f]
            
