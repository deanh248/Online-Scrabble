// Screen

var Layout =
{
	
	offsetX: 0,
	offsetY: 0,
	
	GetBestWidth: function(width,height,minWidth,maxWidth)
	{
		var winW = document.body.offsetWidth;
		var winH = document.body.offsetHeight;
		
		// calculate ratio
		var aspectRatio = winW/winH;
		console.log("Window aspect ratio is " + aspectRatio);
		
		// Generate new width for this aspect
		var newWidth = height*aspectRatio
		
		if(newWidth < minWidth)
			newWidth = minWidth;
		
		if(newWidth > maxWidth)
			newWidth = maxWidth;
		
		// Calculate offset X for positioning error correction
		this.offsetX = (newWidth-width)/2;
		
		if(this.offsetX < 0)
		{
			console.log("Unexpected negative offset. "+width+"x"+height);
		}
		
		// return width
		return newWidth;
	}
};
