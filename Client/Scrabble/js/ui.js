var UI =
{
    Clear:function()
    {
            // clear all active ui'save
            document.getElementById("chatUIOverlay").style.display = "none";
    },
    
    
	// dom
    ShowPrompt: function(msg, val)
    {
        alertify.prompt(msg, function(){}, val);
    },
    
	ToggleChat: function()
	{
		var el = document.getElementById("chatUIOverlay");
		if(el.style.display == "block")
		{
			el.style.display = "none";
		}
		else
		{
			el.style.display = "block";
			var txtChat = document.getElementById("txtChat");
			window.setTimeout(function(){document.getElementById("txtChat").focus()},10);
			txtChat.value = "";
		}
	},
	
	SendChat: function()
	{
		var txtChat = document.getElementById("txtChat").value;
		//this.ToggleChat();
		
		txtChat = txtChat.trim();
		
		if(txtChat.length == 0)
			return;
		
		// TODO: Send to server.
		
		// TEST CODE:
		if(Global.gameState == "Board")
		{
			PacketHandler.SendBoardChat(txtChat);
		}
	},
	
	// canvas
	ShowMessageBar: function(msg)
	{
		UI.groupMessageBar.visible=true;
		UI.txtMessageBar.text = msg;
        
        setTimeout(UI.HideMessageBar, 3000);
        
	},
	
	HideMessageBar: function()
	{
		UI.groupMessageBar.visible=false;
		UI.txtMessageBar.text = "";
	},
	
	// core
	create: function(game)
	{

		// Create UI components on game.stage instead of world.
		
		this.sprMessageBar = game.make.sprite(0,0,"textBar");
		this.sprMessageBar.alpha=0.8;
		
		this.txtMessageBar = game.make.text(game.width/2,15,"Test",{fontSize:32,fontWeight:'normal',fill:'#000',font:'Ebrima'});
		this.txtMessageBar.anchor.x = 0.5;
		
		this.groupMessageBar = game.make.group();
		this.groupMessageBar.add(this.sprMessageBar);
		this.groupMessageBar.add(this.txtMessageBar);
		this.groupMessageBar.y = 250;
		this.groupMessageBar.visible=false;
		
		game.stage.addChild(this.groupMessageBar);
	},
};