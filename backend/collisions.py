def Circle():
    def __init__(self, x, y, r):
        self.x = x
        self.y = y
        self.r = r

def Square():
    def __init__(self, x1, x2, y1, y2):
        self.x1 = x1
        self.x2 = x2
        self.y1 = y1
        self.y2 = y2

def circle_circle(c1, c2):
    collision = (c2.x - c1.x)**2 + (c2.y - c1.y)**2 <= (c2.r + c1.r)**2
    
    return collision

def square_square(s1, s2):
    horizontal = (s1.x1 <= s2.x1 <= s1.x2) or (s1.x1 <= s2.x2 <= s1.x2)
    vertical = (s1.y1 <= s2.y1 <= s1.y2) or (s1.y1 <= s2.y2 <= s1.y2)

    return horizontal and vertical

def circle_square(c, s):
    center_inside_rect = (s.x1 <= c.x <= s.x2) and (s.y1 <= c.y <= s.y2)

    # left crosses circle
    left = ((s.x1 > (c.x - r)) and (s.x1 < (c.x + r)))
    right = ((s.x2 > (c.x - r)) and (s.x2 < (c.x + r)))
    top = ((s.y1 > (c.y - r)) and (s.y1 < (c.y + r)))
    bottom = ((s.y1 > (c.y - r)) and (s.y1 < (c.y + r)))

    matches = (left and top) or (left and bottom) or (right and top) or (right and bottom) or circle_inside_rect
    

    return matches
    
    
