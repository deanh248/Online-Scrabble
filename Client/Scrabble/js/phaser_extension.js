function _fileComplete(progress, cacheKey, success, totalLoaded, totalFiles) {
    if (success) this.loadTexture(cacheKey);
}

function UpdateTexture(game, image, key, url) {
    //if (typeof key === 'undefined') key = 'dynamicLoad_' + url;
    //if (game.cache.checkImageKey(key)) {
    //    return game.add.image(x, y, key);
    //} else {
		
        //var image = game.add.image(x, y, fallback);
	var loader = new Phaser.Loader(game);

	loader.image(key, url);
	loader.onFileComplete.addOnce(_fileComplete, image);
	loader.start();

	return image;
	
    //}
}