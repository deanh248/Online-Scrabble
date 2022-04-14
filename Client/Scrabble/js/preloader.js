
Scrabble.Preloader =
{
	preload: function(game)
	{
        game.stage.disableVisibilityChange = true;
        // this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        
		Global.isLoading = true;
		
		game.add.text(game.width/2,game.height/2,"Loading...",{fontSize:'12px'});
		game.stage.backgroundColor = 0x659CEF;
		
		
		
		game.load.image("bg","assets/bg_1080_600.jpg");
		game.load.image("grid_tile","assets/tile/grid_tile.png");
		game.load.image("grid_bg","assets/grid_bg.png");
		game.load.image("playerframe","assets/playerframe.png");
        game.load.image("playerframetimebar","assets/playerframetimebar.png");
		game.load.image("btnPlay","assets/btnPlay.png");
		game.load.image("btnOk","assets/btnOk.png");
		game.load.image("btnLeave","assets/btnLeave.png");
		game.load.image("btnSkip","assets/btnSkip.png");
		game.load.image("btnEnd","assets/btnEnd.png");
		game.load.image("btnCancel","assets/btnCancel.png");
		game.load.image("btnCreateGame","assets/btnCreateGame.png");
		game.load.image("icoChat","assets/icoChat.png");
		game.load.image("icoReturn","assets/icoReturn.png");
		game.load.image("icoRecycle","assets/icoRecycle.png");
		game.load.image("icoPuzzle","assets/icoPuzzle.png");
		game.load.image("textBar","assets/textbar.png");
		game.load.image("chatbubble","assets/chatbubble.png");
		game.load.image("scoreBoard","assets/lazyscoreboard.png");
        
		game.load.image("lobbygamecontainer","assets/lobbyboardcontainerbg.png");
		game.load.image("logowhite","assets/logowhite.png");
		game.load.image("lobbygamebar","assets/lobbygamebar.png");
		game.load.image("flaguk","assets/flaguk.png");
		
		game.load.image("lobbycreategamebg","assets/lobbycreategamebg.png");
		game.load.image("icoClose","assets/icoClose.png");
		game.load.image("btnPrivate","assets/btnprivate.png");
		game.load.image("btnPublic","assets/btnpublic.png");
		game.load.image("btn2Player","assets/btn2player.png");
		game.load.image("btn3Player","assets/btn3player.png");
		game.load.image("btn4Player","assets/btn4player.png");
		game.load.image("btn5Player","assets/btn5player.png");
		
		// Tiles
		var tileletters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		for(var i=0;i<tileletters.length;i++)
		{
			var letter = tileletters.charAt(i);
			game.load.image("tile_" + letter,"assets/tile/tile_" + letter.toLowerCase() + ".png");
		}
        game.load.image("tile_BLANK","assets/tile/tile_blank.png");
	},
	
	create: function(game)
	{
		Global.gameState = "Preloader";
		
		// dom events
		document.getElementById("btnLogin").onclick = function(){Network.Connect(Network.gameServer, Network.gamePort);};
		document.getElementById("txtChat").onkeydown = function(e){if (e.keyCode == 13) {UI.SendChat();}}
		// Create ui components.
		UI.create(game);
		
		// Load main menu.
		game.state.start("MainMenu");
		
		Global.isLoading = false;
	},
	
	update: function(game)
	{
		
	},
};