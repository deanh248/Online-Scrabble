
function Packet(proto)
{
	this.packetArray = [proto];
	this.packetString = "";
	
	// Public:
	this.IsReady = function()
	{
		// Check if the data is complete so you can Read()
		return (this.GetHeader() != Protocol.Fragment);
	};
	
	this.AppendString = function(buffer)
	{
		this.packetString += buffer;
		this._ParsePacket();
		return true;
	};
	
	this.Read = function(index)
	{
		return this.packetArray[index];
	};
	
	this.ReadInt = function(index)
	{
		return parseInt(this.packetArray[index]);
	};
	
	this.Write = function(data)
	{
		this.packetArray.push(this._Encode(data));
	};
	
	this.GetHeader = function()
	{
		return this.packetArray[0];
	};
	
	this.ToString = function()
	{
        console.log("PACKET: " + this.packetArray.join("/"));
		return this.packetArray.join("/");
	};
	
	this.Count = function()
	{
		return this.packetArray.length;
	};
	
	// Private:
	this._ParsePacket = function(raw)
	{
		if (this._CanParse())
		{
			//this.packetString = this.packetString.replace("//", "");
			//this.packetString = this.packetString.replace("##", "");

			this.packetArray = this.packetString.split("/");

			for (i = 0; i < this.packetArray.length; i++)
				this.packetArray[i] = this._Decode(this.packetArray[i]);

			this.packetArray[0] = this.packetArray[0];
		}
		else
		{
			this.packetArray[0] = Protocol.Fragment;
		}
	};
	
	this._Decode = function(data)
	{
		return data.replace(/%%/g, "/");
	};
	
	this._Encode = function(data)
	{
		// slash is a delimiter replace with %% lazy
		// Encode replaces it with something safe.
		// TODO: actual html code for slash is "&#47;" that mit b best
		
		if(typeof(data) == "number")
			return data;
			
		return data.replace(/\//g, "%%");
	};
	
	this._CanParse = function()
	{
		// Websocket sends packet as a whole, this is not needed.
		//return this.packetString.endsWith("//##");
		return true;
	};
	
};