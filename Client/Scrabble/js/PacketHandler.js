
// Functions to handle packets registered in Network.

var PacketHandler = 
{
	// *****************************************
	// SERVER > CLIENT
	// *****************************************
	/*
	Method: function(packet)
	{
		var header = packet.Read(0);
		var field1 = packet.Read(1);
		var field2 = packet.Read(2);
	},
	*/
	
	RecvAuthRequest(packet)
	{
		// Begin login
        Scrabble.MainMenu.Login();
	},
	
	RecvAuthAccept(packet)
	{
		// logged in ok
        Scrabble.MainMenu.LoginSuccess(packet.Read(1));
	},
	
	RecvAuthDeny(packet)
	{
		var error = packet.ReadInt(1);
        if(error == 1)
        {
            Scrabble.MainMenu.ShowError("Please choose a different name");
        }
        
        Network.Disconnect();
	},
    
    RecvGameListReply(packet)
    {
        if(Global.game.state.current != "Lobby")
            return;
        
        Scrabble.Lobby.ClearGames();
        
        for(var i=1;i<packet.Count();i++)
        {
            var s = packet.Read(i).split(",");
            var id = s[0];
            var name = s[1];
            var maxPlayers = s[2];
            var language = s[3];
            var currentPlayers = s[4];
            Scrabble.Lobby.AddGame(id, name, language, maxPlayers, currentPlayers)
        }
    },
    
    RecvBoardJoinAccept(packet)
    {
        var id = packet.Read(1);
        var name = packet.Read(2);
        var maxPlayers = packet.Read(3);
        var language = packet.Read(4);
        var currentPlayers = packet.Read(5);
        var isPublic = (packet.Read(6) == 1);
        
        var boardProps = {id: id, name: name, size: maxPlayers, language: language, currentsize: currentPlayers, isPublic: isPublic};
        Scrabble.Lobby.JoinBoard(boardProps);
    },
    
    RecvBoardPlayerList(packet)
    {
        var players = [];
        for(var i =1;i<packet.Count();i++)
        {
            var fields = packet.Read(i).split(",");
            players.push({name: fields[0], score: fields[1]});
        }
        
        Scrabble.Board.AddPlayers(players);
    },
    
    RecvBoardJoinDeny(packet)
    {
        UI.ShowMessageBar("Could not join game.");
    },
    
    // BOARD_START
    RecvBoardStart(packet)
    {
        Scrabble.Board.GameStart();
    },
    
    // BOARD_END
    RecvBoardEnd(packet)
    {
        // TODO: Packet has score info?
        Scrabble.Board.GameEnd();
    },
	
    // BOARD_SCORE
    RecvBoardScore(packet)
    {
        
    },
    
    // PLAYER_TURN
    RecvPlayerTurn(packet)
    {
        var name = packet.Read(1);
        if(name == Global.myUsername)
        {
            Scrabble.Board.TurnStart();
        }
        Scrabble.Board.SetCurrentPlayer(name);
    },
    
    //PLAYER_TILE_LIST
    RecvPlayerTileList(packet)
    {
        for(var i=1;i<packet.Count();i++)
        {
            Scrabble.Board.AddTileToHand(Scrabble.Board.GetTile(packet.Read(i)));
        }
        
        if(packet.Count() > 1)
            Scrabble.Board.RefreshHandTiles();
    },
    
    // PLAYER_SWAP_TILES_REPLY
    RecvPlayerSwapTilesReply(packet)
    {
        // 7 tiles + header
       if(packet.Count() == 8)
       {
            // Add hand tiles back to bag
            handTiles = Scrabble.Board.handTiles;
            for(var i=0;i<handTiles.length;i++)
            {
                Scrabble.Board.AddTileToBag(handTiles[i]);
            }
            
            // CLear hand
            Scrabble.Board.handTiles = []
            
            // Add new tiles to hand
           for(var i=1;i<packet.Count();i++)
           {
               Scrabble.Board.AddTileToHand(Scrabble.Board.GetTile(packet.Read(i)));
           }
           
           Scrabble.Board.RefreshHandTiles();
       }
       else
       {
           UI.ShowMessageBar("Bag does not have enough tiles left.");
       }
       
    },
    
    // PLAYER_PLAY_TILES_REPLY
    RecvPlayerPlayTilesReply(packet)
    {
        // List of tiles played
        var playername = packet.Read(1)
        
        // Don't play your own tiles, its already there.
        if(playername == Global.myUsername)
            return;
        
        for(var i=2;i<packet.Count();i++)
        {
            var tilearr = packet.Read(i).split(",");
            var id = parseInt(tilearr[0]);
            var x = parseInt(tilearr[1]);
            var y = parseInt(tilearr[2]);
            
            // Get an actual tile object
            var tile =  Scrabble.Board.GetTile(id);
            Scrabble.Board.AddTilesFromPlayerToBoard(playername,[{tile:tile,x:x,y:y}]);
        }
        
    },
    
    // PLAYER_BAD_WORD
    RecvPlayerBadWord(packet)
    {
        UI.ShowMessageBar("Invalid Word");
        Scrabble.Board.canPlay = true;
    },
    
    // PLAYER_BAD_MOVE
    RecvPlayerBadMove(packet)
    {
        UI.ShowMessageBar("Illegal Move");
        Scrabble.Board.canPlay = true;
    },
    
    // PLAYER_ACCEPT_MOVE
	RecvPlayerAcceptMove(packet)
    {
        Scrabble.Board.TurnEnd();
    },
    
    // PLAYER_TURN_EXPIRED
    RecvPlayerTurnExpired(packet)
    {
        UI.ShowMessageBar("You've ran out of time!");
        Scrabble.Board.TurnEnd();
    },
    
    RecvBoardChat(packet)
    {
        var from = packet.Read(1);
        var msg = packet.Read(2);
        
        Scrabble.Board.ShowChatBubble(from, msg);
    },
    
    RecvShowScoreboard(packet)
    {
        if(Global.game.state.current == "Board")
        {
            scores = [];
            
            for(var i=1;i<packet.Count();i++)
            {
                s = packet.Read(i).split(',');
                scores.push({name: s[0],score:s[1]});
            }
            
            Scrabble.Board.ShowScoreboard(scores)
        }
    },
    
	// *****************************************
	// CLIENT > SERVER
	// *****************************************
	/*
	Method: function()
	{
		if(Network.Connected())
		{
			
		}
	},
	*/
	
    SendBoardChat(msg)
    {
        packet = new Packet(Protocol.BOARD_CHAT);
        packet.Write(msg);
        Network.SendPacket(packet);
    },
    
    // PLAYER_PLAY_TILES_REQUEST
    SendPlayerPlayTilesRequest(tiles)
    {
        packet = new Packet(Protocol.PLAYER_PLAY_TILES_REQUEST);
        for(var i=0;i<tiles.length;i++)
        {
            packet.Write(tiles[i].tileID + "," + tiles[i].tileGridX + "," + tiles[i].tileGridY);
        }
        Network.SendPacket(packet);
    },
    
    // PLAYER_SWAP_TILES_REQUEST
    SendPlayerSwapTileRequest(tiles)
    {
        packet = new Packet(Protocol.PLAYER_SWAP_TILES_REQUEST);
        // swap all
        Network.SendPacket(packet);
    },
    
    //PLAYER_SKIP_TURN
    SendPlayerSkipTurn()
    {
       var packet = new Packet(Protocol.PLAYER_SKIP_TURN);
       Network.SendPacket(packet);
    },
    
    // BOARD_CREATE
    SendBoardCreate(gameType, size)
    {
        var packet = new Packet(Protocol.BOARD_CREATE);
        packet.Write(gameType);
        packet.Write(size);
        Network.SendPacket(packet);
    },
    
    SendBoardJoinRequest(boardID)
    {
        var packet = new Packet(Protocol.BOARD_JOIN_REQUEST);
        packet.Write(boardID);
        Network.SendPacket(packet);
    },
    
    SendGameListRequest()
    {
       var packet = new Packet(Protocol.GAME_LIST_REQUEST);
        Network.SendPacket(packet);
    },
	
    SendAuthReply(user,pass)
    {
        var packet = new Packet(Protocol.AUTH_REPLY);
        packet.Write(user);
        Network.SendPacket(packet);
    },
	
    SendGameLeaveRequest()
    {
        var packet = new Packet(Protocol.GAME_LEAVE_REQUEST);
        Network.SendPacket(packet);
    }
	
};
