(function(window){

    'use strict';

    var $e = new function(){
        var internal = {
            debug: false,
            started: false,
            canvas,
            ctx,
            time: {
                FPS: 1,
                maxFPS: 60,
                deltaTime: 1,
                miliseconds: 0
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
            phycs: [],
            user: {}
        }

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

        function Start(){
            var that = this;
            internal.time.interval = setInterval(function(){
                if(internal.controlVars.update.finish){
                    internal.controlVars.update.finish = false;
                    internal.controlVars.update.alerted = false;
                    internal.controlvars.update.exceeded = 0;
                    
                    var d = new Date().getTime();
                    internal.time.deltaTime = (d - that.time.miliseconds)/1000;
                    internal.time.miliseconds = d;
                    internal.time.FPS = 1/that.time.deltaTime;
                    Update();
                } else {
                    that.controlvars.update.exceeded++;
                    if(that.controlvars.update.exceeded >= that.controlVars.update.alert){
                        $d.LogWarning("Loosing frames, consider using a lower maxFPS value or reivew your code.");
                        that.controlVars.update.alerted = true;
                    }
                }
            }, 1000/time.maxFPS);
        }

        function Update(){
            user.udpate();
            controlVars.update = true;
        }



    }

    window.$e = $e;


})(window)
