
import Network
import Player
import GameManager
import PlayerManager

lstEvents = {}

def AddEvent(proto, method):
    lstEvents[proto] = method

def Handle(player, packet):
    header = packet.ReadInt(0)
    lstEvents[header](player, packet)

def BroadcastPacket(packet, players, exclude=[]):
    for player in players:
        if not player in exclude:
            player.SendPacket(packet)

# methods

def RecvAuthReply(player, packet):
    """
    :type player: Player.Player
    :type packet: Network.Packet
    """
    print("Auth reply received")
    username = packet.Read(1)
    player.name = username

    # duplicate names
    for p in PlayerManager.lstPlayers:
        if p != player and p.name == player.name:
        
            if not p.isOnline:
                # This is a reconnect
                # TODO: Might be possible
                # 1. Migrate board variables from old player to new
                # 2. Replace the old player object in scrabble board playerList with the new one
                # 3. TODO: find a list of missing op codes to update the player with.
                print("Player {0} is attempting to reconnect - TODO".format(player.name))
                pass
        
            packet = Network.Packet(Network.Protocol.AUTH_DENY)
            packet.Write(1)
            player.SendPacket(packet);
            return 
    
    # Reply an auth_accept packet
    packet = Network.Packet(Network.Protocol.AUTH_ACCEPT)
    packet.Write(username)  # Tells user who he is
    player.SendPacket(packet)
    
def RecvGameListRequest(player, packet):
    print("Game list request from {0}".format(player.name))
    
    packet = Network.Packet(Network.Protocol.GAME_LIST_REPLY)
    
    for board in GameManager.boardList:
        if board.isPublic and not board.hasEnded:
            packet.Write("{0},{1},{2},{3},{4}".format(board.id,board.name, board.size, board.lang, board.currentPlayerCount))
        
    player.SendPacket(packet)

def RecvBoardJoinRequest(player, packet):
    boardID = packet.Read(1);
    print ("Join Request: {0}".format(boardID))
    
    board = GameManager.getBoardById(boardID)
    if(board != None):
        if(board.addPlayer(player)):
            # Send join accept
            packet = Network.Packet(Network.Protocol.BOARD_JOIN_ACCEPT)
            packet.Write(board.id)
            packet.Write(board.name)
            packet.Write(board.size)
            packet.Write(board.lang)
            packet.Write(board.currentPlayerCount)
            packet.Write(1) # isPublic game, regardless, so users joining dont get prompt to share link. - only the owner can.
            player.SendPacket(packet)
        else:
            # Send join fail
            packet = Network.Packet(Network.Protocol.BOARD_JOIN_DENY)
            player.SendPacket(packet)
    else:
        # Send join fail
        packet = Network.Packet(Network.Protocol.BOARD_JOIN_DENY)
        player.SendPacket(packet)
        # Trigger a game list update for this player (current list is outdated?)
        RecvGameListRequest(player, None)
    

def RecvGameLeaveRequest(player, packet):
    if not player.currentBoard == None:
        player.currentBoard.removePlayer(player)

def RecvPlayerPlayTilesRequest(player, packet):
    
    if not player.isTurn:
        print("Player {0} attempted to play without isTurn".format(player.name))
        return
    
    tiles = []
    for i in range(1,packet.Count()):
        tile = packet.Read(i).split(",")
        tiles.append({'id':int(tile[0]),'x':int(tile[1]),'y':int(tile[2])})
    
    if(player.currentBoard.playTiles(tiles)):
        packet = Network.Packet(Network.Protocol.PLAYER_ACCEPT_MOVE)
        player.SendPacket(packet)
        
        # Broadcast played tiles
        packet = Network.Packet(Network.Protocol.PLAYER_PLAY_TILES_REPLY)
        packet.Write(player.name)
        for tile in tiles:
            packet.Write("{0},{1},{2}".format(tile['id'],tile['x'],tile['y']))
            
        BroadcastPacket(packet,player.currentBoard.playerList)
        
    else:
        packet = Network.Packet(Network.Protocol.PLAYER_BAD_MOVE)
        player.SendPacket(packet)

def RecvPlayerSkipTurn(player, packet):
    
    if not player.isTurn:
        print("Player {0} attempted to play without isTurn".format(player.name))
        return
    
    if player.currentBoard is not None:
        # Mark as played
        player.hasPlayed = True
        player.lastMove = Player.Move.SKIP
        
        packet = Network.Packet(Network.Protocol.PLAYER_ACCEPT_MOVE)
        player.SendPacket(packet)
        
def RecvBoardChat(player, packet):
    if player.currentBoard is not None:
    
        msg = packet.Read(1)
        
        # Validation?
        
        # Broadcast new packet to board players
        packet = Network.Packet(Network.Protocol.BOARD_CHAT)
        packet.Write(player.name)
        packet.Write(msg)
        BroadcastPacket(packet, player.currentBoard.playerList)

def RecvBoardCreate(player, packet):
    if player.currentBoard is None:

        isPublic = False
        boardType = int(packet.Read(1));
        boardSize = int(packet.Read(2));
        
        if boardType == 1:
            isPublic = True
        
        print("Creating board TYPE: {0} SIZE: {1} PLAYER: {2}".format(boardType,boardSize,player.name))
        board = GameManager.createBoard(isPublic, int(boardSize), "EN", player)
        
        # join that player to his own board
        if(board.addPlayer(player)):
            # Send join accept
            packet = Network.Packet(Network.Protocol.BOARD_JOIN_ACCEPT)
            packet.Write(board.id)
            packet.Write(board.name)
            packet.Write(board.size)
            packet.Write(board.lang)
            packet.Write(board.currentPlayerCount)
            if(board.isPublic):
                packet.Write(1)
            else:
                packet.Write(2)
            player.SendPacket(packet)

def RecvPlayerSwapTilesRequest(player, packet):

    print("Recv PLAYER_SWAP_TILES_REQUEST:{0}".format(player.name))
    
    board = player.currentBoard
    if board is not None:
    
        # only when its your turn
        if(board.getCurrentPlayer() != player):
            return;
    
        if not player.isTurn:
            return;
    
        # Check if bag has 7 tiles left
        if(board.bag.countUnusedTiles() >= 7):
            # Pick 7 tiles
            newTiles = []
            for i in range(7):
                tile = board.bag.getRandomTileFromBag()
                if tile is None:
                    print("RecvPlayerSwapTilesRequest() - FATAL ERROR")
                    return
                newTiles.append(tile)
            
            # Return player tiles
            for tile in player.tiles:
                board.bag.placeTileInBag(tile.id)
            
            # Replace player tiles with new
            player.tiles = newTiles
            
            # end turn
            player.hasPlayed = True;
            
            # Send "end turn" packet
            packet = Network.Packet(Network.Protocol.PLAYER_ACCEPT_MOVE)
            player.SendPacket(packet)
            
            # Send a swap tile reply
            packet = Network.Packet(Network.Protocol.PLAYER_SWAP_TILES_REPLY)
            for t in player.tiles:
                packet.Write(t.id)
            player.SendPacket(packet);
            
            
            
# Broadcast a server wide game list update.
def BroadcastGameList():
    print("Broadcasting game list...")
    packet = Network.Packet(Network.Protocol.GAME_LIST_REPLY)
    
    for board in GameManager.boardList:
        if board.isPublic and not board.hasEnded:
            packet.Write("{0},{1},{2},{3},{4}".format(board.id,board.name, board.size, board.lang, board.currentPlayerCount))
     
    for player in PlayerManager.lstPlayers:
        player.SendPacket(packet)
            
            
AddEvent(Network.Protocol.AUTH_REPLY, RecvAuthReply)
AddEvent(Network.Protocol.GAME_LIST_REQUEST, RecvGameListRequest)
AddEvent(Network.Protocol.BOARD_JOIN_REQUEST, RecvBoardJoinRequest)
AddEvent(Network.Protocol.GAME_LEAVE_REQUEST, RecvGameLeaveRequest)
AddEvent(Network.Protocol.PLAYER_PLAY_TILES_REQUEST, RecvPlayerPlayTilesRequest)
AddEvent(Network.Protocol.BOARD_CHAT, RecvBoardChat)
AddEvent(Network.Protocol.PLAYER_SKIP_TURN, RecvPlayerSkipTurn)
AddEvent(Network.Protocol.BOARD_CREATE, RecvBoardCreate)
AddEvent(Network.Protocol.PLAYER_SWAP_TILES_REQUEST, RecvPlayerSwapTilesRequest)


