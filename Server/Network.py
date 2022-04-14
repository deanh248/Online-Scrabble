import Player
import PlayerManager
import queue
import Network
from autobahn.twisted.websocket import WebSocketServerProtocol, WebSocketServerFactory

class Protocol:
	# Simpler than login mechanic. 
    AUTH_REQUEST = 1
    AUTH_ACCEPT = 2
    AUTH_DENY = 3
    AUTH_REPLY = 4
    
    # A list of boards
    GAME_LIST_REQUEST = 5
    GAME_LIST_REPLY = 6
    
    # Ask server to create a board
    GAME_CREATE_REQUEST = 7
    
    # GAME_CREATE_REPLY = 8
    
    GAME_LEAVE_REQUEST = 9
    
	# Sent to server to join a board. (0: ID)
    BOARD_JOIN_REQUEST= 10
    BOARD_JOIN_ACCEPT = 11
    BOARD_JOIN_DENY = 12
    
    # Sent to client when board game starts.
    BOARD_START = 13
    
    # Sent to client when board game ends.
    BOARD_END = 14
    
    # Sent to server to create a board game.
    BOARD_CREATE = 15
    
    # Sent to client telling who's playing this board.
    BOARD_PLAYERLIST = 16
    
    # Sent to client a score update.
    BOARD_SCORE = 17
    
    # Possibly to resync client incase they disconnect or something - may not be used.
    BOARD_WORD_LIST = 18
    
    # Sent to client, saying whos turn it is to play
    PLAYER_TURN = 20
    
    # Sent to client, a list of tiles which they have in their hand.
    PLAYER_TILE_LIST = 21
    
    # Sent to server, client wants to skips/pass.
    PLAYER_SKIP_TURN = 22
    
    # Sent to server, client wants to swap certain tiles, (0: List of tile index to swap.)
    PLAYER_SWAP_TILES_REQUEST = 23
    PLAYER_SWAP_TILES_REPLY = 24
    
    # Sent to server, client wants to play a word or tiles. Not sure how to structure data yet, (0: tile,x,y 1: tile,x,y 2: tile,x,y)
    # REPLY broadcast to all clients if the word was valid.
    PLAYER_PLAY_TILES_REQUEST = 25
    PLAYER_PLAY_TILES_REPLY = 26
    
    # Sent to client, informs that their word was invalid
    PLAYER_BAD_WORD = 27
    
    # Sent to client, they did an illegal move.
    PLAYER_BAD_MOVE = 28
    
    # Sent to client, move was accepted.
    PLAYER_ACCEPT_MOVE = 29
    
    # Sent to client, turn expired
    PLAYER_TURN_EXPIRED = 30
    
    # chat
    BOARD_CHAT = 31
    
    SHOW_SCOREBOARD = 32

class Packet:

    def __init__(self, protocol=-1):
        self.data = []
        self.packetString = ""
        self.data.append(str(protocol));
    
    def Write(self, s):
        self.data.append(str(s))
    
    def Read(self, index):
        return self.data[index]
    
    def ReadInt(self, index):
        return int(self.Read(index))
    
    def AppendString(self, str):
        self.packetString += str
        self.ParsePacket()
    
    def ParsePacket(self):
        self.data = self.packetString.split("/")
    
    def Encode(self, str):
        return str.replace("/","%%")
        
    def Decode(self, str):
        return str.replace("%%","/")
        
    def ToString(self):
        delimiter = "/"
        return str(delimiter.join(self.data))
        
    def Count(self):
        return len(self.data)

class Websocket(WebSocketServerProtocol):

    def __init__(self):
        self.packetQueue = queue.Queue()
        self.myPlayer=None
        
    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))
        p = Player.Player(self)
        self.myPlayer = p;
        PlayerManager.AddPlayer(p);
        
    def onOpen(self):
        print("WebSocket connection open.")
        # Tell the client object is ready to login
        packet = Packet(Protocol.AUTH_REQUEST)
        self.SendPacket(packet)

    def onMessage(self, payload, isBinary):
        msg = payload.decode('utf8');
        # print("Text message received: {0}".format(msg))
        packet = Packet();
        packet.AppendString(msg)
        self.packetQueue.put(packet)

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {0}".format(reason))
        PlayerManager.RemovePlayer(self.myPlayer)
        
    def SendPacket(self, packet):
        print("sending >>" , packet.ToString())
        self.sendMessage(packet.ToString().encode('utf8'))
        
