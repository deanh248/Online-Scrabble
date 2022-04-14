
"""
Player object is created for each user.
"""

class Move:
    SKIP = 0     # Turn was skipped
    PLAY = 1     # Tile was played.
    SWAP = 2   # Tile was swapped

class Player:

    def __init__(self, ws):
        self.mWebsocket = ws
        self.name = ""
        self.isOnline = True
        self.reset();
        
    def reset(self):
        self.lastMove = None
        self.currentBoard = None
        self.score = 0
        self.tiles = []
        self.isTurn = False
        self.hasPlayed = False
        
        
    def SendPacket(self, packet):
        self.mWebsocket.SendPacket(packet)
        