var Network = {

	// SERVERS
	//webServer: "http://webpoker.no-ip.info/client/",
	webServer: "http://localhost/client_dev/",
	gameServer: "localhost",
	gamePort: 443,
	// ----
	mSocket: null,
	mPacketBuffer: new Packet,
	mPacketEvents: [],
	isConnected: false,
	isConnecting: false,
	mPacketQueue: [],

	connectTimeout: null,


	// Public methods
	/*
	GetServerListAndConnect: function()
	{

		Network.connectTimeout = window.setTimeout(function(){if(!Network.isConnected){Game.ShowModalDuration("Connection Timed Out",2000);Network.Disconnect();}}, 6000);

		Game.ShowModal("Querying Server List");
		$.ajax({
  			url: Network.webServer+"php/serverlist.php",
		})
  		.done(function( data )
		{
			var s = data.split(":");
			var server = s[0];
			var port = s[1];
			Network.Connect(server, port);
			
  		})
		.fail(function( jqXHR, textStatus, errorThrown ) {Game.ShowModalDuration("Master Server Offline",2000);});
	},
	*/

	Connect: function(s, p)
	{
		if(Network.isConnected)
			return;
			
		// Show overlay to lock controls
		if(!Network.isConnecting)
		{
            Scrabble.MainMenu.HideError();
			Scrabble.MainMenu.ShowInfo("Connecting...");
			
			Network._RegisterEvents();
			Network.mSocket = new WebSocket("ws://"+String(s)+":"+String(p)+"/poker"); 
			Network.mSocket.onopen = Network._onOpen;
			Network.mSocket.onmessage = Network._onMessage;
			Network.mSocket.onclose = Network._onClose;
			Network.mSocket.onerror = Network._onError;
			Network.isConnecting = true;
		}
	},
	
	Disconnect: function()
	{
		Network.isConnected = false;
		Network.isConnecting = false;
		// Disable disconnection message
		Network.mSocket.onclose = function () {};
		Network.mSocket.close();
		Network.mSocket = null;
	},
	
	Connected: function()
	{
		return Network.isConnected;
	},
	
	SendPacket: function(packet)
	{
		// Debug.AddLog(LogType.packet,"[SEND] ( "+Protocol.GetName(packet.GetHeader()) + " ) > " + packet.ToString());
		Network.mSocket.send(packet.ToString());
	},
	
	GetState: function()
	{
		return Network.mSocket.readyState;
	},
	
	// Private methods
	_onOpen: function()
	{
		Network.isConnected = true;
        Network.isConnecting = false;
		clearTimeout(Network.connectTimeout);
	},
	
	_onMessage: function(e)
	{
		Network.mPacketQueue.push(e.data);
		//Network._processPackets(e.data);
	},
	
	_onClose: function()
	{
        
        if(Global.game.state.current != "MainMenu")
        {
            Global.game.state.start("MainMenu");
        }

		Network.isConnected = false;
		Network.isConnecting = false;
        
        UI.Clear();
	},
	
	_onError: function()
	{
        
        if(!Network.isConnecting)
        {
            if(Global.game.state.current != "MainMenu")
            {
                Global.game.state.start("MainMenu");
                window.setTimeout(function(){Scrabble.MainMenu.ShowError("Connection Lost")},500);
            }
            
        }
        
		Scrabble.MainMenu.HideInfo();
		Scrabble.MainMenu.ShowError("Server Offline");
		
		Network.isConnected = false;
        Network.isConnecting = false;
        
        UI.Clear();
	},
	
	_processPackets: function()
	{
        if(!Network.isConnected)
            return;
        
		if(Network.mPacketQueue.length <= 0)
			return;
			
        if(Global.isLoading)
            return;
            
		var data = Network.mPacketQueue.shift();

		Network.mPacketBuffer.AppendString(data);
		if(Network.mPacketBuffer.IsReady())
		{

			if(typeof(Network.mPacketEvents[Network.mPacketBuffer.GetHeader()]) === "undefined")
			{
				// Debug.AddLog(LogType.packet,"[RECV] Unhanled ( "+Protocol.GetName(Network.mPacketBuffer.GetHeader()) + " ) > " + Network.mPacketBuffer.packetString);
				console.log("[ERROR] Unhandled Packet ( "+Protocol.GetName(Network.mPacketBuffer.GetHeader()) + " ) > " + Network.mPacketBuffer.packetString);
				Network.mPacketBuffer = new Packet;
				return;
			}
			
			// console.log("[RECV] Packet ( "+Protocol.GetName(Network.mPacketBuffer.GetHeader()) + " ) > " + Network.mPacketBuffer.packetString);
			// Debug.AddLog(LogType.packet,"[RECV] ( "+Protocol.GetName(Network.mPacketBuffer.GetHeader()) + " ) > " + Network.mPacketBuffer.packetString);
			
			Network.mPacketEvents[Network.mPacketBuffer.GetHeader()](Network.mPacketBuffer);
			Network.mPacketBuffer = new Packet;
			Network.isReading=false;
		}
		else
		{
			// Fragment - wait for more
		}
	},
	
	_RegisterEvents: function()
	{
		// Protocols and their handlers:
		Network.mPacketEvents[Protocol.AUTH_REQUEST] = PacketHandler.RecvAuthRequest;
		Network.mPacketEvents[Protocol.AUTH_ACCEPT] = PacketHandler.RecvAuthAccept;
		Network.mPacketEvents[Protocol.AUTH_DENY] = PacketHandler.RecvAuthDeny;
        Network.mPacketEvents[Protocol.GAME_LIST_REPLY] = PacketHandler.RecvGameListReply;
        Network.mPacketEvents[Protocol.BOARD_JOIN_ACCEPT] = PacketHandler.RecvBoardJoinAccept;
        Network.mPacketEvents[Protocol.BOARD_JOIN_DENY] = PacketHandler.RecvBoardJoinDeny;
        Network.mPacketEvents[Protocol.BOARD_PLAYERLIST] = PacketHandler.RecvBoardPlayerList;
        Network.mPacketEvents[Protocol.BOARD_START] = PacketHandler.RecvBoardStart;
        Network.mPacketEvents[Protocol.BOARD_END] = PacketHandler.RecvBoardEnd;
        Network.mPacketEvents[Protocol.BOARD_SCORE] = PacketHandler.RecvBoardScore;
        Network.mPacketEvents[Protocol.PLAYER_TURN] = PacketHandler.RecvPlayerTurn;
        Network.mPacketEvents[Protocol.PLAYER_TILE_LIST] = PacketHandler.RecvPlayerTileList;
        Network.mPacketEvents[Protocol.PLAYER_SWAP_TILES_REPLY]= PacketHandler.RecvPlayerSwapTilesReply;
        Network.mPacketEvents[Protocol.PLAYER_PLAY_TILES_REPLY]= PacketHandler.RecvPlayerPlayTilesReply;
        Network.mPacketEvents[Protocol.PLAYER_BAD_WORD]= PacketHandler.RecvPlayerBadWord;
        Network.mPacketEvents[Protocol.PLAYER_BAD_MOVE]= PacketHandler.RecvPlayerBadMove;
        Network.mPacketEvents[Protocol.PLAYER_ACCEPT_MOVE]= PacketHandler.RecvPlayerAcceptMove;
        Network.mPacketEvents[Protocol.PLAYER_TURN_EXPIRED]= PacketHandler.RecvPlayerTurnExpired;
        Network.mPacketEvents[Protocol.BOARD_CHAT]= PacketHandler.RecvBoardChat;
        Network.mPacketEvents[Protocol.SHOW_SCOREBOARD] = PacketHandler.RecvShowScoreboard;
        
		//Network.mPacketEvents[Protocol.] = PacketHandler.Recv; 
		
	},
	
};

// window.setInterval(function(){Network._processPackets();},100);

