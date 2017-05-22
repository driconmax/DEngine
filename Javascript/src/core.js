(function(window){

    'use strict';

    var $e = new function(){
        var debug = false;
        var started = false;
        var canvas;
        var ctx;
        var time = {
            FPS: 1,
            maxFPS: 60,
            deltaTime: 1,
            miliseconds: 0
        }
        var controlVars = {
            update: {
                finish: false,
                exceeded: 0,
                alert: 50,
                alerted: false
            },
            start: false
        }; 
        var phycs = [];
        var user = {};

        this.init = function(canvas, start, update){
            if(canvas != undefined && typeof canvas == "object"){
                if(typeof start == "function" && typeof update == "function"){
                    try {
                        ctx = canvas.getContext("2d");
                        user.start = start;
                        user.udpate = update;
                        Start();
                        started = true;
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
                time.maxFPS = value;
            } else {
                $d.LogError("Invalid value");
            }
        }

        this.setDebug = function(value){
            if(typeof value == "boolean"){
                debug = value;
            } else {
                $d.LogError("Invalid value");
            }
        }

        function Start(){
            var that = this;
            time.interval = setInterval(function(){
                if(this.controlVars.update.finish){
                    that.controlVars.update.finish = false;
                    that.controlVars.update.alerted = false;
                    that.controlvars.update.exceeded = 0;
                    
                    var d = new Date().getTime();
                    that.time.deltaTime = (d - that.time.miliseconds)/1000;
                    that.time.miliseconds = d;
                    that.time.FPS = 1/that.time.deltaTime;
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
