Scrabble = function(){};

Global =
{
	// During the 'loading' phases of a stage, it would be unwise to access its objects
	isLoading: false,
	myUsername: '',
	
};

// aka login
Scrabble.MainMenu =
{
    Reset: function()
    {
        this.HideInfo();
        this.HideError();
		this.ShowLogin();
    },
    
    // Connection is ready, do login.
	Login: function()
	{
		var user = document.getElementById("txtName").value;
		// var pass = document.getElementById("txtPass");
		
		if(user.indexOf(" ") > -1)
		{
			this.ShowError("Your name cannot contain spaces");
            Network.Disconnect();
			return;
		}
		
		if(user.length <= 1)
		{
			this.ShowError("Your name has to be at least 2 characters long.");
            Network.Disconnect();
			return;
		}
        
        if(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(user))
        {
			this.ShowError("Your name cannot contain special characters.");
            Network.Disconnect();
			return;
        }
		
		this.HideError();
		
		
        PacketHandler.SendAuthReply(user,"");
	},
    
	LoginSuccess: function(user)
	{
		this.HideLogin();

		Global.myUsername = user;
		
		this.game.state.start("Lobby");
		
	},
	
	ShowError: function(msg)
	{
        this.HideInfo();
		var el = document.getElementById("txtErrorMessage");
		el.innerHTML = msg;
		el.style.display = "block";
	},
	
	HideError: function()
	{
		var el = document.getElementById("txtErrorMessage");
		el.innerHTML = "";
		el.style.display = "none";
	},
	
	ShowInfo: function(msg)
	{
        this.HideError();
		var el = document.getElementById("txtInfoMessage");
		el.innerHTML = msg;
		el.style.display = "block";
	},
	
	HideInfo: function()
	{
		var el = document.getElementById("txtInfoMessage");
		el.innerHTML = "";
		el.style.display = "none";
	},
	
	HideLogin: function()
	{
		document.getElementById("loginUIOverlay").style.display = 'none';
	},
	
	ShowLogin:function()
	{
		document.getElementById("loginUIOverlay").style.display = 'block';
	},
	
	// Core Functions
	preload: function()
	{
		Global.isLoading = true;
		console.log("Game aspect ratio: " + this.scale.aspectRatio);
		
	},
	
	create: function(game)
	{
		Global.gameState = "MainMenu";
		
		game.add.image(0,0,"bg");
		//game.state.start("Lobby"); 
		
        this.HideInfo();
        this.HideError();
		this.ShowLogin();
		
		Global.isLoading = false;
	},

	update: function(game)
	{
        // Update network packets
		Network._processPackets();
	},
};

window.onhashchange = function()
{
    if(Global.game.state.current == "Lobby")
    {
        var hash = window.location.hash.substring(1);
        if(hash != Global.lastAutoJoin)
        {
            Global.lastAutoJoin = hash;
            PacketHandler.SendBoardJoinRequest(hash);
            return;
        }
    }
}

window.onerror = function(message, url, lineNumber) {  
  alertify.alert("<div style='font-weight:bold'>Something Went Wrong :(</div><br/><div style='color:red'>"+message+"<br/>"+url+":"+lineNumber+"</div>");
  document.getElementById("gameDiv").style.display="none";
  document.getElementById("chatUIOverlay").style.display="none";
  document.getElementById("loginUIOverlay").style.display="none";
  return true;
};  

window.onload = function()
{
	var bestWidth = Layout.GetBestWidth(800,600,800,1080);

	if(bestWidth > 1080 || bestWidth < 800)
	{
		console.log("[WARNING] Unsupported Resolution. BestWidth: "+bestWidth);
		bestWidth = 1080;
		// return;
	}
	
    var config = {
      width: bestWidth,
      height: 600,
      renderer: Phaser.CANVAS,
      parent: 'gameDiv',
      transparent: false,
      antialias: true,
      forceSetTimeOut: true
    }

    
	//var game = new Phaser.Game(bestWidth, 600, Phaser.CANVAS, 'gameDiv', null,true,false);
    var game = new Phaser.Game(config);
    
	game.state.add("Preloader",Scrabble.Preloader);
	game.state.add("MainMenu",Scrabble.MainMenu);
	game.state.add("Board",Scrabble.Board);
	game.state.add("Lobby",Scrabble.Lobby);
	game.state.start("Preloader"); 
    Global.game = game;
};