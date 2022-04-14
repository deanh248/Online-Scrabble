"""

manages scrabble boards

"""

import Scrabble
import PacketHandler

boardList = []
lastTableID = 0

def createBoard(isPublic, size, language, creator):
    
    global lastTableID, boardList
    
    # To generate a safe id
    lastTableID += 1

    if isPublic:
        tableID = "tbl_" + str(lastTableID)
    else:
        tableID = creator.name + "_" + str(lastTableID)
        
    board = Scrabble.Board(tableID, isPublic, size, language, creator)
    boardList.append(board)
    
    # Broadcast list update
    PacketHandler.BroadcastGameList()
    
    return board

def getBoardById(id):
    global boardList

    for board in boardList:
        if board.id == id:
            return board
    return None
    
def getPublicBoards():
    global boardList
    
    boards = []
    for board in boardList:
        if not board.isPublic and not board.hasEnded:
            boards.append(board)
            
    return boards
    
def update():
    global boardList
    
    runningBoards = []
    
    for board in boardList:
        if not board.hasEnded:
            board.update()
            runningBoards.append(board)
        else:
            # Remove all players from this board.
            while len(board.playerList) > 0:
                board.removePlayer(board.playerList[0]);
            
    if len(runningBoards) != len(boardList):
        # Broadcast list update
        PacketHandler.BroadcastGameList()
    
    # Remove hasEnded boards
    boardList = runningBoards
    