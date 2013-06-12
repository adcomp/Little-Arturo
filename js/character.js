/*	HTML5 Canvas 2D Game Dev
 *	David Art [aka] ADcomp <david.madbox@gmail.com> */

var Character = function (x, y, width, height, color) {

	this.x =  x || 0;
	this.y =  y || 0;
	this.width = width || 14;
	this.height = height || 14;
	this.color = color || { hue: 0, saturation: 0, lightness: 0 };

	this.gravity = 9.81;
	this.jump_force = 320;

	this.tile = { width: 32, height: 32 }

	this.type = "";
	this.shadow = true;
	this.frame = 0;
	this.max_frame = 0;
	this.hasAnim = true;

	this.vx =  0;
	this.vy =  0;
	this.x_accel = 8;
	this.y_accel = 12;
	this.vx_max = 130;
	this.dir =  1;
	this.rotation = 0;
	this.friction = .8;

	this.isAlive = true
	this.isMoving =  true;
	this.isJumping =  false;
	this.jumpFlag = false;
	this.canAttack = false;
	this.isFiring = false;
	this.fire_flag = false;
	this.bullets = [];
}

Character.prototype.fire = function() {
	
	if (!this.isAlive) { return; }

	var bullet = new Bullet(this.x + this.width/2 , this.y + this.height/2);
	bullet.vx *= this.dir;

	this.bullets.push(bullet);

	if (!game.mute) { 
		game.audio.shoot.pause();
		game.audio.shoot.currentTime=0; 
		game.audio.shoot.play();
	}
}

Character.prototype.left = function() {

	this.dir = -1;
	this.isMoving = true;
	if (this.vx > -this.vx_max) {
		this.vx -= this.x_accel;
	}
}

Character.prototype.right = function() {

	this.dir = 1;
	this.isMoving = true;
	if (this.vx < this.vx_max) {
		this.vx += this.x_accel;
	}
}

Character.prototype.attack = function() {}

Character.prototype.jump = function() {

	if ((this.canJump() || this.doubleJump) && !this.jumpFlag) {

		this.vy = -this.jump_force;
		this.jumpFlag = true;

		// set/reset doublejump
		if (this.doubleJump) {
			this.doubleJump = false;
		}

		if (this.canJump()) {
			this.doubleJump = true;
		}

		// animation
		for (var i = 8; i >= 0; i--) {
			game.animation.push(new Particle(this.x + this.width/2, this.y + this.height, 1+Math.random()*2, this.color, .3, 20));
		}

		// fx
		if (!game.mute) { 
			game.audio.jump.pause();
			game.audio.jump.currentTime = 0; 
			game.audio.jump.play();
		}
	}
}

Character.prototype.died = function() {

	this.isAlive = false;

	// animation
	for (var i = 32; i >= 0; i--) {
		game.animation.push(new Particle(this.x, this.y + this.height/2, 1 + Math.random()*8, this.color, .95, 40));
	}
}

Character.prototype.draw = function() {

	if (!this.isAlive) { return; }

	game.ctx.save();
	game.ctx.translate(this.x - camera.x, this.y - camera.y);
	game.ctx.translate(this.width / 2, this.height / 2);
	game.ctx.rotate(this.rotation);

	if (this.dir == -1) {
		game.ctx.scale(-1, 1);
	}


	if (this.type == "player") {

		game.ctx.drawImage(
			game.images.player, 
			this.tile.width * Math.round(this.frame), 
			0, 
			this.tile.width, 
			this.tile.height, 
			-this.width/2 -(this.tile.width-this.width)/2, 
			-this.height/2 -(this.tile.height-this.height)+2, 
			this.tile.width, 
			this.tile.height);

		if (game.debug) {
			game.ctx.lineWidth = 2;
			game.ctx.strokeStyle = "green";
			game.ctx.strokeRect(-(this.width/2), -(this.height/2), this.width, this.height);
		}
	}

	else if (this.type == "enemy") {

		game.ctx.drawImage(
			game.images.enemy, 
			this.tile.width * Math.round(this.frame), 
			0, 
			this.tile.width, 
			this.tile.height, 
			-this.width/2 -(this.tile.width-this.width)/2, 
			-this.height/2 -(this.tile.height-this.height)+2, 
			this.tile.width, 
			this.tile.height);

		if (game.debug) {
			game.ctx.lineWidth = 2;
			game.ctx.strokeStyle = "red";
			game.ctx.strokeRect(-(this.width/2), -(this.height/2), this.width, this.height);
		}
	}

	else if (this.type == "jumper") {

		game.ctx.drawImage(
			game.images.jumper, 
			0, 
			0, 
			this.tile.width, 
			this.tile.height, 
			-this.width/2 -(this.tile.width-this.width)/2, 
			-this.height/2 -(this.tile.height-this.height), 
			this.tile.width, 
			this.tile.height);

		if (game.debug) {
			game.ctx.lineWidth = 2;
			game.ctx.strokeStyle = "red";
			game.ctx.strokeRect(-(this.width/2), -(this.height/2), this.width, this.height);
		}
	}

	else if (this.type == "lava") {
		game.ctx.lineWidth = 2;
		game.ctx.strokeStyle = "hsl(" + this.color.hue + ", " + this.color.saturation + "%, " + this.color.lightness*.8 + "%)";
		game.ctx.strokeRect(-(this.width/2), -(this.height/2)+4, this.width, this.height);
	}

	game.ctx.restore();
}

Character.prototype.changeDir = function() {
	this.vx *= -1;
	this.dir *= -1;
}

Character.prototype.update = function(delta) {

	if (!this.isAlive) { return; }

	if (this.isMoving) {

		if (this.type == 'player' || this.type == 'enemy') {
			this.frame += delta/144;
			if (this.frame > this.max_frame) { 
					this.frame = 1;
			}
		}

	}
	else {
		this.frame = 0;
	}

	// animation
	if (this.canJump()) {
		if (this.type == 'jumper') {
			this.vy = -this.jump_force;
		}
	}
	else {
		if (this.vy < 0) {
			this.frame = 5;
		}
		else {
			this.frame = 6;
		}
	}

	if (this.type == 'player' && game.keys.down) {
		this.frame = 7;
	}

	if (this.type == 'lava') {
		x = this.x + this.width/2;
		particle = new Particle(
			x, 
			this.y+this.height/2+(-5+Math.random()*10), 
			3, 
			{hue:this.color.hue, saturation:this.color.saturation, lightness:50}, 
			.2, 
			30);
		particle.vy = 0;
		game.animation.push(particle);
	}

	// slow down velocity if not moving
	if (!this.isMoving) {
		this.vx = (this.vx < 1 && this.vx > -1) ? 0 : this.vx * this.friction;
	}

	var next_x = (this.x + (this.vx * delta / 1000));
	var next_y = (this.y + (this.vy * delta / 1000));

	// touch the top
	if (next_y < 0)  {
		next_y = 0;
		this.vy = 0;
	}

	var fix_offset = 1;

	// check if player quit map .. ( from left )
	if (next_x < 0) {
		next_x = 0;
		this.vx = 0;
	}

	// level complete .. ?
	else if (next_x > game.canvasBuffer.width - this.width) {
		if (this.type == "enemy") {
			this.changeDir();
		}
		// else {
		// 	game.animateLevelComplete()
		// 	return;
		// }
	}

	// player die .. :)
	if (next_y >= game.canvasBuffer.height - this.height - fix_offset) {
		this.type == "player" ? game.player_is_dead(): this.died();
		return;
	}

	/* LEFT */
	if (next_x < this.x) {

		var row = Math.floor((next_x - fix_offset) * game.ratio);
		var line0 = Math.floor((this.y + fix_offset) * game.ratio);
		var line1 = Math.floor((this.y + this.height - fix_offset) * game.ratio);

		if (game.mapData[line0][row] == 0 && game.mapData[line1][row] == 0)  {
			// set new position
			this.x = next_x;
		}
		else {
			if (this.type == "enemy") { this.changeDir(); }
		}
	}

	/* RIGHT */
	if (next_x > this.x) {

		var row = Math.floor((next_x + this.width + fix_offset) * game.ratio);
		var line0 = Math.floor((this.y + fix_offset) * game.ratio);
		var line1 = Math.floor((this.y + this.height - fix_offset) * game.ratio);

		if (game.mapData[line0][row] == 0 && game.mapData[line1][row] == 0)  {
			// set new position
			this.x = next_x;
		}
		else {
			if (this.type == "enemy") { this.changeDir(); }
		}
	}

	/* UP */
	if (next_y < this.y) {

		var row0 = Math.floor((this.x + fix_offset) * game.ratio);
		var row1 = Math.floor((this.x + this.width + fix_offset) * game.ratio);
		var line = Math.floor((next_y + fix_offset) * game.ratio);

		// FIX!
		if (line < 0) { line = 0}

		if (game.mapData[line][row0] == 0 && game.mapData[line][row1] == 0)  {
			// set new position
			this.y = next_y;
		}
		else {
			// reset velocity
			this.vy = 0;
		}
	}

	/* DOWN */
	if (next_y > this.y) {

		var row0 = Math.floor(next_x * game.ratio);
		var row1 = Math.floor((next_x + this.width - fix_offset) * game.ratio);
		var line = Math.floor((next_y + this.height + fix_offset) * game.ratio);

		if (game.mapData[line][row0] == 0 && game.mapData[line][row1] == 0)  {
			// set new position
			this.y = next_y;
		}
		else  {
			this.y = line * game.map[game.level].tilewidth - this.height -1;
		}
	}


	// gravity ..
	if (this.canJump()) {
		this.vy = 0;
	}
	else  {
		this.vy += this.gravity * delta / this.y_accel;
	}
	
	// if (this.vy > 8 * this.dt*this.gravity) { this.vy = 8 * this.dt*this.gravity; }

}

Character.prototype.canJump = function() {

	var row0 = Math.floor(this.x * game.ratio);
	var row1 = Math.floor((this.x + this.width) * game.ratio);
	var line = Math.floor((this.y + this.height + 1) * game.ratio);

	if (game.mapData[line][row0] == 0 && game.mapData[line][row1] == 0)  {
		return false;
	}
	else {
		return true;
	}
}