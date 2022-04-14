"""
Manages player objects
"""

lstPlayers = []
removables = []

def AddPlayer(plr):
    global lstPlayers
    
    lstPlayers.append(plr)
    print("(AddPlayer) Players:" , lstPlayers)
	
def RemovePlayer(plr):
    global lstPlayers, removables

    if plr is None:
        print("Warning - attempting to RemovePlayer(None)")
        return
    
    print("(RemovePlayer) Players:" , lstPlayers)
    removables.append(plr)
    
def GetPlayerByName(name):
    pass

def GetPlayers():
    return lstPlayers;
    
def update():
    global removables, lstPlayers

    nonremovable = []
    
    for player in removables:
        player.isOnline = False
        # Check if player is in a game
        if player.currentBoard != None:
            if player.currentBoard.hasStarted:
                # If he's the current player, don't remove him yet.
                # Mark the player as offline by forcing a board player list update.
                player.currentBoard.playerListUpdated = True
                nonremovable.append(player)
            else:
                # Should be safe to remove, game nt yet started.
                player.currentBoard.removePlayer(player)
                lstPlayers.remove(player)
        else:
            lstPlayers.remove(player)
            
    removables = nonremovable