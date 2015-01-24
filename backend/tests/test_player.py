import player

def test_timeout():
    p = player.Player()
    p.add_timeout(100)
    p.decrement_timeout(200)

    assert p.timeout == 0
