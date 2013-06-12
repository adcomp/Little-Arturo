/*	HTML5 Canvas 2D Game Dev
 *	David Art [aka] ADcomp <david.madbox@gmail.com> */

var camera = {

	x: 0, 
	y: 0,
	friction: .05
}

camera.update =  function() {

	this.x -= (this.x - (player.x - game.width/2) ) * this.friction >> 0;
	if (this.x < 0) { this.x = 0 }
	if (this.x > game.canvasBuffer.width - game.width) { this.x = game.canvasBuffer.width - game.width }

	// this.y += (this.y - (player.y - game.height/2) )*0.02;
	// if (this.y < 0) { this.y = 0 }
	// if (this.y > game.canvasBuffer.height - game.height) { this.y = game.canvasBuffer.height - game.height 	}
}

var Particle = function(x, y, size, color, opacity, duration) {

	this.x = x;
	this.y = y;
	this.size = size;
	this.color = color || { hue: 0, saturation: 0, lightness: 0 };
	this.opacity = opacity || .8;
	this.duration = duration || 30;
	this.vx = -1 + Math.random()*2;
	this.vy = -1 + Math.random()*2;
	this.frame = 0;
	this.destroy = false;
	this.gravity = 0.01;

	// hack
	this.width = 1;
}

Particle.prototype.update = function() {

	this.frame += 1;

	if (this.frame > this.duration) {
		this.destroy = true
	}
	else {
		this.y += this.vy;
		this.vy += this.gravity;
		this.x += this.vx;
	}
}

Particle.prototype.draw = function() {
	
	game.ctx.save();

	y = -camera.y + this.y;
	x = -camera.x + this.x;
	size = this.size * ((this.duration-this.frame)/this.duration);
	opacity = this.opacity * ((this.duration-this.frame)/this.duration);

	game.ctx.fillStyle = 'hsla('+this.color.hue+', '+this.color.saturation+'%, '+this.color.lightness+'%, '+opacity+')';
	game.ctx.strokeStyle = 'hsla('+this.color.hue+', 50%, 50%, '+opacity+')';
	game.ctx.strokeRect(x,y,this.size,this.size);
	game.ctx.fillRect(x-1,y-1,this.size+2,this.size+2);

	game.ctx.restore();
}



var CheckPoint = function(x, y) {
	this.x = x;
	this.y = y;
	this.width = 32;
	this.height = 32;
	this.active = false;
	this.last = false;
}

CheckPoint.prototype.update = function() {

	if (this.active) { return; }

	if (game.checkCollision(player, this)) {

		if (this.last) {

			// game.levelComplete = true;
			game.state = 'levelcomplete';
		}
		
		else {

			this.active = true;
			player.start_x = this.x;
			player.start_y = this.y;

			if (!game.mute) { 
				game.audio.checkpoint.pause();
				game.audio.checkpoint.currentTime=0;
				game.audio.checkpoint.play();
			}
		}
	}
}

CheckPoint.prototype.draw = function() {

	var x, y = 288;
	var xx =  -camera.x + this.x;
	var yy =  -camera.y + this.y;

	if (this.last) {
		x = 160;
		xx -= 24;
		yy -= 30
	}

	else if (this.active) {
		x = 128;
	}

	else {
		x = 96;	
	}

	game.ctx.drawImage(game.images.map, x, y, 32, 32, xx, yy, 32, 32);

	if (game.debug)
		game.ctx.strokeRect(-camera.x + this.x, -camera.y + this.y, this.width, this.height);
}



var Energy = function(x, y) {

	this.width = 32;
	this.height = 32;
	this.x = x;
	this.y = y;

	this.destroy = false;
	this.color = { hue: 52, saturation: 100, lightness: 80 };
	this.rotation = 0;

}

Energy.prototype.update = function(delta) {

	if (game.checkCollision(player, this)) {

		player.collected++;

		for (var i = 8; i >= 0; i--) {
			game.animation.push(new Particle(this.x + this.width/2 , this.y + this.height/2, 3+Math.random()*4, this.color, 1, 60));
		};

		this.destroy = true;

		if (!game.mute) { 
			game.audio.collect.pause();
			game.audio.collect.currentTime=0;
			game.audio.collect.play();
		}
	}
	this.rotation += 3 * delta/1000;
}

Energy.prototype.draw = function() {

	game.ctx.save();

	game.ctx.translate(-camera.x + this.x + this.width/2, -camera.y + this.y + this.height/2);

	if (game.debug) {
		game.ctx.strokeRect(-this.width/2-1, -this.height/2-1 , this.width+2, this.height+2);
	}

	game.ctx.drawImage(game.images.map, 0, 161, 32, 32, -this.width/2-1, -this.height/2 - Math.cos(this.rotation)*2, 32, 32)
	game.ctx.restore();
}





var Bullet = function(x, y) {

	this.width = 6;
	this.height = 6;
	this.x = x;
	this.y = y - this.height/2;
	this.vx = 300;
	this.rotation = 0;
	this.destroy = false;
}

Bullet.prototype.update = function(delta) {

	this.x += this.vx * delta / 1000;
	this.rotation += .1;

	// bullet is out of screen
	if (this.x < camera.x || this.x > camera.x + game.width || 
		this.y < camera.y || this.y > camera.y + game.height)
	{
		this.destroy = true
	}

	else {

		var row = Math.floor(this.x * game.ratio)
		var line = Math.floor(this.y * game.ratio)

		// don't check if row/line < 0 or > legnth
		if (row < 0 || row > game.map[game.level].width - 1 || line < 0 || line > game.map[game.level].height - 1) {
			this.destroy = true
			return
		}
		else {
			// hit a block
			if (game.mapData[line][row] > 0 && game.mapData[line][row] > 0)  {
				for (var i = 8; i >= 0; i--) {
					game.animation.push(new Particle(this.x, this.y, 1+Math.random()*4, { hue: 0, saturation: 0, lightness: 100 }, .3, 40));
				};
				this.destroy = true
				return
			}
		}
	}

	// Enemies
	for (var enemy=game.enemies.length-1; enemy>=0; enemy--) {

		if (game.checkCollision(game.enemies[enemy], this))	{
			game.enemies[enemy].destroy = true
			game.enemies[enemy].died();
			this.destroy = true;

			if (!game.mute) { 
				game.audio.hit.pause();
				game.audio.hit.currentTime=0; 
				game.audio.hit.play();
			}
			return;
		}
	}
}

Bullet.prototype.draw = function() {

	game.ctx.save();
	game.ctx.translate(this.x - camera.x, this.y - camera.y);
	game.ctx.translate(this.width / 2, this.height / 2);
	game.ctx.rotate(this.rotation);
	game.ctx.strokeStyle = 'white';
	game.ctx.lineWidth = 2;
	game.ctx.strokeRect(-(this.width/2), -(this.height/2), this.width, this.height);
	game.ctx.restore();
}



var Cloud = function(x, y) {

	this.x = x;
	this.y = y;
	this.vx = -8 ; // -5 - Math.random()*5;
	this.width = 64;
	this.height = 32;
}

Cloud.prototype.update = function(delta) {

	this.x += this.vx * delta/1000;

	if (this.x < -64) {
		this.x = game.canvasBuffer.width;
	}
}

Cloud.prototype.draw = function() {

	y = -camera.y + this.y;
	x = -camera.x + this.x;
	
	game.ctx.drawImage(
		game.images.map, 
		96, 
		192, 
		this.width, 
		this.height, 
		x, 
		y, 
		this.width, 
		this.height);

	if (game.debug) game.ctx.strokeRect(x, y, this.width, this.height);
}