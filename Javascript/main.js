(function () {
    
    'use strict';
    
    var runTime = new Date();
    
    function Vector2(x, y) {
        this.x = x;
        this.y = y;
    }
    
    function PhysicObject(x,y, sizeX, sizeY, mass, life, initialVelocityX, initialVelocityY){
        this.pos = new Vector2(x,y);
        this.size = new Vector2(sizeX, sizeY);
        this.mass = mass;
        this.life = life;
        this.velocity = new Vector2(initialVelocityX, initialVelocityY);
    }
    
    function Star(x, y, color, flicker, active){
        this.active = active;
        this.pos = new Vector2(x,y);
        this.color = color;
        this.flicker = flicker;
    }
	
	function Explosion(x, y, color1, color2, startSize, endSize, flicker, duration){
		this.pos = new Vector2(x, y);
		this.color1 = color1;
		this.color2 = color2;
		this.startSize = startSize;
		this.endSize = endSize;
		this.flicker = flicker;
		this.duration = duration;
		this.currentDuration = 0;
	}
    
    var game = {
        level: 1,
        score: 0,
        highScore: document.getElementById("scoreInput"),
        Stop: Stop
    }

    var screen = {
        ctx: undefined,
        size: new Vector2(document.body.offsetWidth, document.body.offsetHeight),
        ClearScreen: ClearScreen,
        backColor: '#000',
        mouse: new Vector2(0,0)
    };
    
    var space = {
        stars: {
            ammount: 0.1
        },
        asteroids: {
            ammount: 100
        }
    }
    
    var player = {
        alive: true,
        lifes: 5,
        name: "Test",
        color: '#F0F',
        physics: new PhysicObject(0,0,20,20,1,100,0,0),
        image: "Sprites/Ship1.png",
		speed: 70
    }
	
	var extras = {
		explosions: []
	}
	
	var deltaTime = 1;
    
    function Start() {
        var c = document.getElementById("mainCanvas");
        screen.ctx = c.getContext("2d");
        game.interval = setInterval(function () {Update()},5);
        
        c.height = screen.size.y;
        c.width = screen.size.x;
        
        window.addEventListener("keypress", KeyPressHandler);
        c.addEventListener("mousemove", MouseMove);
        
        CreateLevel(game.level);
    }
    
    function Stop(){
        Draw();
        DrawLose();
        game.highScore.className = "winDisplay";
        clearInterval(game.interval);
    }

    function Update() {
        
        Draw();
        
        MoveToMouse();
        
        UpdatePhysics();
        
        game.score++;
    }
    
    function UpdatePhysics(){
        for(var i = 0; i < space.asteroids.items.length; i++){
            var asteroid = space.asteroids.items[i];
            asteroid.pos.x += asteroid.velocity.x;
            asteroid.pos.y += asteroid.velocity.y;
            if(asteroid.pos.x > screen.size.x){
                asteroid.pos.x -= screen.size.x;
            }
            if(asteroid.pos.x < 0){
                asteroid.pos.x += screen.size.x;
            }
            if(asteroid.pos.y > screen.size.y){
                asteroid.pos.y -= screen.size.y;
            }
            if(asteroid.pos.y < 0){
                asteroid.pos.y += screen.size.y;
            }
            
            if(player.physics.pos.x < asteroid.pos.x && asteroid.pos.x < player.physics.pos.x + player.physics.size.x){
                if(player.physics.pos.y < asteroid.pos.y && asteroid.pos.y < player.physics.pos.y + player.physics.size.y){
                    player.lifes--;
					
					extras.explosions.push(new Explosion(space.asteroids.items[i].pos.x, space.asteroids.items[i].pos.y, '#F11', '#F91', 1, 10, true, 450));
					extras.explosions.push(new Explosion(space.asteroids.items[i].pos.x + GetRandom(-5,5), space.asteroids.items[i].pos.y + GetRandom(-5,5), '#F11', '#F91', 1 + GetRandom(0,3), 10 + GetRandom(-2,3), true, 450 + GetRandom(-100,200)));
					extras.explosions.push(new Explosion(space.asteroids.items[i].pos.x + GetRandom(-5,5), space.asteroids.items[i].pos.y + GetRandom(-5,5), '#F11', '#F91', 1 + GetRandom(0,3), 10 + GetRandom(-2,3), true, 450 + GetRandom(-100,200)));
                    space.asteroids.items.splice(i,1);
                    if(player.lifes <= 0){
                        player.alive = false;
                        game.Stop();
                    }
                }
            }
        }
    }
    
    function CreateLevel(level){
        space.asteroids.items = [];
        for(var i = 0; i < space.asteroids.ammount * level * 0.7; i++){
            space.asteroids.items.push(new PhysicObject(screen.size.x/2, screen.size.y/2, 5, 5, 10, 1, GetRandom(-5,5), GetRandom(-5,5)));
        }
    }
    
    function MoveToMouse(){
        player.physics.pos.x += (screen.mouse.x - player.physics.pos.x) * 0.02;
        player.physics.pos.y += (screen.mouse.y - player.physics.pos.y) * 0.02;
    }
    
    function Draw(){
        var d = new Date();
        var startD = d.getTime();
        screen.ClearScreen();        
        //screen.ctx.fillRect(10,10, screen.size.x, screen.size.y);        
        DrawStars();
        DrawAsteroids();
        DrawPlayer();
		DrawExplosions();
        
        d = new Date();
        var endD = d.getTime();
        
        DrawFPS();
        DrawScore();
        DrawLife();
		
		deltaTime = endD - startD;
    }
    
    function DrawLose(){
        screen.ctx.font = "50px sans-serif";
        screen.ctx.strokeText("F5 TO PLAY AGAIN", screen.size.x/2 - 150, screen.size.y/1.5, 300);
        screen.ctx.font = "10px sans-serif";
    }
    
    function DrawLife(){
        screen.ctx.fillStyle = '#0F0';
        screen.ctx.strokeStyle = '#0F0';
        screen.ctx.strokeText("LIFES: " + player.lifes, screen.size.x/2 - 75/2, 20, 75);
        
        //screen.ctx.globalAlpha = 0.1;
        screen.ctx.font = "50px Georgia";
        screen.ctx.strokeText(player.lifes, screen.size.x/2 - 10, screen.size.y/2, 100);
        screen.ctx.font = "10px sans-serif";
        
    }
    
    function DrawScore(){
        screen.ctx.fillStyle = '#0F0';
        screen.ctx.strokeStyle = '#0F0';
        screen.ctx.strokeText("SCORE: " + game.score, screen.size.x - 15 - 75, 20, 75);
    }
    
    function DrawFPS(){
        screen.ctx.fillStyle = '#0F0';
        screen.ctx.strokeStyle = '#0F0';
        var fps = Math.floor(1/(deltaTime/1000));
        screen.ctx.strokeText("FPS: " + fps, 15, 20, 75);
    }
    
    function DrawPlayer(){
        screen.ctx.fillStyle = player.color;
        //screen.ctx.drawImage(player.image, player.physics.pos.x, player.physics.pos.y);
        screen.ctx.fillRect(player.physics.pos.x,player.physics.pos.y, player.physics.size.x, player.physics.size.y);
    }
    
    function DrawAsteroids(){
        for(var i = 0; i < space.asteroids.items.length; i++){
            var asteroid = space.asteroids.items[i];
            var rand = GetRandom(0,3);
            if(rand < 1){
                screen.ctx.fillStyle = '#777';
            } else if(rand > 2){
                screen.ctx.fillStyle = '#DDD';
            } else {
                screen.ctx.fillStyle = '#F77';
            }
            
            screen.ctx.fillRect(asteroid.pos.x, asteroid.pos.y, asteroid.size.x, asteroid.size.y);
        }
    }
	
	function DrawExplosions(){
		for(var i = 0; i < extras.explosions.length; i++){
			var exp = extras.explosions[i];
			var rand = GetRandom(0,2);
			if(rand < 1){
				screen.ctx.fillStyle = exp.color1;
			} else {
				screen.ctx.fillStyle = exp.color2;
			}
			exp.currentDuration += deltaTime;
			if(exp.currentDuration > exp.duration){
				extras.explosions.splice(i,1);
			} else {
				var size = (exp.currentDuration * 100 / exp.duration) * (exp.endSize - exp.startSize) / 100 + exp.startSize;
				
				screen.ctx.beginPath();
				screen.ctx.arc(exp.pos.x, exp.pos.y, size, 0, 2*Math.PI);
				
				screen.ctx.globalAlpha = 0.7;
				screen.ctx.fill();
				screen.ctx.globalAlpha = 1;
			}
		}
	}
    
    function KeyPressHandler(key){
        //UP    38 87
        //DOWN  40 83
        //LEFT  37 65
        //RIGHT 39 68
        
        console.log(key);
        
        //UP
        if(key.keyCode == 38 || key.keyCode == 87){
            player.physics.pos.y -= player.speed * 1/deltaTime;
        }
        //DOWN
        if(key.keyCode == 40 || key.keyCode == 83){
            player.physics.pos.y += player.speed * 1/deltaTime;
        }
        //LEFT
        if(key.keyCode == 37 || key.keyCode == 65){
            player.physics.pos.x -= player.speed * 1/deltaTime;
        }
        //RIGHT
        if(key.keyCode == 39 || key.keyCode == 68){
            player.physics.pos.x += player.speed * 1/deltaTime;
        }
        
    }
    
    function MouseMove(mouse){
        screen.mouse.x = mouse.clientX;
        screen.mouse.y = mouse.clientY;
    }
    
    function ClearScreen() {
        screen.ctx.globalAlpha = 0.3;
        screen.ctx.fillStyle = '#111';
        screen.ctx.fillRect(0, 0, screen.size.x, screen.size.y);
        screen.ctx.globalAlpha = 1;
    }
    
    function DrawStars(){
        if(space.stars.items == undefined){
            space.stars.items = [];
        }
        for(var x = 0; x < screen.size.x; x++){
            for(var y = 0; y < screen.size.y; y++){
                if(space.stars.items.length < screen.size.x*screen.size.y){
                    var rand = GetRandom(0,100);
                    var place = false;
                    var flicker = 0;
                    if(rand < space.stars.ammount){
                        //screen.ctx.fillRect();
                        var randflicker = GetRandom(0,7);
                        flicker = true;
                        if(randflicker > 1){
                            flicker = false;
                        }
                            
                        place = true;
                    }
                    
                    space.stars.items.push(new Star(x,y,'#fff', flicker, place));
                    
                } else {
                    var star = space.stars.items[screen.size.x * x + y];
                    if(star != undefined && star.active){
                        screen.ctx.fillStyle = star.color;
                        if(star.flicker){
                            flicker = GetRandom(0,7);
                            if(flicker > 4){
                                flicker = 1;
                            }
                        }
                        screen.ctx.fillRect(star.pos.x, star.pos.y, 1, 1);
                    }
                }
            }
        }
    }
    
    
    function GetRandom(from, to){
        return Math.random() * (to-from) + from;
    }
    
    
    Start();
})();