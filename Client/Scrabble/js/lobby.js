
var NewGame = 
{
    lastAutoJoin: '',
    isCreating: false,
    
	gameType: null,
	gameSize: null,
	
	TYPE_PUBLIC: 1,
	TYPE_PRIVATE: 2,
	
	SIZE_2: 3,
	SIZE_3: 4,
	SIZE_4: 5,
	SIZE_5: 6,
	
	Create:function()
	{
		if(NewGame.gameSize != null && NewGame.gameType !=null)
		{
			// Ask server to create game.
			PacketHandler.SendBoardCreate(this.gameType, this.gameSize-1);
			// Test code.
			Scrabble.Lobby.ToggleCreateGame();
		}
	}
}

Scrabble.Lobby = 
{
	
	gamesGroup: null,
	lastGameIndex: 0,
	joiningBoardProps: null, // Target board to join.
	
	// Lobby
	AddGame: function(id, name, language, maxPlayers, currentPlayers)
	{
		if(this.lastGameIndex > 10)
		{
			console.log("warning - game list is full");
			return;
		}
		
		var boardProps = {id: id, name: name, size: maxPlayers, language: language, currentsize: currentPlayers};
		//var playersNeeded = maxPlayers - currentPlayers;
		
		var gameBar = this.game.add.group();
		var sprBack = this.game.add.sprite(0,this.lastGameIndex*55,"lobbygamebar");
		//var sprFlag = this.game.add.image(8,(this.lastGameIndex*40)+8,"flaguk");
		var txtGameName = this.game.add.text(80,(this.lastGameIndex*55)+8,name,{fontSize:'17px',fontWeight:'bold'});
		var txtGameSize= this.game.add.text(80,(this.lastGameIndex*55)+28,maxPlayers + " Player ("+language+")",{fontSize:'14px',fontWeight:'normal'});
		var txtGameNeed = this.game.add.text(27,(this.lastGameIndex*55)+15,currentPlayers,{fontSize:'20px',fontWeight:'normal'});
		
		txtGameNeed.alpha=0.7;
		
		sprBack.inputEnabled = true;
		sprBack.input.useHandCursor = true;
		sprBack.events.onInputDown.add(function(){PacketHandler.SendBoardJoinRequest(id);},this);
		
        gameBar.x = 43;
        gameBar.y = 60;
        
		gameBar.add(sprBack);
		//gameBar.add(sprFlag);
		gameBar.add(txtGameName);
		gameBar.add(txtGameSize);
		gameBar.add(txtGameNeed);
		
        if(NewGame.isCreating)
            this.gamesGroup.visible = false;
        
		this.gamesGroup.add(gameBar);
		
		this.lastGameIndex++;
		
	},
	
	JoinBoard: function(boardProps)
	{
		this.joiningBoardProps = boardProps;
		var id = boardProps['id'];
		
		// Ask server to join
		
		// TEst Code:
		this.StartBoard();
	},
	
	StartBoard: function()
	{
		if(this.joiningBoardProps == null)
			return;
		
		// fetch board props from previous request.
		var boardProps = this.joiningBoardProps;
		var name = boardProps['name'];
		var size = boardProps['size'];
		var lang = boardProps['language'];
		var id = boardProps['id'];
        var isPublic = boardProps['isPublic'];
		
		Scrabble.Board.Reset();
		Scrabble.Board.playerCountNeeded = size;
		Scrabble.Board.boardName = name;
		Scrabble.Board.boardID = id;
		Scrabble.Board.boardLanguage = lang;
        Scrabble.Board.isPublic = isPublic;
		
		this.game.state.start("Board");

	},
    
	
	JoinFail: function(reason)
	{
		this.joiningBoardProps=null;
	},
	
	ToggleCreateGame: function()
	{
        
        
		if(this.createGameGroup.visible)
		{
			this.createGameGroup.visible = false;
			this.layoutGroup.visible =true;
			
			if(this.gamesGroup != null)
			{
				this.gamesGroup.visible = true;
			}
            
            NewGame.isCreating = false;
		}
		else
		{
			this.createGameGroup.visible =true;
			
			// Reset
			this.createGameGroup.btnPrivate.alpha = 0.3;
			this.createGameGroup.btnPublic.alpha = 0.3;
			this.createGameGroup.btn2Player.alpha = 0.3;
			this.createGameGroup.btn3Player.alpha = 0.3;
			this.createGameGroup.btn4Player.alpha = 0.3;
			this.createGameGroup.btn5Player.alpha = 0.3;
			this.createGameGroup.btnCreateBoard.visible = false;
			
			NewGame.gameType = null;
			NewGame.gameSize = null;
			
			this.layoutGroup.visible = false;
			
			if(this.gamesGroup != null)
			{
				this.gamesGroup.visible = false;
			}
            
            NewGame.isCreating = true;
		}
	},
	
	ToggleSetting: function(settingOption)
	{
		switch(settingOption)
		{
			case NewGame.TYPE_PUBLIC:
				this.createGameGroup.btnPublic.alpha = 1;
				this.createGameGroup.btnPrivate.alpha = 0.3;
				NewGame.gameType = settingOption;
			break;
			case NewGame.TYPE_PRIVATE:
				this.createGameGroup.btnPrivate.alpha = 1;
				this.createGameGroup.btnPublic.alpha = 0.3;
				NewGame.gameType = settingOption;
			break;
			case NewGame.SIZE_2:
				this.createGameGroup.btn2Player.alpha = 1;
				this.createGameGroup.btn3Player.alpha = 0.3;
				this.createGameGroup.btn4Player.alpha = 0.3;
				this.createGameGroup.btn5Player.alpha = 0.3;
				NewGame.gameSize = settingOption;
			break;
			case NewGame.SIZE_3:
				this.createGameGroup.btn2Player.alpha = 0.3;
				this.createGameGroup.btn3Player.alpha = 1;
				this.createGameGroup.btn4Player.alpha = 0.3;
				this.createGameGroup.btn5Player.alpha = 0.3;
				NewGame.gameSize = settingOption;
			break;
			case NewGame.SIZE_4:
				this.createGameGroup.btn2Player.alpha = 0.3;
				this.createGameGroup.btn3Player.alpha = 0.3;
				this.createGameGroup.btn4Player.alpha = 1;
				this.createGameGroup.btn5Player.alpha = 0.3;
				NewGame.gameSize = settingOption;
			break;
			case NewGame.SIZE_5:
				this.createGameGroup.btn2Player.alpha = 0.3;
				this.createGameGroup.btn3Player.alpha = 0.3;
				this.createGameGroup.btn4Player.alpha = 0.3;
				this.createGameGroup.btn5Player.alpha = 1;
				NewGame.gameSize = settingOption;
			break;
		}
		
		if(NewGame.gameSize != null && NewGame.gameType !=null)
		{
			this.createGameGroup.btnCreateBoard.visible = true;
		}
		
	},
	
	ClearGames: function()
	{
		
		if(this.gamesGroup != null)
		{
			this.gamesGroup.destroy(true);
			this.gamesGroup=null;
		}
		
		this.gamesGroup = this.game.add.group();
		this.gamesGroup.y = 110;
		this.gamesGroup.x = Layout.offsetX+50;
		this.lastGameIndex = 0;
		
	},
	
	// Core
	preload: function(game)
	{
		Global.isLoading = true;
	},
	
	create: function(game)
	{
		Global.gameState = "Lobby";
		
		game.add.image(0,0,"bg");
		this.layoutGroup = game.add.group();
		this.layoutGroup.x = Layout.offsetX;
		this.layoutGroup.y = 0;
		
		var logoWhite = game.add.image((game.width/2)-130,15,"logowhite");
		//this.layoutGroup.add(logoWhite);
		
		// list containing games.
		var gameContainer = game.add.image(65,100,"lobbygamecontainer");
		this.layoutGroup.add(gameContainer);
		
		// outer create game button
		var btnCreateGame = game.add.sprite(400-92,520,"btnCreateGame");
		btnCreateGame.inputEnabled = true;
		btnCreateGame.events.onInputDown.add(function(){this.ToggleCreateGame();},this);
		btnCreateGame.input.useHandCursor = true;
		this.layoutGroup.add(btnCreateGame);
		
		// Create game popup
		this.createGameGroup = game.add.group();
		this.createGameGroup.x = Layout.offsetX+65;
		this.createGameGroup.y = 100;
		var imgCreateGamebg = game.add.image(0,0,"lobbycreategamebg");
		var btnClose = game.add.sprite(570,0,"icoClose");
		btnClose.inputEnabled = true;
		btnClose.events.onInputDown.add(function(){this.ToggleCreateGame();},this);
		btnClose.input.useHandCursor = true;
		
		btnCreateBoard = game.add.sprite(243,420,"btnCreateGame");
		btnCreateBoard.inputEnabled = true;
		// TODO: ask server to create table.
		btnCreateBoard.events.onInputDown.add(function(){NewGame.Create();},this);
		btnCreateBoard.input.useHandCursor = true;

		var btnPrivate = game.add.sprite(380,140,"btnPrivate");
		var btnPublic = game.add.sprite(100,140,"btnPublic");
        
		var btn2Player = game.add.sprite(100,250,"btn2Player");
		var btn3Player = game.add.sprite(380,250,"btn3Player");
		var btn4Player = game.add.sprite(100,300,"btn4Player");
		var btn5Player = game.add.sprite(380,300,"btn5Player");
		
		btnPrivate.inputEnabled = true;
		btnPublic.inputEnabled = true;
		btn2Player.inputEnabled = true;
		btn3Player.inputEnabled = true;
		btn4Player.inputEnabled = true;
		btn5Player.inputEnabled = true;
		
		btnPrivate.input.useHandCursor = true;
		btnPublic.input.useHandCursor = true;
		btn2Player.input.useHandCursor = true;
		btn3Player.input.useHandCursor = true;
		btn4Player.input.useHandCursor = true;
		btn5Player.input.useHandCursor = true;
		
		btnPrivate.events.onInputDown.add(function(){this.ToggleSetting(NewGame.TYPE_PRIVATE);},this);
		btnPublic.events.onInputDown.add(function(){this.ToggleSetting(NewGame.TYPE_PUBLIC);},this);
		btn2Player.events.onInputDown.add(function(){this.ToggleSetting(NewGame.SIZE_2);},this);
		btn3Player.events.onInputDown.add(function(){this.ToggleSetting(NewGame.SIZE_3);},this);
		btn4Player.events.onInputDown.add(function(){this.ToggleSetting(NewGame.SIZE_4);},this);
		btn5Player.events.onInputDown.add(function(){this.ToggleSetting(NewGame.SIZE_5);},this);
		
		this.createGameGroup.add(imgCreateGamebg);
		this.createGameGroup.add(btnClose);
		this.createGameGroup.add(btnCreateBoard);
		this.createGameGroup.add(btnPrivate);
		this.createGameGroup.add(btnPublic);
		this.createGameGroup.add(btn2Player);
		this.createGameGroup.add(btn3Player);
		this.createGameGroup.add(btn4Player);
		this.createGameGroup.add(btn5Player);
		
		this.createGameGroup['btn2Player'] = btn2Player;
		this.createGameGroup['btn3Player'] = btn3Player;
		this.createGameGroup['btn4Player'] = btn4Player;
		this.createGameGroup['btn5Player'] = btn5Player;
		this.createGameGroup['btnPrivate'] = btnPrivate;
		this.createGameGroup['btnPublic'] = btnPublic;
		this.createGameGroup['btnCreateBoard'] = btnCreateBoard;
		
		this.createGameGroup.visible = false;
        NewGame.isCreating = false;

		// Object is ready;
		Global.isLoading = false;
        
        // Ask server for table list or auto-join private
        if(window.location.hash)
        {
            var hash = window.location.hash.substring(1);
            if(hash != Global.lastAutoJoin)
            {
                Global.lastAutoJoin = hash;
                PacketHandler.SendBoardJoinRequest(hash);
                return;
            }
            
        }

         PacketHandler.SendGameListRequest();
	},
	
	update: function(game)
	{
		// Update network packets
		Network._processPackets();
	}
};