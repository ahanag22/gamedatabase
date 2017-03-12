
// GameBoard code below

function distance(a, b) {
    var difX = a.x - b.x;
    var difY = a.y - b.y;
    return Math.sqrt(difX * difX + difY * difY);
};

var GlobalGameEngine = {};

function SetGlobalGameEngine(gameEngine) {
	GlobalGameEngine = gameEngine;
}

function Circle(game) {
    this.player = 1;
    this.radius = 10;
    this.colors = ["Red", "Green", "Blue", "White"];
    this.color = 1;
	this.canChange = false;
    Entity.call(this, game, this.radius + Math.random() * (800 - this.radius * 2), this.radius + Math.random() * (800 - this.radius * 2));
    this.velocity = { x: Math.random() * 200, y: Math.random() * 200};
    var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > maxSpeed) {
        var ratio = maxSpeed / speed;
        this.velocity.x += ratio;
        this.velocity.y += ratio;
    };
}

Circle.prototype = new Entity();
Circle.prototype.constructor = Circle;

Circle.prototype.collideRight = function () {
    return this.x + this.radius > 800;
};
Circle.prototype.collideLeft = function () {
    return this.x - this.radius < 0;
};
Circle.prototype.collideBottom = function () {
    return this.y + this.radius > 800;
};
Circle.prototype.collideTop = function () {
    return this.y - this.radius < 0;
};

Circle.prototype.collide = function (other) {
	
    return distance(this, other) < this.radius + other.radius;
};

Circle.prototype.update = function () {
    Entity.prototype.update.call(this);

    this.x += this.velocity.x * this.game.clockTick;
    this.y += this.velocity.y * this.game.clockTick;

    if (this.collideLeft() || this.collideRight()) {
        this.velocity.x = -this.velocity.x;
    }
    if (this.collideTop() || this.collideBottom()) {
        this.velocity.y = -this.velocity.y;
    }

    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (this != ent && this.collide(ent)) {
			
			if(this.color < ent.color && ent.canChange == true && this.canChange == false){
			    this.color = ent.color;
				
				this.canChange = true;
				//ent.canChange = false;
				//ent.canchange = false;
			}
            else if(this.color > ent.color && this.canChange == true){
			    this.color = ent.color;
				
				this.canChange = false;
				//ent.canChange = true;
				//ent.canchange = false;
			}
		    var white = 0;
			var green = 0;
			for(var i = 0; i < this.game.entities.length; i++){
				if(this.game.entities[i].color === 1){
					green ++;
				}
				else{
					white++;
	            }
			}
			
			if(green === this.game.entities.length ){
				this.game.gameOver = true;
				this.game.allgreen = true;
				
			}
			else if(white === this.game.entities.length){
				this.game.gameOver = true;
				this.game.allwhite = true;
			}
            var temp = this.velocity;
            this.velocity = ent.velocity;
            ent.velocity = temp;
        };
    };

    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (this != ent) {
            var dist = distance(this, ent);
            var difX = (ent.x - this.x) / dist;
            var difY = (ent.y - this.y) / dist;
            this.velocity.x += difX / (dist * dist) * acceleration;
            this.velocity.y += difY / (dist * dist) * acceleration;

            var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            if (speed > maxSpeed) {
                var ratio = maxSpeed / speed;
                this.velocity.x *= ratio;
                this.velocity.y *= ratio;
            };
        };
    }

    this.velocity.x -= (1 - friction) * this.game.clockTick * this.velocity.x;
    this.velocity.y -= (1 - friction) * this.game.clockTick * this.velocity.y;

}

Circle.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.colors[this.color];
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
}


var friction = 1;
var acceleration = 20;
var maxSpeed = 300;	

// the "main" code begins here

var ASSET_MANAGER = new AssetManager();

//ASSET_MANAGER.queueDownload("./img/960px-Blank_Go_board.png");
//ASSET_MANAGER.queueDownload("./img/egg.png");
ASSET_MANAGER.queueDownload("./img/egg.png");

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var gameEngine = new GameEngine();
	SetGlobalGameEngine(gameEngine);
	//var st = [];
	for(var i = 0; i < 22; i++){
		var circle = new Circle(gameEngine);
		circle.color = 3;
		circle.canChange = true;
		gameEngine.addEntity(circle);
	}
    for (var i = 0; i < 23; i++) {
        circle = new Circle(gameEngine);
        gameEngine.addEntity(circle);
    };

    gameEngine.init(ctx);
    gameEngine.start();
});

function updateGame(data) {
	for(var i = 0; i < GlobalGameEngine.entities.length; i++) {
		if(GlobalGameEngine.entities[i] instanceof Circle ) {
			console.log('One state' + JSON.stringify(data[i]));
 			(GlobalGameEngine.entities[i]).x = data[i].positionX;
			(GlobalGameEngine.entities[i]).y = data[i].positionY;
			(GlobalGameEngine.entities[i]).velocity.x = data[i].velocity.x;
			(GlobalGameEngine.entities[i]).velocity.y = data[i].velocity.y;
			(GlobalGameEngine.entities[i]).color = data[i].color;
			(GlobalGameEngine.entities[i]).radius = data[i].radius;
			(GlobalGameEngine.entities[i]).canChange = data[i].canChange;
		}
	}
}

function onLoadGame() {
	if(GlobalGameEngine) {
		console.log("Sending load message to the server");
		var socket = io.connect("http://76.28.150.193:8888");
		socket.on("load", function (data) {
			console.log('Load callback is hit');
			var stringified = JSON.stringify(data);
			//console.log('Recvd: ' + stringified);
			var circleStates = JSON.parse(data.data);
			//console.log(circleStates);
			updateGame(circleStates);
		});
		socket.emit("load", { studentname: "Ahana Ghosh", statename: "aState" });
	}
	
	GlobalGameEngine.gameLoaded = true;
}

function onSaveGame() {
	if(GlobalGameEngine) {
		console.log("Saving the game...");
		var circleStates = [];
		
		for(var i = 0; i < GlobalGameEngine.entities.length; i++){
			console.log('Adding a circle state');
			var circleState = {};
			circleState.color = (GlobalGameEngine.entities[i]).color;
			circleState.radius = (GlobalGameEngine.entities[i]).radius;
			circleState.velocity = {};
			circleState.velocity.x = (GlobalGameEngine.entities[i]).velocity.x;
			circleState.velocity.y = (GlobalGameEngine.entities[i]).velocity.y;
			circleState.canChange = (GlobalGameEngine.entities[i]).canChange;
			circleState.positionX = GlobalGameEngine.entities[i].x;
			circleState.positionY = GlobalGameEngine.entities[i].y;
			circleStates.push(circleState);
		}
		
		var serializedArr = JSON.stringify(circleStates);
		var socket = io.connect("http://76.28.150.193:8888");
		socket.emit("save", { studentname: "Ahana Ghosh", statename: "aState", data: serializedArr });
		console.log("Game Data: " + serializedArr);
	}
	
	GlobalGameEngine.gameSaved = true;
}