class Item:

    def __init__(self, item_id):
        self.item_id = item_id

    def __hash__(self):
        return self.item_id

    def __eq__(self, other):
        if not isinstance(other, Item):
            return False

        return self.item_id == other.item_id
