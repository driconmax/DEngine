(function(window){

    'use strict';

    var $e = new function(){
        
        var internal = {
            debug: false,
            started: false,
            canvas: "",
            ctx: "",
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
            phycs: [],
            user: {}
        }
        
        //Public Functions start

        this.init = function(canvas, start, update){
            if(canvas != undefined && typeof canvas == "object"){
                if(typeof start == "function" && typeof update == "function"){
                    try {
                        internal.ctx = canvas.getContext("2d");
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
            internal.controlVars.update.finish = true;
        }
        
        function UpdatePhysics(){
            
        }

        //close
        
        //DEngine Objects start
        
        
        
        //close

    }

    window.$e = $e;


})(window)
