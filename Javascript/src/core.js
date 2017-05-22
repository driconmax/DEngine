(function(window){

    'use strict';

    var $e = new function(){
        
        var internal = {
            debug: true,
            started: false,
            canvas: "",
            ctx: "",
            size: 0,
            time: {
                FPS: 1,
                lossedFrames: 0,
                maxFPS: 60,
                deltaTime: 1,
                startTime: 0,
                elapsedTime: 0,
                miliseconds: 0,
                speed: 1
            },
            controlVars: {
                update: {
                    finish: false,
                    exceeded: 0,
                    alert: 50,
                    alerted: false
                },
                start: false
            },
            world: {
                gravity: 10,
                drag: 1
            },
            globals: {
                maxForce: 150,
                opacity: 0.8,
                background: "#FFF"
            },
            layers: [],
            phycs: [],
            user: {}
        }
        
        //Public Functions start

        this.init = function(canvas, start, update){
            if(canvas != undefined && typeof canvas == "object"){
                if(typeof start == "function" && typeof update == "function"){
                    try {
                        internal.ctx = canvas.getContext("2d");
                        internal.size = new this.Vector2(0,0);
                        internal.size.x = canvas.width;
                        internal.size.y = canvas.height;
                        internal.user.start = start;
                        internal.user.udpate = update;
                        Start();
                        internal.started = true;
                    } catch (e) {
                        $d.LogError("The element is not a canvas");
                    }
                } else {
                    $d.LogError("Missing Start/Update functions");
                }
            } else {
                $d.LogError("Invalid element");
            }
        }
        
        this.setMaxFPS = function(value){
            if(typeof value == "number"){
                internal.time.maxFPS = value;
            } else {
                $d.LogError("Invalid value");
            }
        }

        this.setDebug = function(value){
            if(typeof value == "boolean"){
                internal.debug = value;
            } else {
                $d.LogError("Invalid value");
            }
        }
        
        this.setSpeed = function(value){
            if(typeof value == "number"){
                internal.time.speed = value;
            } else {
                $d.LogError("Invalid value");
            }
        }
        
        this.stats = function(){
            $d.Log("STATS");
            $d.Log("FPS: " + internal.time.FPS);
            $d.Log("Current state: " + ((internal.started)? "Running" : "Stopped"));
            $d.Log("Frame loss count: " + internal.time.lossedFrames);
            $d.Log("Elapsed Time: " + $d.FormatMiliseconds(internal.time.elapsedTime));
            $d.Stats();
        }
        
        this.add2DObject = function(obj, layer){
            var ind = internal.phycs.push(obj);
            internal.layers[layer+50] = internal.phycs[ind-1];
        }
        
        //close
        
        //Private functions start

        function Start(){
            internal.controlVars.update.finish = true;
            var sd = new Date().getTime();
            internal.time.miliseconds = sd;
            
            internal.time.interval = setInterval(function(){
                if(internal.controlVars.update.finish){
                    internal.controlVars.update.finish = false;
                    internal.controlVars.update.alerted = false;
                    internal.controlVars.update.exceeded = 0;
                    
                    var d = new Date().getTime();
                    var t = d - internal.time.miliseconds;
                    internal.time.elapsedTime += t;
                    internal.time.deltaTime = (t/1000) * internal.time.speed;
                    internal.time.miliseconds = d;
                    internal.time.FPS = 1/internal.time.deltaTime;
                    Update();
                } else {
                    internal.controlVars.update.exceeded++;
                    internal.time.lossedFrames++;
                    if(internal.controlVars.update.exceeded >= internal.controlVars.update.alert){
                        $d.LogWarning("Loosing frames, consider using a lower maxFPS("+internal.time.FPS+") value or reivew your code.");
                        internal.controlVars.update.alerted = true;
                    }
                }
            }, 1000/internal.time.maxFPS);
        }

        function Update(){
            try{
                internal.user.udpate();    
            } catch(e){
                $d.LogError("Error in User Update function", e);
            }
            UpdatePhysics();
            DrawObjects();
            internal.controlVars.update.finish = true;
        }
        
        function UpdatePhysics(){
            var tempObj;
            var tempForce;
            for(var i = 0; i < internal.phycs.length; i++){
                tempObj = internal.phycs[i];
                tempForce = tempObj.force.x;
                tempObj.pos.x += tempForce/tempObj.mass * internal.time.deltaTime;
                
                tempForce = tempObj.force.y;
                tempObj.pos.y += tempForce/tempObj.mass * internal.time.deltaTime;
                if(tempObj.forceType == 0){
                    if(tempObj.force.x > 0){
                        tempObj.force.x -= tempObj.drag * internal.time.deltaTime;
                    } else {
                        tempObj.force.x = 0;
                    }
                    if(Math.abs(tempObj.force.y) < internal.globals.maxForce){
                        tempObj.force.y -= internal.world.gravity * internal.time.deltaTime;
                        //tempObj.force.y = tempObj.force.y/drag;
                    } else {
                        tempObj.force.y = internal.globals.maxForce * ((tempObj.force.y < 0)? -1 : 1);
                    }
                }
            }
        }
        
        function DrawObjects(){
            for(var i = 0; i < internal.layers.length; i++){
                Draw(internal.layers[i]);
            }
        }
        
        function Draw(obj){
            internal.ctx.globalAlpha = internal.globals.opacity;
            internal.ctx.fillStyle = internal.globals.background;
            internal.ctx.fillRect(0,0,internal.size.x, internal.size.y);
            internal.ctx.globalAlpha = 1;
            if(internal.debug){
                internal.ctx.fillStyle = obj.color;
                internal.ctx.fillRect(obj.pos.x, internal.size.y - obj.pos.y, 10, 10);
                $d.Log("X: " + obj.pos.x + "\tY: " + obj.pos.y);
            }
        }

        //close
        
        //DEngine Objects start
        
        this.Vector2 = function(x, y){
            this.x = x;
            this.y = y;
        }
        
        this.Object2D = function(name, x, y, mass, drag){
            this.name = name;
            this.pos = new $e.Vector2(x,y);
            this.mass = mass;
            this.drag = drag;
            this.force = new $e.Vector2(0,0);
            this.forceType = 0;
            this.color = "#000";
        }
        
        //close

    }

    window.$e = $e;


})(window)
