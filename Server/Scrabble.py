
'''
Main purpose is to manage player turns, keep track of scores, tiles, everything scrabble related
'''
import Network
import PacketHandler
import Player
from random import randint

class Board:
    def __init__(self, id, isPublic, size, lang, creator):
        self.name = creator.name+"'s Game"
        self.id = id
        self.isPublic = isPublic
        self.size = size
        self.lang = lang
        self.creator = creator
        self.currentPlayerCount = 0
        
        # Net
        self.playerListUpdated = False
        self.canUpdatePlayerTurn = False
        
        # Board Stuff
        self.grid = Grid()
        self.bag = Bag()
        self.playerList = []
        self.currentPlayerIndex = None
        self.hasStarted = False
        self.hasEnded = False
        
    def update(self):
    
        if self.hasEnded:
            return
    
        # Check if this game can end.
        if self.canEnd():
            print("Scrabble board {0} is ending...".format(self.id))
            self.hasEnded = True
            
            # Send scoreboard if game had started
            if(self.hasStarted):
                packet = Network.Packet(Network.Protocol.SHOW_SCOREBOARD)
                
                for player in self.playerList:
                    packet.Write("{0},{1}".format(player.name,player.score))
                    
                PacketHandler.BroadcastPacket(packet, self.playerList)
            return
        
        # Broadcast when player list chanes. (Someone leaves/joins)
        if  self.playerListUpdated:
            self.sendPlayerListUpdate()
            self.playerListUpdated = False
        
        # Broadcast when player turn changes.
        if self.canUpdatePlayerTurn:
            packet = Network.Packet(Network.Protocol.PLAYER_TURN)
            packet.Write(self.getCurrentPlayer().name)
            PacketHandler.BroadcastPacket(packet, self.playerList)
            self.canUpdatePlayerTurn = False
        
        if not self.hasStarted:
            if self.canStart():
                print("Scrabble board {0} is starting...".format(self.id))
                
                # Broadcast BOARD_START
                packet = Network.Packet(Network.Protocol.BOARD_START)
                PacketHandler.BroadcastPacket(packet,self.playerList)
                self.hasStarted = True
        else:
            # TODO: players with "isOnline = False" has left and will not join back. (remove them somehow without affecting the current players? - Return tiles to bag etc.)
            # Check if the current player has played. and find the next, etc.
            self.nextTurn()
                
    def canEnd(self):
        # Players who are online.
        validPlayers = []
        for player in self.playerList:
            if player.isOnline:
                validPlayers.append(player)
    
        # Table is empty, everyone is offline, (even the creator.)
        if len(validPlayers) == 0:
            return True
    
        if(self.hasStarted):
            if(len(validPlayers) <= 1):
                print("No one else left to play with.")
                return True
                
        # Everyone skipped - there are no words left to make.
        # TODO: Reshuffle if there are tiles left in the bag?
        for player in self.playerList:
            if not player.lastMove == Player.Move.SKIP:
                return False
        
        print("Game Ending because everyone has skipped.")
        return True
        
    def canStart(self):
        return len(self.playerList) == self.size
        
    def addPlayer(self, player):
        print("Scrabble.Board: Adding player {0}".format(player.name))
        
        # Don't allow late joins.
        if self.hasStarted:
            return False
    
        # List is full?
        if len(self.playerList) >= self.size:
            return False
    
        # Add if player has not already joined.
        if not player in self.playerList:
            player.currentBoard = self
            self.playerList.append(player)
            self.playerListUpdated = True
            return True
        else:
            return False
            
    def removePlayer(self, player):
        if player in self.playerList:
            print("Scrabble.Board: Removed player {0}".format(player.name))
            self.playerList.remove(player)
            self.playerListUpdated = True
            
            player.reset();
            
            return True
        else:
            return False
            
    def getPlayers(self):
        return self.playerList
    
    def getCurrentPlayer(self):
        return self.playerList[self.currentPlayerIndex]
    
    # Player request to play tiles
    def playTiles(self, tiles):
        
        # TODO: Add these on grid n check.
        valid = True
        for tile in tiles:
            
            id = tile['id']
            x = tile['x']
            y = tile['y']
            letter = self.bag.getTile(id).letter
            
            print("DEBUG: Player adding tile: id:{0},x:{1},y:{2},letter:{3}".format(id,x,y,letter))
        
        if(valid):
            # Get current player
            player = self.getCurrentPlayer()
        
            # Remove played tiles from player hand
            for tile in tiles:
                player.tiles.remove(self.bag.getTile(tile['id']))
                
            # Mark as played
            player.hasPlayed = True
            player.lastMove = Player.Move.PLAY
            
        return True
    
    def nextTurn(self):
    
        if(self.currentPlayerIndex == None):
            # Pick a player to play first
            print("Picking a player for first turn..")
            self.currentPlayerIndex = 0
            self.getCurrentPlayer().isTurn = True
            self.canUpdatePlayerTurn = True
            return
        
        # Each player must always have 7 tiles in their hand.
        # TODO: Check if bag has tiles remaining, this has not been tested well.
        # If there are no tiles left I assume that the player will have to skip and 
        # that will end the game anyway.
        for player in self.playerList:
            missingTileCount = 7-len(player.tiles)
            tilesAdded = []
            
            if(missingTileCount > 0):
                for i in range(missingTileCount):
                    tile = self.bag.getRandomTileFromBag()
                    if tile is not None:
                        player.tiles.append(tile)
                        tilesAdded.append(tile)
                
                # Send a tile list update
                if(len(tilesAdded)>0):
                    packet = Network.Packet(Network.Protocol.PLAYER_TILE_LIST)
                    for tile in tilesAdded:
                        packet.Write(tile.id)
                    player.SendPacket(packet)
        
        # Pick the next player if this one has already played.
        if(self.getCurrentPlayer().hasPlayed):
            print("Player has played, rotating")
            
            # Reset all players 'hasPlayed'
            for player in self.playerList:
                player.hasPlayed = False
                player.isTurn = False
        
            playerCount = len(self.playerList)-1
            if(self.currentPlayerIndex >= playerCount):
                self.currentPlayerIndex = 0
            else:
                self.currentPlayerIndex+=1
                
            self.getCurrentPlayer().isTurn = True
            self.canUpdatePlayerTurn = True
            
            return True
        else: 
            # Automatically play skip on offline players
            player = self.getCurrentPlayer()
            
            if not player.isOnline:
                player.hasPlayed = True
                player.lastMove = Player.Move.SKIP
                
            return False
    
    def sendPlayerListUpdate(self):
        if(len(self.playerList) > 0):
            packet = Network.Packet(Network.Protocol.BOARD_PLAYERLIST)
            for player in self.playerList:
                if(player.isOnline):
                    packet.Write("{0},{1}".format(player.name,player.score))
                else:
                    packet.Write("{0},{1}".format(player.name+"(OFFLINE)",player.score))
            PacketHandler.BroadcastPacket(packet, self.playerList)
            
'''
Not entirely sure if this will be used.
A scrabble grid (Functions for adding tiles, fetching words on the grid)
check objectives.txt for more info
'''

class Grid:
    def __init__(self):
        pass
      
class Bag:
    def __init__(self):
        self.tileList = []
        # Create tile pool
        # http://tile-counter.com/scrabble-tile-distribution-and-frequency-list
        # Can probably be simplified, but index should match the one on client, 
        # e.g first "A" is index 0, 2nd "A is index 1, first "B" is index 9, etc
        tiles = [
            "A","A","A","A","A","A","A","A","A",
            "B","B",
            "C","C",
            "D","D","D","D",
            "E","E","E","E","E","E","E","E","E","E","E","E",
            "F","F",
            "G","G","G",
            "H","H",
            "I","I","I","I","I","I","I","I","I",
            "J",
            "K",
            "L","L","L","L",
            "M","M",
            "N","N","N","N","N","N",
            "O","O","O","O","O","O","O","O",
            "P","P",
            "Q",
            "R","R","R","R","R","R",
            "S","S","S","S",
            "T","T","T","T","T","T",
            "U","U","U","U",
            "V","V",
            "W","W",
            "X",
            "Y","Y",
            "Z",
            "BLANK","BLANK"
        ]
        
        for id in range(len(tiles)-1):
            self.tileList.insert(id,Tile(id, tiles[id]))
    
    def countUnusedTiles(self):
        count=0
        for t in self.tileList:
            if(not t.isUsed):
                count +=1
        return count
    
    def getRandomTileFromBag(self):
        # Return a random unused "tile.isUsed=false" tile from tileList or None if no tiles r left.
        # TODO: improve somehow
        remainingTiles = []
        tile = None
        
        for t in self.tileList:
            if(not t.isUsed):
                remainingTiles.append(t)
        
        if(len(remainingTiles)>0):
            tile = remainingTiles[randint(0,len(remainingTiles)-1)]
        else:
            return None
            
        # tile is being used i.e no longer in bag.
        tile.isUsed = True
        
        return tile 
    
    def getRandomTilesFromBag(self, tileCount):
        # TODO: Alternative for above ^ bt picks a batch, or maybe just use this.
        pass
    
    def placeTileInBag(self, tileID):
        tile = self.tileList[tileID]
        tile.isUsed = False
        return True
    
    def removeTileFromBag(self, tileID):
        tile = self.tileList[tileID]
        tile.isUsed = True
        return True
    
    def getTile(self, tileID):
        return self.tileList[tileID]
        
      
class Tile:
    def __init__(self, id, letter):
        self.id = id
        self.letter = letter
        self.isUsed = False
        