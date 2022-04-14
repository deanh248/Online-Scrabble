function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

var ButtonFunction = 
{
	largePlay: 0,
	largeOk: 1,
	largeEnd: 2,
	smallSkip: 3,
	smallCancel: 4,
	smallLeave:  5,
	largeHide: 6,
	smallHide: 7,
};

Scrabble.Board = 
{
	
	tilePool: [],
	grid: [[]],
	handTiles: [],
	lstPlayerGroup: [],
	selectedTile: null,

	// Tile drag offsets
	dragOffsetX: 36/2,
	dragOffsetY: 36/2,
	// Sticky drag.
	canMouseDownDropTile: true,
	lastMouseDownX: 0,
	lastMouseDownY: 0,
	
	// Button
	largeButtonFunction: null,
	smallButtonFunction: null,
	
	// Game Stuff -->
	canPlay: false,
	playerCount: 0,
	playerCountNeeded: 5,
	currentPlayerName: null,
	chatTimer: null,
	hasStarted: false,
	boardName: null, // long game name
	boardID: null,
	boardLanguage: null,
	
	Reset: function()
	{
		// Resets this class
		this.tilePool = [];
		this.grid = [[]];
		this.handTiles = [];
		this.lstPlayerGroup = [];
		this.selectedTile = null;
		this.layoutGroup = null;

		// Game Stuff -->
		this.canPlay = false;
		this.playerCount = 0;
		this.playerCountNeeded = 5;
		this.currentPlayerName = null;
		this.hasStarted = false;
		this.boardName = ''; // long game name
		this.boardID = '';
		this.boardLanguage = '';
		this.boardGroup = null;
        this.isShowingScore = false;
		
	},
	
	LeaveBoard: function()
	{
		PacketHandler.SendGameLeaveRequest();
		this.game.state.start("Lobby");
	},
	
	TurnStart: function()
	{
		this.canPlay = true;
		
		this.UpdateButtonFunction(ButtonFunction.largePlay);
		this.UpdateButtonFunction(ButtonFunction.smallSkip);
		
	},
	
	TurnEnd: function()
	{
		
		this.canPlay=false;
		this.UpdateButtonFunction(ButtonFunction.largeHide);
		this.UpdateButtonFunction(ButtonFunction.smallHide);
		
		// lock tils
        this.LockBoardTiles();
		
		// Clear drag tile
		this.selectedTile = null;
		
		// Update
		this.RefreshHandTiles();
		
		
	},
	
	TurnSkip: function()
	{
        // Ask server to skip turn
		this.AddUnlockedTilesToHand();
		this.RefreshHandTiles();
		this.selectedTile = null;
        
        PacketHandler.SendPlayerSkipTurn();
	},
    
    // Last thing ever seen, 
    ShowScoreboard: function(scores)
    {
       this.isShowingScore = true;
       this.layoutGroup.visible = false;
       this.boardGroup.visible = false;    
       this.scoreBoard.visible = true;
       
       for(var i =0;i<scores.length;i++)
       {
            var score = scores[i].score;
            var name = scores[i].name;
            
            this.scoreBoard.txtNames[i].text = name;
            this.scoreBoard.txtScores[i].text = score;
       }   
    },
	
	// Enough players have joined to start.
	GameStart: function()
	{
		this.hasStarted = true;
		
		this.UpdateButtonFunction(ButtonFunction.largeHide);
		this.UpdateButtonFunction(ButtonFunction.smallHide);
		
		// Show Grid panel
		this.boardGroup.alpha = 0;
		this.boardGroup.visible = true;
		this.txtBoardStatus.visible = false;
		
		
		
		// Fade in
		this.game.add.tween(this.boardGroup).to({alpha: 1}, 500,"Power0").start();
	},
	
	// Replaces player list with a new one.
	AddPlayers: function(playerList)
	{
		var pCount = 0;
		for(var i=0;i<this.lstPlayerGroup.length;i++)
		{
			if(i<this.playerCountNeeded && !this.hasStarted)
			{
				this.lstPlayerGroup[i].visible = true;
				this.lstPlayerGroup[i].alpha = 0.3;
				this.lstPlayerGroup[i].map.txtName.text  = "";
				this.lstPlayerGroup[i].map.txtScore.text = "Waiting for player...";
			}
			else
			{
				this.lstPlayerGroup[i].visible = false;
				this.lstPlayerGroup[i].map.txtName.text  = "";
				this.lstPlayerGroup[i].map.txtScore.text = "";
			}
		}
		
		for(var i=0;i<playerList.length;i++)
		{
			var group = this.lstPlayerGroup[i];
			group.alpha=1;
			group.map.txtName.text = playerList[i].name;
			group.map.txtScore.text = playerList[i].score + " Points";
			group.visible = true;
            group.map.sprTimeBar.visible = false;
			
			pCount++;
		}

		this.playerCount = pCount;
		this.SetCurrentPlayer(null);
	},
	
	SetPlayerScore: function(player, score)
	{
		
	},
	
	SetCurrentPlayer: function(playerName)
	{
		this.currentPlayerName = playerName;
		
		for(var i=0;i<this.lstPlayerGroup.length;i++)
		{
            var sprBar = this.lstPlayerGroup[i].map.sprTimeBar;
            
			this.lstPlayerGroup[i].map.sprFrame.alpha=0.6;
            sprBar.visible = false;
			//this.lstPlayerGroup[i].map.chatBubble.alpha = 1; // Precents chat bubble child from fading on an inactive frame.
			
			if(playerName!=null)
			{
				if(this.lstPlayerGroup[i].map.txtName.text == playerName)
				{
					this.lstPlayerGroup[i].map.sprFrame.alpha=1;
					this.lstPlayerGroup[i].visible = true;
                    
                    sprBar.visible = true;
                    sprBar.scale.x = 1;
                    
                    if(!typeof(this.sprBarTween) == "undefined")
                    {
                        this.game.tween.remove(this.sprBarTween)
                    }
                    
                    this.sprBarTween = this.game.add.tween(sprBar.scale).to({x:0},60000).start();
				}
			}
		}
	},
	
	ShowChatBubble: function(playerName, msg)
	{
		for(var i=0;i<this.lstPlayerGroup.length;i++)
		{
			if(this.lstPlayerGroup[i].map.txtName.text == playerName)
			{
				this.lstPlayerGroup[i].map.txtChat.text = msg;
				var chatBubbleGroup = this.lstPlayerGroup[i].map.chatBubble;
				chatBubbleGroup.y = 10;
				chatBubbleGroup.x = -230;
				chatBubbleGroup.alpha = 1;
				chatBubbleGroup.visible = true;
				//this.lstPlayerGroup[i].map.sprBubble.alpha = 0.2;
				
				if(this.chatTimer != null)
				{
					this.game.time.events.remove(this.chatTimer);
				}
				
				this.chatTimer = this.game.time.events.add(Phaser.Timer.SECOND * 5, function(){Scrabble.Board.HideChatBubble();}, this);
				
			}
		}
	},
	
	HideChatBubble: function(bubble)
	{
		//console.log(bubble);
		
		if(typeof(bubble) == 'undefined')
		{
			//bubble.visible = false;
			// Hide all
			for(var i=0;i<this.lstPlayerGroup.length;i++)
			{
				this.lstPlayerGroup[i].map.chatBubble.visible = false
			}
		}
		else
		{
			bubble.visible = false;
		}
		
	},
	
	// Buttons
	// Changes the functionality of the big/small button.
	UpdateButtonFunction: function(buttonFunction)
	{
		switch(buttonFunction)
		{
			case ButtonFunction.largeEnd:
			{
				this.btnLarge.visible = true;
				this.btnLarge.loadTexture("btnEnd");
				this.largeButtonFunction = buttonFunction;
			}
			break;
			case ButtonFunction.largePlay:
			{
				this.btnLarge.visible = true;
				this.btnLarge.loadTexture("btnPlay");
				this.largeButtonFunction = buttonFunction;
			}
			break;
			case ButtonFunction.smallCancel:
			{
				this.btnSmall.visible = true;
				this.btnSmall.loadTexture("btnCancel");
				this.smallButtonFunction = buttonFunction;
			}
			break;
			case ButtonFunction.smallSkip:
			{
				this.btnSmall.visible = true;
				this.btnSmall.loadTexture("btnSkip");
				this.smallButtonFunction = buttonFunction;
			}
			break;
			case ButtonFunction.smallLeave:
			{
				this.btnSmall.visible = true;
				this.btnSmall.loadTexture("btnLeave");
				this.smallButtonFunction = buttonFunction;
			}
			break;
			case ButtonFunction.smallHide:
			{
				this.btnSmall.visible = false;
				this.smallButtonFunction = buttonFunction;
			}
			break;
			case ButtonFunction.largeHide:
			{
				this.btnLarge.visible = false;
				this.largeButtonFunction = buttonFunction;
			}
			break;
		}
	},
	
	OnBtnLargeDown: function(e)
	{
        
		if(!this.canPlay)
        {
            console.log("cannot play");
            return;
        }
        
        
		switch(this.largeButtonFunction)
		{
			case ButtonFunction.largeEnd:
			{
				this.canPlay = false;
			}
			break;
			case ButtonFunction.largePlay:
			{
                this.canPlay = false;
                
				var playedTiles = this.GetUnlockedTiles();
                var idlist = []
                for(var i=0;i<playedTiles.length;i++)
                {
                    idlist.push(playedTiles[i]);
                }
                PacketHandler.SendPlayerPlayTilesRequest(idlist);
			}
			break;
		}
		
		// Test code.
        /*
		var playedTiles = this.GetUnlockedTiles();
		var tileString = "";
		for(var i=0;i<playedTiles.length;i++)
		{
			var tile = playedTiles[i];
			
			tileString += "[ID: "+tile.tileID+", \""+tile.tileLetter+"\", ("+tile.tileGridX+", " + tile.tileGridY+")]";
		}
		UI.ShowMessageBar("PLAYED: " + tileString);
		this.LockBoardTiles();
		this.SetCurrentPlayer("Yuri");
        */
		//this.TurnEnd();
	},
	
	// Small Button is 'Skip' or 'Cancel' when switching tiles (?)
	OnBtnSmallDown: function(e)
	{
		switch(this.smallButtonFunction)
		{
			case ButtonFunction.smallCancel:
			{
				// Nt sure.
			}
			break;
			case ButtonFunction.smallSkip:
			{
                this.canPlay = false;
				this.TurnSkip();
			}
			break;
			case ButtonFunction.smallLeave: // Leave the board game, back to lobby.
			{
				this.LeaveBoard();
			}
			break;
		}
	},
	
	
	// l l l
	// o o object
	// Board Stuff -->
	// When a tile is clicked on i.e being dragged, select it.
	SelectTile: function(tile)
	{
		if(this.selectedTile == null)
		{
			if(!this.canPlay)
			{
				return;
			}
			
			if(tile.tileLocked)
			{
				return;
			}
			
			this.lastMouseDownX = this.game.input.x;
			this.lastMouseDownY = this.game.input.y;
			this.canMouseDownDropTile=false;
			
			// If tile is on the board, place it back into your hand.
			if(tile.tileLocation == TileLocation.Board)
			{
				this.AddTileToHandFromBoard(tile.tileGridX,tile.tileGridY);
			}
			
			// selectedTile is the one being dragged.
			this.selectedTile = tile;
			this.selectedTile.bringToTop();
			
			// For accurate drag - test
			// this.dragOffsetX = this.game.input.x - tile.world.x;
			// this.dragOffsetY = this.game.input.y - tile.world.y;
		}
		else
		{
			console.log("A tile is already selected");
		}
	},
	
	// Mouse
	MouseDown: function(e)
	{
		UI.HideMessageBar();
        
        if(this.isShowingScore)
            this.game.state.start("Lobby");
        
	},
	
	// Mouse/touch released event.
	MouseUp: function(e)
	{
		
        if(!this.canPlay)
        {
            this.selectedTile = null;
            this.RefreshHandTiles();
            return;
        }
        
		if(this.selectedTile == null)
			return;

		var x = this.game.input.x;
		var y = this.game.input.y;
		
		if(this.lastMouseDownX != x || this.lastMouseDownY != y)
		{
			this.canMouseDownDropTile=true;
		}
		
		if(!this.canMouseDownDropTile)
		{
			this.canMouseDownDropTile=true;
			return;
		}
		
		
		var gridpos = this.PixelToGrid(x,y);
		
		if((gridpos.x > -1 && gridpos.x <15)&&(gridpos.y > -1 && gridpos.y < 15))
		{
			//console.log("M: " + x + ":" + y);
			console.log("Grid " + gridpos.x + ":" + gridpos.y);
			
			this.AddTileToBoardFromHand(this.selectedTile,gridpos.x,gridpos.y,false);
			this.selectedTile = null;
		}
		else
		{
			console.log("Tile was not dropped on grid range");
		}
		
		this.DeselectTile();
		
	},
	
	// Convert an x/y coordinate (from mouse) into grid index.
	PixelToGrid: function(x,y)
	{
		var gridStartX = this.layoutGroup.x;
		var gridStartY = this.layoutGroup.y;
		var tileSpacing = 1;
		var tileHeight = 36;
		var tileWidth = 36;
		var gridWidth = 15;
		var gridHeight = 15;
		
		// Convert
		x -= gridStartX;
		y -= gridStartY;
		
		var gridX = Math.floor(x/(tileWidth+tileSpacing));
		var gridY = Math.floor(y/(tileWidth+tileSpacing));
		
		
		return {x:gridX,y:gridY};
	},

	// Drag done, clear selection.
	DeselectTile: function()
	{
		this.selectedTile = null;
		this.RefreshHandTiles();
	},
	
	// Reposition hand tiles after an update.
	RefreshHandTiles: function(doAnimation)
	{
		
		if(typeof(doAnimation) == 'undefined')
			doAnimation = true;
		
		// Reposition hand tiles
		var handOffsetY = 559;
		var handOffsetX = 145;
		var tileSpacing = 2;
		
		for(var i=0;i<this.handTiles.length;i++)
		{
			//Ignore tile being dragged.
			//if(this.selectedTile == this.handTiles[i])
			//continue;
			
			
		
			//this.handTiles[i].x = (i*(36+tileSpacing))+handOffsetX;
			//this.handTiles[i].y = handOffsetY;
			
			this.handTiles[i].visible = true;
			this.handTiles[i].tileLocation = TileLocation.Hand;
			this.handTiles[i].tileLocked = false;
			this.handTiles[i].alpha = 1;
			this.handTiles[i].input.useHandCursor = true;
			
			if(doAnimation)
			{
				this.game.add.tween(this.handTiles[i]).to({x:(i*(36+tileSpacing))+handOffsetX,y:handOffsetY}, 200,"Power0").start();
			}
			else
			{
				this.handTiles[i].x = (i*(36+tileSpacing))+handOffsetX;
				this.handTiles[i].y = handOffsetY;
			}
			
		}
	},
	
	// Visual mostly. Locked tiles are faded slightly to see the board multipliers.
	RefreshBoardTiles: function()
	{
		for(var i=0;i<15;i++)
		{
			for(var k=0;k<15;k++)
			{
				var tile = this.grid[i][k].tile;
				if(tile !=null)
				{
					// Reduce opacity
					tile.alpha=0.8;
					
					// not needed - fallbacks.
					tile.visible = true;
					tile.tileLocation = TileLocation.Board;
				}
			}
		}
	},
	
	SwitchHandTile: function()
	{
		//UI.ShowMessageBar("Choose a tile from your hand to switch");
        
        // Just swap all tiles
        this.AddUnlockedTilesToHand();
		PacketHandler.SendPlayerSwapTileRequest(this.handTiles);
        
        /*
        for(var i=0;i<this.handTiles.length;i++)
        {
            this.AddTileToBag(this.handTiles[i]);
        }
        
        this.handTiles = [];
        */
        
	},
	
	// Rearrange the array order randomly
	ShuffleHandTiles: function()
	{
		this.handTiles = shuffle(this.handTiles);
		this.RefreshHandTiles();
	},
	
    // Move tiles to bad
    AddTileToBag(tile, animate)
    {
        if(typeof(animate) == "undefined")
            animate = true;

        // Normal add tile to board code.
        tile.tileLocation = TileLocation.Bag;
        tile.tileGridX = -1;	// For board usage
        tile.tileGridY = -1;
        tile.tileLocked = false;
        tile.alpha=1; // Locked tiles appear faded.
        
        if(animate)
        {
            var anim = this.game.add.tween(tile).to({x:10,y:560}, 200,"Power0").start();
            anim.onComplete.add(function(){tile.visible = false}, tile);
        }
        else
        {
            tile.x = 10;
            tile.y = 560;
            tile.visible = false;
        }
    },
    
	// Move from player frame to board. (When someone plays)
	AddTilesFromPlayerToBoard(playerName,tiles)
	{
		// Locate player frame
		var playerFound = false;
		var playerX = 0;
		var playerY = 0;
		
		for(var i=0;i<this.lstPlayerGroup.length;i++)
		{
			var group = this.lstPlayerGroup[i];
			
			if(group.map.txtName.text == playerName)
			{
				playerFound=true;
				playerX = group.x+10;
				playerY = group.y+10;
			}
		}
		
		for(var i=0;i<tiles.length;i++)
		{
			var tile = tiles[i].tile;
			var x = tiles[i].x;
			var y = tiles[i].y;
			
			if(playerFound)
			{
				if(this.grid[x][y].tile != null)
				{
					console.log("Warning - Client board may be out of sync.");
					continue;
				}
				
				// Animated add
				// Set tile position to player frame.
				tile.x = playerX;
				tile.y = playerY;
				// Normal add tile to board code.
				tile.tileLocation = TileLocation.Board;
				tile.tileGridX = x;	// For board usage
				tile.tileGridY = y;
				tile.tileLocked = true;
				tile.alpha=0.8; // Locked tiles appear faded.
				this.grid[x][y].tile = tile;
				
				// Set visible.
				tile.visible = true;
				
				// Move tile to its assigned grid position.
				this.game.add.tween(tile).to({x:this.grid[x][y].x,y:this.grid[x][y].y}, 200,"Power0").start();
				
			}
			else
			{
				console.log("Warning - Player not found for AddTile()");
				// no animation - just add.
				AddTileToBoard(tile,gridX,gridY,true);
			}
		}
	},
	
	// Remove tile from Board to hand.
	AddTileToHandFromBoard: function(x,y)
	{
		if(this.grid[x][y].tile == null)
		{
			console.log("Cannot remove null tile from board.");
			return;
		}
		
		// TODO: Check for orphan tiles or do it server side, might be costly.
		
		var tile = this.grid[x][y].tile;
		this.grid[x][y].tile = null;
		this.AddTileToHand(tile);
	},
    
    GetTile: function(id)
    {
        return this.tilePool[id];
    },
	
	AddTileToHand: function(tile,refreshhand)
	{
		
		if(typeof(refreshhand) == 'undefined')
			refreshhand = false;
		
		// not needed - fallbacks.
		tile.visible=true; // tile from pool is invisible.
		tile.tileGridX = -1; // tile is no longer on a grid. reset these.
		tile.tileGridY = -1;
		tile.tileLocked = false;
		tile.input.useHandCursor = true;
		
		this.handTiles.push(tile);
		
		if(refreshhand)
			this.RefreshHandTiles();
	},
	
	AddTileToBoardFromHand: function(tile,x,y)
	{
		// Check if free.
		if(this.grid[x][y].tile != null)
		{
			//UI.ShowMessageBar("That square is not free");
			console.log("Cannot add tile to board - space not free.");
			return;
		}
		
		// Check if valid.
		var isFirstTile = true;
		loop1:
		for(var i=0;i<15;i++)
		{
			for(var k=0;k<15;k++)
			{
				var grid = this.grid[i][k];
				if(grid.tile != null)
				{
					isFirstTile = false;
					break loop1;
				}
			}
		}
		// Check for surrounding tiles
		var hasNeighbour = false;
		if(!isFirstTile)
		{
			/*
			if(x>0 && this.grid[x-1][y].tile != null)
			{
				hasNeighbour=true;
			}
			else if(x<14 && this.grid[x+1][y].tile != null)
			{
				hasNeighbour=true;
			}
			else if(y>0 && this.grid[x][y-1].tile != null)
			{
				hasNeighbour=true;
			}
			else if(y<14 && this.grid[x][y+1].tile != null)
			{
				hasNeighbour=true;
			}
			
			if(!hasNeighbour)
			{
				//console.log("Tile cannot be added on its own.");
				UI.ShowMessageBar("Tiles must be added near existing letters.");
				return;
			}
			*/
		}
		else
		{
			// First tile.
			// Adjust coordinate to center;
			x=7;
			y=7;
		}
		
		// Remove from hand.
		var index = this.handTiles.indexOf(tile);
		if(index > -1)
		{
			this.handTiles.splice(index, 1);
			
			//tile.tileLocked = true;
			tile.tileLocation = TileLocation.Board;
			tile.tileGridX = x;	// For board usage
			tile.tileGridY = y;
			tile.x = this.grid[x][y].x;
			tile.y = this.grid[x][y].y;
			this.grid[x][y].tile = tile;
			
			console.log("Tile added to board.");
		}
		else
		{
			console.log("Hand does not have tile to remove");
		}
		
	},
	
	AddTileToBoard: function(tile,x,y,lock)
	{
		tile.visible=true; // tile from pool is invisible.
		
		if(typeof(lock) == 'undefined')
		{
			lock = false;
		}
		
		if(this.grid[x][y].tile != null)
		{
			//console.log("Cannot add tile to board - space not free.");
			// At this point, force client to re-sync board and hand too. The server doesn't have the same one as you.
			return;
		}

		tile.tileLocation = TileLocation.Board;
		tile.tileGridX = x;	// For board usage
		tile.tileGridY = y;
		tile.x = this.grid[x][y].x;
		tile.y = this.grid[x][y].y;
		this.grid[x][y].tile = tile;
		
		if(lock)
		{
			tile.tileLocked = true;
			// Too costly. do visual update here.
			//this.RefreshBoardTiles();
			{
					// Reduce opacity
					tile.input.useHandCursor = false;
					tile.alpha=0.8;
			}
		}
	},
	
	// Moves all recently placed tiles to your hand.
	AddUnlockedTilesToHand: function()
	{
		for(var i=0;i<15;i++)
		{
			for(var k=0;k<15;k++)
			{
				var tile = this.grid[i][k].tile;
				if(tile !=null)
				{
					if(!tile.tileLocked)
					{
						this.AddTileToHandFromBoard(tile.tileGridX,tile.tileGridY);
					}
				}
			}
		}
		
		this.RefreshHandTiles();
	},
	
	// Lock board tiles which hasn't been yet.
	LockBoardTiles: function()
	{
		
		for(var i=0;i<15;i++)
		{
			for(var k=0;k<15;k++)
			{
				var tile = this.grid[i][k].tile;
				if(tile!=null)
				{
					tile.tileLocked = true;
					tile.input.useHandCursor = false;
				}
			}
		}
		
		this.RefreshBoardTiles();
	},
	
	// Newly added tiles by the user are unlocked. so this picks them up.
	GetUnlockedTiles: function()
	{
		var tiles = [];
		
		for(var i=0;i<15;i++)
		{
			for(var k=0;k<15;k++)
			{
				var grid = this.grid[i][k];
				if(grid.tile != null)
				{
					if(grid.tile.tileLocked == false)
					{
						tiles.push(grid.tile);
					}
				}
			}
		}
		
		console.log("[LOG] Unlocked Board Tiles: " + tiles.length);
		
		return tiles;
	},
	
	// phaser
	preload: function(game)
	{
		Global.isLoading = true;
	},
	
	create: function(game)
	{
		Global.gameState = "Board";
		
		// Holds board related objects.
		this.boardGroup = game.add.group();
		
		game.add.image(0,0,"bg");
		
		// Build Tile Grid
		// grid[x][y] is the phaser sprite.
		// grid[x][y].tile is Tile object or null if empty.
		
		var gridbg = game.add.image(-2,-1,"grid_bg");
		//gridbg.alpha=0.7;
		this.layoutGroup = game.add.group();
		this.layoutGroup.x = Layout.offsetX;
		this.layoutGroup.y = 2;
		
		this.boardGroup.add(gridbg);
		
		for(var i=0;i<15;i++)
		{
			this.grid[i] = [];
			for(var j=0;j<15;j++)
			{
				this.grid[i][j] = game.add.image((i*37),(j*37),"grid_tile");
				//this.grid[i][j] = new Object();
				this.grid[i][j].tile = null;
				this.grid[i][j].alpha = 0.1;
				this.boardGroup.add(this.grid[i][j]);
			}
		}
		
		// Build tile pool
		tileLetter = [
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
        ];
        
		for(var i=0;i<tileLetter.length;i++)
		{
				this.tilePool[i]=game.add.sprite(0,0,"tile_"+tileLetter[i]);
				this.tilePool[i].visible = false;							// phaser sprite visibility
				this.tilePool[i].tileID = i;									// Tile ID
				this.tilePool[i].tileLetter = tileLetter[i];				// char
				this.tilePool[i].tileLocation = TileLocation.Bag;	// Bag/Board/Hand
				this.tilePool[i].tileLocked = true;						// Can be moved?
				this.tilePool[i].tileGridX = -1;	// For board usage
				this.tilePool[i].tileGridY = -1;
                this.tilePool[i].x = 10;
                this.tilePool[i].y = 560;
				
				this.tilePool[i].inputEnabled = true;
				this.tilePool[i].events.onInputDown.add(Scrabble.Board.SelectTile,this);
				
				this.boardGroup.add(this.tilePool[i]);
		}
		
		//game.input.enabled = true;
		game.input.onUp.add(Scrabble.Board.MouseUp,this);
		game.input.onDown.add(Scrabble.Board.MouseDown,this);
		
        var keyEnter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
		keyEnter.onDown.add(UI.ToggleChat);
		
		// Add Title Frame
		this.txtGameTitle = game.add.text(675,15,this.boardName + " ("+this.boardLanguage+")",{fontSize:18,fontWeight:'normal',fill:'#fff',font:'Roboto'});
		this.txtGameTitle.anchor.x = 0.5;
		this.layoutGroup.add(this.txtGameTitle);
		
		// Waiting for player text
		this.txtBoardStatus = game.add.text(250,250,"Need "+this.playerCountNeeded+" players to start.",{fontSize:18,fontWeight:'normal',fill:'#fff',font:'Roboto'});
		this.txtBoardStatus.anchor.x = 0.5;
		this.layoutGroup.add(this.txtBoardStatus);
		
		// Add Buttons
		this.btnLarge = game.add.sprite(560,445,"btnPlay");
		this.btnSmall = game.add.sprite(560,510,"btnSkip");
		this.layoutGroup.add(this.btnLarge);
		this.layoutGroup.add(this.btnSmall);
		
		this.btnLarge.inputEnabled = true;
		this.btnLarge.events.onInputDown.add(Scrabble.Board.OnBtnLargeDown,this);
		this.btnLarge.input.useHandCursor = true;
		
		this.btnSmall.inputEnabled = true;
		this.btnSmall.events.onInputDown.add(Scrabble.Board.OnBtnSmallDown,this);
		this.btnSmall.input.useHandCursor = true;
		
		this.UpdateButtonFunction(ButtonFunction.largeHide);
		this.UpdateButtonFunction(ButtonFunction.smallLeave);
		
		// Add Icons
		this.icoChat = game.add.sprite(640,385,"icoChat");
		this.icoChat.inputEnabled = true;
		this.icoChat.input.useHandCursor = true;
		this.icoChat.events.onInputDown.add(UI.ToggleChat, this);
		this.layoutGroup.add(this.icoChat);
		
		this.icoRecycle = game.add.sprite(0,562,"icoRecycle");
		this.icoRecycle.inputEnabled = true;
		this.icoRecycle.input.useHandCursor = true;
		this.icoRecycle.events.onInputDown.add(Scrabble.Board.SwitchHandTile,this);
		this.boardGroup.add(this.icoRecycle);
		
		this.icoPuzzle = game.add.sprite(510,562,"icoPuzzle");
		this.icoPuzzle.inputEnabled = true;
		this.icoPuzzle.input.useHandCursor = true;
		this.icoPuzzle.events.onInputDown.add(Scrabble.Board.ShuffleHandTiles,this);
		this.boardGroup.add(this.icoPuzzle);
		
		// board group is the left side of the interface board components.
		this.layoutGroup.add(this.boardGroup);
        
		// Add Player frames
		for(var i=0;i<5;i++)
		{
			var playerGroup = game.add.group();
			var sprFrame = game.add.sprite(0,0,"playerframe");
            var sprTimeBar = game.add.sprite(0,59,"playerframetimebar");
			var txtName = game.add.text(20,10,"SomeUser",{fontSize:24,fontWeight:'bold',fill:'#000',font:'Roboto'}); // Ebrima (nice font)
			var txtScore = game.add.text(20,35,"1200 Points (Last Word)",{fontSize:15,fontWeight:'normal',fill:'#000',font:'Roboto'});
            
			// Chat bubbles
			var chatBubble = game.add.group();
			chatBubble.y = 10;
			chatBubble.x = -230;
			var sprBubble = game.add.sprite(0,0,"chatbubble");
			sprBubble.alpha = 0.8;
			var txtChat = game.add.text(sprBubble.width/2,15,"",{fontSize:'14px', fontWeight:'normal'});
			txtChat.anchor.x = 0.5;
			chatBubble.add(sprBubble);
			chatBubble.add(txtChat);
			chatBubble.visible = false;
			
			// Move chat out of grid if mouse is over
			sprBubble.inputEnabled = true;
			sprBubble.events.onInputOver.add(function(){if(!Scrabble.Board.hasStarted)return;this.game.add.tween(this).to({alpha:0.5}, 200,"Power0").start();},chatBubble);
			sprBubble.events.onInputDown.add(function(){Scrabble.Board.HideChatBubble(this);},chatBubble);
			sprBubble.input.useHandCursor = true;
			
			playerGroup.add(sprFrame);
            playerGroup.add(sprTimeBar);
			playerGroup.add(txtName);
			playerGroup.add(txtScore);
			playerGroup.add(chatBubble);
			
			sprFrame.alpha=0.8;
			playerGroup.map = {sprTimeBar:sprTimeBar,sprFrame: sprFrame,txtName:txtName,txtScore:txtScore,chatBubble: chatBubble, txtChat: txtChat, sprBubble: sprBubble};
			playerGroup.x = 560;
			playerGroup.y = (i*65)+50;
			playerGroup.visible = false;
			this.layoutGroup.add(playerGroup);
			
			this.lstPlayerGroup.push(playerGroup); 
		}
        
        // lazy SCOREBOARD - needs work
        this.scoreBoard = game.add.group();
        this.scoreBoard.x = Layout.offsetX + 100;
        this.scoreBoard.y = 30;
        var sprBoard = game.add.sprite(0,0,"scoreBoard");
        this.scoreBoard.add(sprBoard);
        var txtNames = [];
        var txtScores = [];
        
        for(var i=0;i<5;i++)
        {
            var txt1 = game.add.text(30,85+(80*i),"",{'fontWeight':'normal'});
            var txt2 = game.add.text(500,85+(80*i),"",{'fontWeight':'normal'});
            txtNames.push(txt1);
            txtScores.push(txt2);
            this.scoreBoard.add(txt1);
            this.scoreBoard.add(txt2);
        }
        this.scoreBoard.txtNames = txtNames;
        this.scoreBoard.txtScores = txtScores;
        this.scoreBoard.visible=false;
        // this.layoutGroup.add(this.scoreBoard);
		
		// Hide board and show "waiting for player" until GameStart() is called.
		this.boardGroup.visible = false;
		this.txtBoardStatus.visible = true;
		
		// ----------
		// Tests
		// TEST CODE ---->
        /*
		var playerList = [{name:Global.myUsername,score:"0"},{name:"Yuri",score:"0"}];
		this.AddPlayers(playerList);
		this.SetCurrentPlayer(null);
		
		this.AddTileToHand(this.tilePool[0]);
		this.AddTileToHand(this.tilePool[1]);
		this.AddTileToHand(this.tilePool[15]);
		this.AddTileToHand(this.tilePool[16]);
		this.AddTileToHand(this.tilePool[17]);
		this.AddTileToHand(this.tilePool[18]);
		this.AddTileToHand(this.tilePool[19]);
		this.RefreshHandTiles(false);
		
		//this.ShowChatBubble("Yuri","Hello World! Helloooo world 1234");
		
		//this.AddTileToBoard(this.tilePool[2],7,7,true);
		//this.AddTileToBoard(this.tilePool[3],8,7,true);
		//this.AddTileToBoard(this.tilePool[4],9,7,true);
		//this.AddTileToBoard(this.tilePool[5],10,7,true);
		//this.AddTileToBoard(this.tilePool[6],11,7,true);
		
		if(this.boardID == "test2")
		{
			Scrabble.Board.GameStart();
			Scrabble.Board.TurnEnd();
	
			window.setTimeout(function(){
				Scrabble.Board.TurnStart();Scrabble.Board.SetCurrentPlayer(Global.myUsername);Scrabble.Board.AddTilesFromPlayerToBoard("Yuri",[{tile:Scrabble.Board.tilePool[2],x:7,y:7},{tile:Scrabble.Board.tilePool[3],x:8,y:7},{tile:Scrabble.Board.tilePool[4],x:9,y:7}]);
			},500);
		}
        */
		
		// TEST DONE ---->
		
        // Prompt join url
        
        if(!this.isPublic)
        {
            //window.prompt("Private Game\n\nCopy this link (CTRL+C) for your friends to join:\n", "http://localhost/scrabble/#join_"+this.boardID);
            UI.ShowPrompt("<b>Private Game</b><br/><br/>Use the link below to invite your friends", "http://localhost/scrabble/#"+this.boardID);
        }
        
		Global.isLoading = false;
       
	},
	
	update: function(game)
	{
        // Update network packets
		Network._processPackets();
        
		if(this.selectedTile != null)
		{
			var mouseX = game.input.x;
			var mouseY = game.input.y;

			this.selectedTile.x = mouseX-this.layoutGroup.x-this.dragOffsetX;
			this.selectedTile.y = mouseY-this.layoutGroup.y-this.dragOffsetY;
		}
	}
};