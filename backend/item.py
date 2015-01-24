class Item(object):
    def __init__(self, item_id):
        self.item_id = item_id
        self.position = (None, None)
        super(self, Item).__init__()
