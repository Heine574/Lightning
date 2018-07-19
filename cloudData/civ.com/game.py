class tile:
    def __init__(self, ID, conns):
        self.id = ID
        self.conns = conns
    def render(tiles, x, y):
        render_next = {}
        for i in self.conns:
            if i in tiles:
                render_next[i] = (x + self.conns[i][0], y + self.conns[i][1])

ID_count = 0

def next_ID():
    global ID_count
    ID = ID_count
    ID_count += 1
    return ID

def generate():
    tiles = {}
    for i in range(10):
        ID = next_ID()
        tiles[ID] = tile(ID, {next_ID(): (1, 0), next_ID(): (1, 0), next_ID(): (1, 0), next_ID(): (1, 0), next_ID(): (1, 0), next_ID(): (1, 0)})
    return tiles

def render(tiles, x, y):
    rendered = []
    tiles[0].render(tiles, x, y)

tiles = generate()
