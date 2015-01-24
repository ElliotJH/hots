class Player(object):

    def __init__(self):
        self.item_1 = None  # Should be 'fist'
        self.item_2 = None
        self.timeout = 0

        self.needed_item_1 = None  # Should be a randomly chosen item
        self.needed_item_2 = None

        self.position = (None, None)
        super(Player, self).__init__()

    def decrement_timeout(self, amount):
        if self.timeout > amount:
            self.timeout -= amount
        else:
            self.timeout = 0

    def add_timeout(self, amount):
        self.timeout += amount  # we want some logic to stop this getting huge
