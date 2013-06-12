/*	HTML5 Canvas 2D Game Dev
 *	David Art [aka] ADcomp <david.madbox@gmail.com> */

$(function() {

     game.init();

     // pause the game on blur
     // $(window).blur(function() { game.pause = true; });
});

var player;

var game = {

	width: 480	, height: 320,
	pause: false,
	state: '',
	level: 0,

	frames: 0,
	lastUpdate: Date.now(),
	fps: 60,

	// sound fx
	mute: true,

	enemies: [], energy: [], checkpoint: [], animation: [], mapData: [], bg_anim: [],

	// mouse
	mouse: { x:0 , y:0, press: false },

	// state key
	keys: {
		shift: false,
		ctrl: false,
		left: false,
		right: false,
		action: false,
		attack: false,
		jump: false,
	},

	// anim clouds
	clouds: [],
	
	// debug & info
	debug: false,
	showinfo: false
}

game.init = function() {

	// get canvas and context
	this.canvas = document.getElementById('canvas');
	this.ctx = this.canvas.getContext('2d');

	this.canvasBuffer = document.createElement('canvas');
	this.ctxBuffer = this.canvasBuffer.getContext('2d');

	//setting canvas dimension
	this.canvas.width =  this.width;
	this.canvas.height = this.height;

	// Player config
	player = new Character(0,0, 26, 28);
	player.type = "player";
	player.color = { hue: 222, saturation: 50, lightness: 80 };
	player.max_frame = 4;
	player.collected = 0;
	player.collectedMax = 0;
	player.deaths = 0;

	// Images
	this.images = {
		player: document.getElementById('img_player'),
		enemy: document.getElementById('img_enemy'),
		jumper: document.getElementById('img_jumper'),
		map: document.getElementById('img_map')
	}

	// Audio
	this.audio = {
	 	song: document.getElementById('audio_song'),
	 	collect: document.getElementById('audio_collect'),
	 	checkpoint: document.getElementById('audio_checkpoint'),
	 	shoot: document.getElementById('audio_shoot'),
	 	hit: document.getElementById('audio_hit'),
	 	jump: document.getElementById('audio_jump'),
	 	death: document.getElementById('audio_death')
	};

	// save context
	var that = this;

	/* Events */
	window.onkeyup = function(event) { that.keyDownUp(event, that, false); }
	window.onkeydown = function(event) { that.keyDownUp(event, that, true); }
}

game.play = function() {

	game.run();

	$('#control').fadeTo('slow', 0, 
		function() {
			$('#mainscreen').hide();
			$('#control').css({cursor: "none"});
		}
	);

}

game.nextLevel = function() {

	console.log('nextLevel')

	this.level++;
	this.run();
	$('#control').fadeTo('fast', 0);
	$('#playerscore').hide();
}

game.run = function() {

	this.loadMap(this.level);
	this.state = 'run'
	this.levelStartTime = Date.now();
	this.loop();
	if (!game.mute) {
		game.audio.song.play();
	}
}

game.loop = function() {

	if (this.state == 'stop') return;

	if (!this.pause) requestAnimFrame(function() { game.loop(); });

	var that = this;
	var now = Date.now();
	var delta = now - this.lastUpdate;
	
	if (delta > 60) delta = 60;
	this.lastUpdate = now;

	if (!this.frames%6) {
		this.fps = (this.fps + 1000 / delta)/2 >>0;
		console.log('tictac')
	}
	
	this.update(delta);
	this.render();

	this.frames++;
	if (this.frames >= 60) this.frames = 0;
}


game.player_is_dead = function() {

	player.deaths++;
	player.died();

	if (!game.mute) {
		game.audio.death.play();
	}

	this.restartMap();
	setTimeout( function() { player.isAlive = true; }, 1000);
}

game.levelComplete = function() {

	this.log('level complete')

	var now = Date.now();
	var time = (now - this.levelStartTime) / 1000 >> 0;

	game.state = 'stop';
	game.audio.song.pause();

	$('#time').html(time);
	$('#collected').html(player.collected);
	$('#collectedMax').html(player.collectedMax);
	$('#deaths').html(player.deaths);

	$('#playerscore').show();
	$('#control').fadeTo('slow', 1);
}

game.update = function(delta) {

	var that = this;

	if (this.state == 'levelcomplete') {

		this.levelComplete();
		return;
	}

	if (this.state == "run") {

		this.userInput();

		if (player.isAlive) {
			for (var enemy=this.enemies.length-1; enemy>=0; enemy--) {
				if (this.checkCollision(player, this.enemies[enemy])) {
					this.player_is_dead();
					break;
				}
			}
		}

		player.update(delta);
		camera.update();

		var game_obj = [ this.clouds, player.bullets, this.enemies, this.energy, this.checkpoint, this.animation, this.bg_anim ];

		var ln = game_obj.length;
		for (var i= 0; i<ln; i++) {

			var ln_2 = game_obj[i].length-1;
			for (var j=ln_2; j>=0; j--) {

				if (game_obj[i][j].destroy) {
					game_obj[i].remove(j);
				}
				else {
					game_obj[i][j].update(delta);
				}
			}
		}
	}
}

game.render = function() {

	if (this.pause) {
		this.ctx.fillStyle = 'rgba(0,0,0,.8)';
		this.ctx.fillRect(0,0, game.width, game.height);
		this.ctx.fillStyle = 'white';
		this.ctx.font = 'bold 32pt monospace';
		this.ctx.fillText('PAUSE', 40, game.height/2);
		return;
	}

	// clear canvas
	this.ctx.clearRect(0,0, game.width, game.height);

	// draw bg
	// this.ctx.drawImage(this.images.bg, 0, 0, this.width, this.height, 0, 0, this.width, this.height);


	// clouds
	for (var i = this.clouds.length-1; i>=0; i--) {
		if ((this.clouds[i].x + this.clouds[i].width > camera.x && this.clouds[i].x < camera.x + game.width) && (this.clouds[i].y > camera.y && this.clouds[i].y < camera.y + game.height)) {
			this.clouds[i].draw();
		}
	}

	// draw map from buffer
	this.ctx.drawImage(
		this.canvasBuffer, 
		camera.x, 
		camera.y, 
		this.width, 
		this.height,
		0, 
		0, 
		this.width, 
		this.height
	)

	var game_obj = [
		this.energy,
		this.checkpoint,
		this.animation,
		this.enemies,
		player.bullets
	];

	var ln = game_obj.length;
	for (var i= 0; i<ln; i++) {

		var ln_2 = game_obj[i].length;
		for (var j=0; j<ln_2; j++) {

			// draw only if visible (inside the camera)
			if ((game_obj[i][j].x + game_obj[i][j].width > camera.x && game_obj[i][j].x < camera.x + game.width) && (game_obj[i][j].y > camera.y && game_obj[i][j].y < camera.y + game.height))
				game_obj[i][j].draw();
		}
	}

	player.draw();

	if (game.showinfo) {
		this.ctx.fillStyle = 'black';
		this.ctx.font = 'bold 10pt monospace';
		this.ctx.fillText(this.fps+' fps', 10, 20);

		x = camera.x >> 0;
		y = camera.y >> 0;

		this.ctx.fillText('camera: ' + x + ', '+ y, 10, 40);

		x = player.x >> 0;
		y = player.y >> 0;

		this.ctx.fillText('player: ' + x + ', '+ y, 10, 60);

		x = player.vx >> 0;
		y = player.vy >> 0;

		this.ctx.fillText('v(x,y): ' + x + ', '+ y, 10, 80);
	}

}

game.restartMap = function() {

	this.log('restart map')

	// reset player
	player.x = player.start_x;
	player.y = player.start_y - player.height / 2 >> 0;
	player.vx = 0;
	player.vy = 0;
	// player.isAlive = true;
}

game.nextMap = function() {

	// increase level
	this.level++;

	if (this.level < game.map.length) {
		this.loadMap(this.level);
	}
	else {
		this.state = "";
		$('#control').show();
		$('#control').fadeTo('slow', 1);
		this.level = 0;
	}
}

game.loadMap = function(level) {

	this.log('loading map ..');

	// reset game 'object'
	player.collected = 0;
	player.collectedMax = 0;
	player.deaths = 0;
	player.bulllets = [];
	this.enemies = [];
	this.mapData = [];
	this.energy = [];
	this.checkpoint = [];

	this.ratio = 1 / this.map[level].tilewidth;

	// set mapData from current map
	for (var line=0; line < this.map[level].height; line++) {

		this.mapData.push([]);

		for (var row=0; row < this.map[level].width; row++) {

			var y = this.map[level].tilewidth * line;
			var x = this.map[level].tilewidth * row;

			tile_val = this.map[level].layers[0].data[line * this.map[level].width + row];

			if (tile_val == 1) { // player start position
				player.x = x;
				player.y = y;
				player.start_x = player.x;
				player.start_y = player.y;
				this.mapData[line][row] = 0;
			}

			else if (tile_val == 2) { // level end

				this.mapData[line][row] = 0;
				var lvl_end = new CheckPoint(x + 24, y + 30);
				lvl_end.width = 8;
				lvl_end.height = 2;
				lvl_end.last = true;
				this.checkpoint.push(lvl_end);
			}

			else if (tile_val == 4) { // Enemy

				var enemy = new Character(x, y, 26, 28, { hue: 20, saturation: 75, lightness: 50});
				enemy.vx = 50;
				enemy.type = 'enemy';
				enemy.max_frame = 4;
				this.enemies.push(enemy);
				this.mapData[line][row] = 0;
			}

			else if (tile_val == 6) { // lava

				var enemy = new Character(x+1, y + this.map[level].tilewidth/2, this.map[level].tilewidth-2, 2, { hue: 0, saturation: 75, lightness: 50});
				enemy.vx = 0;
				enemy.type = 'lava';
				enemy.hasAnim = false;
				this.enemies.push(enemy);
				this.mapData[line][row] = 0;
			}

			else if (tile_val == 5) { // Jumper

				var enemy = new Character(x, y, 31, 31, { hue: 0, saturation: 75, lightness: 5});
				enemy.vx = 0;
				enemy.vy = -10;
				enemy.gravity = 0.8;
				enemy.type = 'jumper';
				enemy.hasAnim = false;
				this.enemies.push(enemy);
				this.mapData[line][row] = 0;
			}

			else if (tile_val == 7) { // Energy

				this.mapData[line][row] = 0;
				this.energy.push(new Energy(x, y - 16));
				player.collectedMax++;
			}

			else if (tile_val == 3) { // Check Point

				this.mapData[line][row] = 0;
				this.checkpoint.push(new CheckPoint(x, y));
			}

			else {

				this.mapData[line][row] = tile_val;
			}
		}
	}

	this.renderMap(level);
}


game.renderMap = function(level) {

	this.log('render map')

	var size = this.map[level].tilewidth;
	var map_w = this.map[level].width;
	var map_h = this.map[level].height;

	this.clouds = [];
	camera.x = 0;
	camera.y = 0;

	var nb_cloud = map_w * size / this.width +2;
	for (var i=0; i<nb_cloud; i++) {
		var x = Math.random() * 64 +  (i * (map_w * size)/nb_cloud);
		var y = 10 + Math.random() * (map_h * size /10) ;
		this.clouds.push(new Cloud(x, y));
	}

	// set CanvasBuffer size. this clean the canvas too ..
	this.canvasBuffer.width = map_w * size;
	this.canvasBuffer.height = map_h * size;

	for (var line=0; line < map_h; line++) {

		for (var row=0; row < map_w; row++) {

			tile_val = this.map[level].layers[1].data[line * this.map[level].width + row];

			if (tile_val) {

				y = size * line;
				x = size * row;

				tile_y = Math.floor((tile_val-1) / 10)
				tile_x = tile_val-1 - tile_y*10

				this.ctxBuffer.drawImage(this.images.map, 32*tile_x, 32*tile_y, 32, 32, x, y, 32, 32)
			}
		}
	}

	for (var line=0; line < map_h; line++) {

		for (var row=0; row < map_w; row++) {

			if (this.mapData[line][row]) {

				y = size * line;
				x = size * row;

				tile_y = Math.floor((this.mapData[line][row]-1) / 10)
				tile_x = this.mapData[line][row]-1 - tile_y*10

				this.ctxBuffer.drawImage(this.images.map, 32*tile_x, 32*tile_y, 32, 32, x, y, 32, 32)
			}
		}
	}

}

game.userInput = function() {

	var keypress = false;

	if (this.keys.right) {
		player.right();
		keypress = true;
	}

	if (this.keys.left) {
		player.left();
		keypress = true;
	}

	if (this.keys.attack) {
		player.attack();
	}
	else {
		player.canAttack = true;
	}

	if (this.keys.jump || this.keys.up) {
		player.jump();
	}
	else {
		player.jumpFlag = false;
	}

	if (this.keys.down) {

	}

	if (this.keys.fire && !player.fire_flag) {
		player.fire_flag = true;
		player.fire();
	}

	player.isMoving = keypress;
}


game.keyDownUp = function(e, that, state) {

	// console.log(e.keyCode)

	if (that.state == 'levelcomplete') {
		// that.runGame()
		return;
	}

	// pause
	if (e.keyCode == 80 && state) {	// p
		that.log('Pause = ' + that.pause)
		that.pause = !that.pause;
		if (!that.pause) { that.loop(); }
	}

	// mute
	if (e.keyCode == 77 && state) {	// m
		that.log('Mute = ' + that.mute)
		that.mute = !that.mute;
	}

	// nexT level
	if (e.keyCode == 78 && state && that.state != 'run') {	// n
		that.nextLevel();
	}

	// game.debug
	if (e.keyCode == 68 && state) {
		game.debug = !game.debug;
	}

	// show fps
	if (e.keyCode == 70 && state) {
		game.showinfo = !game.showinfo;
	}

	// SHIFT
	if (e.keyCode == 16) {
		that.keys.shift = state;
	}

	// CTRL
	if (e.keyCode == 17) {
		that.keys.ctrl = state;
	}

	// Left 
	if (e.keyCode == 37) {
		that.keys.left = state;
	}

	// Right
	if (e.keyCode == 39) {
		that.keys.right = state;
	}

	// Up
	if (e.keyCode == 38) {
		that.keys.up = state;
	}

	// Down
	if (e.keyCode == 40) {
		that.keys.down = state;
	}

	// Jump ( x )
	if (e.keyCode == 88) {
		that.keys.jump = state;
	}

	// attack ( v )
	if (e.keyCode == 86) {
		that.keys.attack = state;
	}

	// Fire ( c )
	if (e.keyCode == 67) {
		that.keys.fire = state;
		if (!state) {
			player.fire_flag = false;
		}
	}
}

game.getMousePos = function(element, event) {

    var obj = element
    var top = 0
    var left = 0

    while (obj && obj.tagName != 'BODY') {
        top += obj.offsetTop
        left += obj.offsetLeft
        obj = obj.offsetParent
    }

    return {x: event.clientX - left + window.pageXOffset, y: event.clientY - top + window.pageYOffset}
}


game.checkCollision = function(c1, c2) {
	
	if (c1.x < c2.x + c2.width &&  c1.x + c1.width > c2.x && c1.y < c2.y + c2.height && c1.y + c1.height > c2.y)
		return true;
	else
		return false;
}

game.log = function(msg) {

	if (this.debug) { console.log(msg); }
}


/*      Learn more: requestAnimationFrame for Smart Animating 
 *      http://paulirish.com/2011/requestanimationframe-for-smart-animating/    */

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(/* function */ callback, /* DOMElement */ element){
              window.setTimeout(callback, 1000 / 60);
            };
})();

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};
