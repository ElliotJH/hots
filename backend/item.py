class Item(object):

    def __init__(self, item_id):
        super(Item, self).__init__()
        self.item_id = item_id
        self.position = (None, None)
