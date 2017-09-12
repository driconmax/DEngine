/*
#DSV:0.5#
Collision Response - http://elancev.name/oliver/2D%20polygon.htm
*/
/**
 * @file DEngine - Physics Engine for Javascript
 * @author Driconmax <driconmax@gmail.com>
 * @version 1.0
 * @todo Constrains, Convex Colliders, Multiplayer,
 *
 * @module $e
*/

(function(window){

    'use strict';

    /**
    * The DEngine
    */
    var $e = new function(){

        const vbn = 1000000;
        const vln = 1/vbn;

        var constants = {
            //g: 6674*Math.pow(10,-11)
            g: 0.01
        };

        var internal = {
            debug: true,
            catchup: false,
            started: false,
            canvas: "",
            ctx: "",
            textcolor: 'black',
            size: 0,
            time: {
                FPS: 1,
                FPScount: 0,
                FPSsum: 0,
                lossedFrames: 0,
                maxFPS: 60,
                minFPS: 20,
                deltaTime: 1,
                startTime: 0,
                behindTime: 0,
                elapsedTime: 0,
                miliseconds: 0,
                speed: 1, //Multiplier
                catchUpTime: 1/8, //S
                intervalClear: 10000, //MS
                elapsedLastClear: 0, //MS
                intervalRestartDelay: 40 //MS
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
            debugVars: [],
            console: {
                history: [],
                border: false,
                font: '7pt Calibri',
                color: 'black'
            },
            world: {
                gravity: 10,
                drag: 1
            },
            globals: {
                maxForce: 150,
                opacity: 0.9,
                background: "#FFF"
            },
            mouse: {
                over: undefined,
                selected: [],
                obj: undefined,
                click: {
                    left: false,
                    middle: false,
                    right: false
                }
            },
            camera: {
                zoom: 1
            },
            inputs: {},
            layers: [],
            phycs: [],
            threads: {
                phx: {
                    obj: undefined,
                    msgTail: []
                },
                msgId: 0,
                cbTail: {} //id,cb
            },
            user: {}
        };

        //Public Functions start

        /**
        * Starts the engine
        *
        * @param  {element} canvas The html element of the canvas
        * @param  {function} start  The user function to be called when the engine starts
        * @param  {function} update The user function to be called on each frame
        */
        this.init = function(canvas, start, update){
            if(!internal.started){
                if(canvas != undefined && typeof canvas == "object"){
                    if(typeof start == "function" && typeof update == "function"){
                        try {
                            internal.canvas = canvas;
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
            } else {
                $d.LogWarning("The engine is already running!");
            }
        };

        this.setTextColor = function(value){
            if($d.ValidateInput(arguments, ["string"])){
                internal.textcolor = value;
            }
        }

        /**
         * Sets the main camera zoom
         * @param {number} value Zoom value
         */
        this.setZoom = function(value){
            if($d.ValidateInput(arguments, ["number"])){
                if(value > 0){
                    internal.camera.zoom = value;
                } else {
                    $d.LogError("The camera Zoom need to be less than 0");
                }
            }
        }

        /**
        * Sets the maximum fps of the engine
        *
        * @param  {number} value MAX FPS
        */
        this.setMaxFPS = function(value){
            if($d.ValidateInput(arguments, ["number"])){
                internal.time.maxFPS = value;
            }
        };

        /**
        * Enables the debug mode
        *
        * @param  {boolean} value On/Off
        */
        this.setDebug = function(value){
            if($d.ValidateInput(arguments, ["boolean"])){
                internal.debug = value;
            }
        };

        /**
        * Sets the speed of the engine (Default: 1)
        *
        * @param  {type} value Speed value
        */
        this.setSpeed = function(value){
            if($d.ValidateInput(arguments, ["number"])){
                internal.time.speed = value;
            }
        };

        /**
        * Sets the gravity for the physics calcs (Default: 9.98)
        *
        * @param  {number} value The gravity aceleration
        */
        this.setGravity = function(value){
            if($d.ValidateInput(arguments, ["number"])){
                internal.world.gravity = value;
                internal.threads.phx.msgTail.push({
                    fn: 'SetGravity',
                    value: internal.world.gravity
                });
            }
        };

        /**
        * Enables the Catch Up function. This function checks if the engine is running slower than the expected speed and tryies to catch up with the expected main timeline
        *
        * @param  {boolean} value On/Off
        */
        this.setCatchUp = function(value){
            if($d.ValidateInput(arguments, ["boolean"])){
                internal.catchUp = value;
            }
        };

        /**
        * Sets the background color (Default: #FFF)
        *
        * @param  {number} value The Color in HEX
        */
        this.setBackground = function(value){
            if($d.ValidateInput(arguments, ["string"])){
                internal.globals.background = value;
            }
        };

        /**
        * Prints the actual engine stats
        */
        this.stats = function(){
            $d.Log("STATS");
            $d.Log("FPS: " + internal.time.FPS);
            $d.Log("Current state: " + ((internal.started)? "Running" : "Stopped"));
            $d.Log("Frame loss count: " + internal.time.lossedFrames);
            $d.Log("Elapsed Time: " + $d.FormatMiliseconds(internal.time.elapsedTime));
            $d.Stats();
        };

        /**
        * Adds a Object2D to the engine in a specified layer
        *
        * @param  {Object2D} The Object2D
        * @param  {number} layer The layer of the object (-50 to 50)
        */
        this.add2DObject = function(obj, layer){
            if($d.ValidateInput(arguments, ["object","number"])){
                if(internal.layers[layer+50] == undefined){
                    internal.layers[layer+50] = [];
                }
                obj.id = internal.layers[layer+50].push(obj);
                obj.layer = layer;
            }
        };

        /**
        * Adds an object to the debug console
        *
        * @param  {string} name     Name to be displayed
        * @param  {object} obj      The object
        * @param  {string[]} vars     The vars that are going to be debugged
        * @param  {number} duration The duration in scren of the Debbug in seconds
        */
        this.addDebugObject = function(name, obj, vars, duration){
            if($d.ValidateInput(arguments, ["string","object","array[string]"],["number"])){
                internal.debugVars.push({
                    name: name,
                    obj: obj,
                    vars: vars,
                    duration: duration
                });
            }
        };

        /**
        * Writes a message to the debug console
        *
        * @param  {string} string Message
        * @param  {number} type   Type of message
        */
        this.writeDebugConsole = function(string, type){
            internal.console.history.push({name: string, type: type});
        };

        /**
        * Checks if the key is pressed
        * 
        * @param  {string}   keyCode The Key Code
        * @return {bool}             Status of the key
        */
        this.getKey = function(keyCode){
            if(internal.inputs[keyCode] != undefined){
                return internal.inputs[keyCode];
            }
            return false;
        }

        //close

        //Private functions start

        function Start(){
            internal.controlVars.update.finish = true;
            var sd = new Date().getTime();
            internal.time.miliseconds = sd;
            //internal.mouse.obj = new $e.Vector2(0,0);

            //Creates a new console
            internal.console.size = new $e.Vector2(50,50);
            internal.console.position = new $e.Vector2(internal.size.x - internal.console.size.x,0);

            //Creates the object for the mouse position
            internal.mouse.obj = new $e.Object2D("Mouse", new $e.Vector2(0, 0), 1, 1, 1);
            internal.mouse.obj.setCollider(new $e.BoxCollider(0.1,0.1), true);

            internal.camera.obj = new $e.BaseObject2D("MainCamera", new $e.Vector2(0,0));

            internal.canvas.addEventListener('mousemove', function(evt) {
                UpdateMousePos(internal.canvas, evt);
            }, false);

            internal.canvas.addEventListener("mousedown", function(evt) {
                UpdateMouseAction(evt, true);
            });

            internal.canvas.addEventListener("mouseup", function(evt) {
                UpdateMouseAction(evt, false);
            });

            window.addEventListener("keydown", function(evt){
                UpdateInputs(evt, true)
            });
            
            window.addEventListener("keyup", function(evt){
                UpdateInputs(evt, false)
            });

            window.addEventListener("mousewheel", function(evt){
                UpdateInputs({ code: "mousewheel" }, evt.wheelDeltaY);
                evt.preventDefault();
            })

            internal.time.interval = StartInterval();
            try{
                internal.user.start({
                    FPS: internal.time.FPS,
                    deltaTime: internal.time.deltaTime,
                    totalTime: internal.time.elapsedTime,
                    selected: internal.mouse.selected,
                    over: internal.mouse.over,
                    screenSize: internal.size,
                    mouse: {
                        pos: internal.mouse.obj.getPos()
                    },
                    camera: internal.camera.obj,
                    zoom: internal.camera.zoom,
                    objects: internal.layers
                });
            } catch(e){
                $d.LogError("Error in User Start function", e);
            }

            internal.threads.phx.obj = new Worker('src/physics.js');

            internal.threads.phx.msgTail.push({
                fn: 'SetGravity',
                value: internal.world.gravity
            });

            internal.threads.phx.msgTail.push({
                fn: 'Start',
                phycs: internal.phycs,
                extra: {
                    cb: function(){
                        if(msg.data != undefined){
                            internal.phycs = msg.data;
                        }
                    }
                }
            });

            internal.threads.phx.obj.onchange = SendThreadMessages(internal.threads.phx);
            internal.threads.phx.obj.onmessage = ProcessThreadMessages(msg);
        }

        function SendThreadMessages(thread){
            for (var i = 0; i < thread.msgTail.length; i++) {
                if(thread.msgTail[i].extra != undefined && thread.msgTail[i].extra.cb != undefined){
                    thread.msgTail[i].id = "CBI" + internal.threads.msgId++;
                    internal.threads.cbTail[thread.msgTail[i].id] = thread.msgTail[i].extra.cb;
                }
                thread.obj.postMessage(thread.msgTail[i]);
            }
        }

        function ProcessThreadMessages(msg){
            if(internal.threads.cbTail[msg.id] != undefined){
                internal.threads.cbTail[msg.id]();
                if(msg.expd){
                    delete internal.threads.cbTail[msg.id];
                }
            }            
        }

        function StartInterval(){
            return setInterval(function(){
                if(internal.controlVars.update.finish){
                    internal.controlVars.update.finish = false;
                    internal.controlVars.update.alerted = false;
                    internal.controlVars.update.exceeded = 0;

                    var d = new Date().getTime();
                    var t = d - internal.time.miliseconds;
                    internal.time.elapsedTime += t;
                    internal.time.elapsedLastClear += t;
                    internal.time.deltaTime = (t/1000) * internal.time.speed;
                    internal.time.miliseconds = d;
                    internal.time.FPS = 1/(internal.time.deltaTime/internal.time.speed);
                    internal.time.FPSsum += internal.time.FPS;
                    internal.time.FPScount++;
                    if(internal.time.FPS > 0 && internal.time.FPS < internal.time.minFPS){
                        if(internal.catchUp){
                            $d.LogWarning("Running behind the main timeline ("+(internal.time.FPS+internal.time.behindTime)+" seconds) trying to catch up at " + internal.time.catchUpTime + " seconds per frame.");
                        }
                        internal.time.behindTime += internal.time.deltaTime;
                        internal.time.deltaTime = 1/internal.time.minFPS;
                    } else {
                        if(internal.time.behindTime > 0){
                            if(internal.catchUp){
                                if(internal.time.behindTime < internal.time.catchUpTime){
                                    internal.time.deltaTime += internal.time.behindTime * internal.time.speed;
                                    internal.time.behindTime = 0;
                                    $d.LogWarning("Main timeline reached.");
                                } else {
                                    internal.time.deltaTime += internal.time.catchUpTime * internal.time.speed;
                                    internal.time.behindTime -= internal.time.catchUpTime * internal.time.speed;
                                }
                            }
                        }

                    }
                    if(internal.time.elapsedLastClear >= internal.time.intervalClear){
                        internal.time.elapsedLastClear = 0;
                        clearInterval(internal.time.interval);
                        ReStartInterval();
                    } else {
                        Update();
                    }
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

        function ReStartInterval(){
            setTimeout(function(){
                internal.controlVars.update.finish = true;
                internal.time.interval = StartInterval();
            }, internal.time.intervalRestartDelay);
        }

        function Update(){
            try{
                internal.user.udpate({
                    FPS: internal.time.FPS,
                    deltaTime: internal.time.deltaTime,
                    totalTime: internal.time.elapsedTime,
                    selected: internal.mouse.selected,
                    over: internal.mouse.over,
                    screenSize: internal.size,
                    mouse: {
                        pos: internal.mouse.obj.getPos()
                    },
                    camera: internal.camera.obj,
                    zoom: internal.camera.zoom,
                    objects: internal.layers
                });
                internal.inputs["mousewheel"] = 0;
            } catch(e){
                $d.LogError("Error in User Update function", e);
            }
            //UpdatePhysics();
            DrawObjects();
            //DrawFPS();
            DrawMousePosition();
            DrawDebug();
            DrawConsole();
            internal.controlVars.update.finish = true;
        }

        function DrawFPS(){
            internal.ctx.font = "12px Arial";
            internal.ctx.fillStyle = "#000";
            //internal.ctx.fillText("FPS: " + Math.ceil(internal.time.FPSsum / internal.time.FPScount),10,10);
            internal.ctx.fillText("FPS: " + Math.round(internal.time.FPS),10,10);
        }

        function DrawMousePosition(){
            var msg = 'Mouse position: ' + internal.mouse.obj.getPos().toString(0);
            internal.ctx.font = '8pt Calibri';
            internal.ctx.fillStyle = internal.textcolor;
            internal.ctx.fillText(msg, 10, 25);
        }

        function DrawConsole(){

        }

        function DrawDebug(){
            var offset = 0;
            for(var i = internal.debugVars.length - 1; i >= 0; i--){
                if(internal.debugVars[i].duration == undefined || internal.debugVars[i].duration > 0){
                    var finalObj = internal.debugVars[i].obj;
                    for(var x = 0; x < internal.debugVars[i].vars.length; x++){
                        finalObj = finalObj[internal.debugVars[i].vars[x]];
                    }
                    var msg = "";
                    if(finalObj.x != undefined){
                        msg = internal.debugVars[i].name + ":\t" + finalObj.toString(2);
                    } else {
                        msg = internal.debugVars[i].name + ":\t" + finalObj;
                    }
                    internal.ctx.font = '7pt Calibri';
                    internal.ctx.fillStyle = 'black';
                    internal.ctx.fillText(msg, 10, internal.size.y - 10*(internal.debugVars.length - i - offset));
                    if(internal.debugVars[i].duration != undefined){
                        internal.debugVars[i].duration--;
                    }
                } else {
                    offset++;
                }
            }
        }

        function UpdateMousePos(canvas, evt) {
            var rect = canvas.getBoundingClientRect();
            internal.mouse.obj.setPos(new $e.Vector2((evt.clientX - rect.left + internal.camera.obj.getPos().x) * (1/internal.camera.zoom), (internal.size.y - evt.clientY + rect.top - internal.camera.obj.getPos().y) * (1/internal.camera.zoom)));
            
            internal.threads.phx.msgTail.push({
                fn: 'CheckCollision',
                obj: internal.mouse.obj,
                cb: function(msg){
                    internal.mouse.over = msg;
                }
            });
        }

        function UpdateMouseAction(evt, active){
            switch(evt.button){
                case 0:
                    internal.mouse.click.left = active;
                    internal.inputs.ClickLeft = active;
                    if(active){
                        if(internal.mouse.over != undefined){
                            if(internal.mouse.over.collider.selectable){
                                if(evt.shiftKey){
                                    var ind = internal.mouse.selected.indexOf(internal.mouse.over);
                                    if(ind != -1){
                                        var last = internal.mouse.selected.slice(ind+1);
                                        internal.mouse.selected.splice(0,ind);
                                        for(var i = 0; i < last.length; i++){
                                            internal.mouse.selected.push(last[i]);
                                        }
                                    } else {
                                        internal.mouse.selected.push(internal.mouse.over);
                                    }
                                } else {
                                    internal.mouse.selected = [internal.mouse.over];
                                }
                            }
                        } else {
                            internal.mouse.selected = [];
                        }
                    }
                    break;
                case 1:
                    internal.mouse.click.middle = active;
                    internal.inputs.ClickMiddle = active;
                    break;
                case 2:
                    internal.mouse.click.right = active;
                    internal.inputs.ClickRight = active;
                    break;
                default:
                    break;
            }
        }

        function UpdateInputs(evt, press){
            if(evt.code == "mousewheel"){
                internal.inputs[evt.code] += press;
            } else {
                internal.inputs[evt.code] = press;
            }
            if(evt.code != "F11")
                if(evt.preventDefault != undefined)
                    evt.preventDefault();
        }

        function DrawObjects(){
            internal.size.x = internal.ctx.canvas.width = internal.canvas.clientWidth;
            internal.size.y = internal.ctx.canvas.height = internal.canvas.clientHeight;
            internal.ctx.globalAlpha = internal.globals.opacity;
            internal.ctx.fillStyle = internal.globals.background;
            internal.ctx.fillRect(0,0,internal.size.x, internal.size.y);
            internal.ctx.globalAlpha = 1;
            for(var i = 0; i < internal.layers.length; i++){
                for(var f = 0; f < internal.layers[i].length; f++){
                    //var timeoutTime = 1000*(i+1)*(f+1);
                    //$d.Log(timeoutTime);
                    //setTimeout(Draw(internal.layers[i][f]), timeoutTime);
                    Draw(internal.layers[i][f]);
                }
            }
        }

        function Draw(obj){
            if(internal.debug){
                internal.ctx.fillStyle = obj.color;
                var tv = new $e.Vector2((obj.getPos().x-internal.camera.obj.getPos().x) * internal.camera.zoom + (internal.size.x *  internal.camera.zoom / 2), (internal.size.y - obj.getPos().y + internal.camera.obj.getPos().y) * internal.camera.zoom + (internal.size.y * internal.camera.zoom / 2));
                tv.toFixed(0);
                //internal.ctx.translate(tv.x, tv.y);
                internal.ctx.setTransform(internal.camera.zoom,0,0,internal.camera.zoom,tv.x,tv.y);
                var rot = obj.rotation * Math.PI / 180;
                internal.ctx.rotate(-rot);
                if(internal.mouse.over == obj){
                    internal.ctx.shadowBlur = 2;
                    internal.ctx.shadowColor = "#3c84c1";
                }
                if(obj.texture != undefined){
                    internal.ctx.drawImage(obj.texture.getTexture(), -obj.texture.size.x/2, -obj.texture.size.y/2, obj.texture.size.x, obj.texture.size.y);
                } else {
                    if(obj.collider.type == 1){
                        //internal.ctx.arc(0, 0, obj.collider.radius/4, 0, 2*Math.PI);
                        //internal.ctx.fill();
                        internal.ctx.fillRect(- 10/2, - 10/2, 10, 10);
                    } else {
                        internal.ctx.fillRect(- 10/2, - 10/2, 10, 10);
                    }
                }

                if(internal.debug){
                    internal.ctx.globalAlpha = 0.1;
                    internal.ctx.fillStyle = "#F22";
                    internal.ctx.beginPath();
                    internal.ctx.arc(obj.pivot.x, -obj.pivot.y, 5, 0, 2*Math.PI);
                    internal.ctx.fill();
                    internal.ctx.globalAlpha = internal.globals.opacity;
                    if(obj.collider != undefined) {
                        internal.ctx.beginPath();
                        if(obj.collider.type == 1){
                            internal.ctx.arc(0, 0, obj.collider.radius, 0, 2*Math.PI);
                        } else {
                            internal.ctx.moveTo(obj.collider.vertexs[obj.collider.vertexs.length-1].x, obj.collider.vertexs[obj.collider.vertexs.length-1].y);
                            for(var i = 0; i < obj.collider.vertexs.length; i++){
                                internal.ctx.lineTo(obj.collider.vertexs[i].x, obj.collider.vertexs[i].y);
                            }
                        }
                        //internal.ctx.strokeStyle = '#0F4';

                        internal.ctx.strokeStyle = '#F00';
                        internal.ctx.stroke();
                        internal.ctx.fillStyle = "#FA0";
                        if(obj.collider.contactPoint != undefined){
                            internal.ctx.fillRect(obj.collider.vertexs[obj.collider.contactPoint].x - 2, (obj.collider.vertexs[obj.collider.contactPoint].y) - 2, 4, 4);
                        }
                    }
                }
                internal.ctx.rotate(rot);
                internal.ctx.font = '6pt Calibri';
                internal.ctx.fillStyle = internal.textcolor;
                internal.ctx.fillText(obj.name, 0, 0);
                //internal.ctx.translate(-tv.x, -tv.y);
                internal.ctx.setTransform(1,0,0,1,0,0);
                internal.ctx.shadowBlur = 0;
                //$d.Log(obj.name + "\tX: " + obj.getPos().x + "\tY: " + obj.getPos().y);
            }
        }

        //close

        //DEngine Objects start

        /**
        * Vector2 - Creates a new 2 dimensional Vector
        *
        * @constructor
        * @param  {number} x X axis position
        * @param  {number} y Y axis position
        */
        this.Vector2 = function(x, y){
            this.x = x;
            this.y = y;
        };

        /**
         * Texture - Creates a Texture object with optional animations
         * @class
         * 
         * @param {string}      name The name of the texture
         * @param {string[]}    srcs The paths to all the textures
         * @param {Vector2}     size The size of the texture
         * @param {number}      time The duration of the animation
         * @param {bool}        loop Set to make a loo
         */
        this.Texture = function(name, srcs, size, time, loop){
            this.name = name;
            this.loop = loop;
            this.time = time;
            this.size = size;

            this.img = [];
            for(var i = 0; i < srcs.length; i++){
                var tempImg = new Image();
                tempImg.src = srcs[i];
                this.img.push(tempImg);
            }

            this.counter = 0;
            this.frameTime = time / this.img.length;
        };

        /**
         * Texture.getTexture - Returns the current Texture.
         * @return {image} The image element
         */
        this.Texture.prototype.getTexture = function(){
            if(this.img.length == 1){
                return this.img[0];
            }
            this.counter += internal.time.deltaTime * 1000;
            if(this.counter > this.time){
                this.counter = 0;
            }
            var ret = this.img[Math.floor(this.counter/this.frameTime)];
            return ret;
        };

        /**
        * BaseObject2D - Base class of Object2D without all the physics properties
        * @class
        * 
        * @param {string} name Name
        * @param {Vector2} pos Position
        *
        * @property     {number}    id                  Internal ID
        * @property     {string}    name                Object's name
        * @property     {Vector2}   posOrigin           Original Positon
        * @property     {Vector2}   scale               Scale
        * @property     {number}    rotation            Rotation
        * @property     {Vector2}   pivot               Rotation Pivot
        * @property     {BaseObject2D}  lookAtTarget        Target look at
        * @property     {Vector2}   lookAtOffset        Offset pivot on target look at
        * @property     {string}    color               Color
        * @property     {number}    layer               Layer
        * @property     {BaseObject2D}  parent              Parent Object. If set, the position is relative to the parent
        * @property     {BaseObject2D[]}  childs              Childs Objects
        */
        this.BaseObject2D = function(name, pos){
            this.id = -1;
            this.name = name;
            //this.pos = pos.clone();
            //this.posOrigin = this.pos.clone();
            this.posOrigin = pos.clone();
            this.scale = new $e.Vector2(1,1);
            this.rotation = 0;
            this.pivot = new $e.Vector2(0,0);
            this.lookAtTarget = undefined;
            this.lookAtOffset = 0;
            this.color = "#DDD"; 
            this.layer = -99;
            this.parent = null;
            this.childs = [];
        };

        /**
        * Object2D - Creates a new Object2D that extends BaseObject2D with Physics properties
        * @class
        * @augments BaseObject2D
        *
        * @constructor
        * @param  {string} name   Name
        * @param  {Vector2} pos    Start position
        * @param  {number} mass   Mass
        * @param  {number} drag   Drag
        * @param  {number} angularDrag   Angular Drag
        * @param  {number} bounce Bounce factor
        * @param  {bool} [newtonian=false] Newtonian object (Atracts other bodys based on it's mass)
        *
        * @property     {number}    id                  Internal ID
        * @property     {string}    name                Object's name
        * @property     {Vector2}   posOrigin           Original Positon
        * @property     {Vector2}   scale               Scale
        * @property     {number}    rotation            Rotation
        * @property     {Vector2}   pivot               Rotation Pivot
        * @property     {bool}      kinematic           Kinematic Object (not affected by physics)
        * @property     {number}    mass                Mass
        * @property     {bool}      newtonian           Newtonian Object (Orbits, atracts other bodies)
        * @property     {number}    drag                Drag
        * @property     {number}    angularDrag         Angular Drag
        * @property     {number}    bounce              Coeficient of Restitution 
        * @property     {number}    angularVelocity     Angular Velocity
        * @property     {Object2D}  lookAtTarget        Target look at
        * @property     {Vector2}   lookAtOffset        Offset pivot on target look at
        * @property     {Vector2}   velocity            Current Velocity
        * @property     {number}    force               Force pending to apply
        * @property     {string}    color               Color
        * @property     {number}    collisions          Number of current collisions
        * @property     {number}    layer               Layer
        * @property     {Object2D}  parent              Parent Object. If set, the position is relative to the parent
        */
        class Object2D extends this.BaseObject2D {
            constructor(name, pos, mass, drag, angularDrag, bounce, newtonian){
                super(name, pos);
                this.kinematic = (mass == 0);
                this.mass = ((mass == 0)? 1 : mass);
                this.newtonian = (newtonian == undefined)? false : newtonian;
                this.drag = drag;
                this.angularDrag = angularDrag;
                this.bounce = bounce;
                this.setInertia(1);
                this.angularVelocity = 0;
                this.velocity = new $e.Vector2(0,0);
                this.force = new $e.Vector2(0,0);
                this.collisions = 0;
            }
        }

        /**
         * BaseObject2D.prototype.getPos - Returns the object position
         * @return {Vector2} A Vector2 Representing the Object position
         */
        this.BaseObject2D.prototype.getPos = function(){
            if(this.parent != null){
                return this.posOrigin.sum(this.parent.getPos());    
            } else {
                return this.posOrigin;
            }
        };

        /**
         * BaseObject2D.prototype.setPos - Sets the position of the BaseObject2D
         * @param {Vector2} v2 The new position
         */
        this.BaseObject2D.prototype.setPos = function(v2) {
            var f;
            if(arguments.length == 1){
                f = v2;
            } else if(arguments.length == 2 && !isNaN(parseFloat(arguments[0])) && !isNaN(parseFloat(arguments[1]))){
                f = new $e.Vector2(arguments[0], arguments[1]);
            } else {
                $d.LogError("Invalid value, expected Vector2");
                return;
            }
            if(this.parent != null){
                this.posOrigin.copy(f.substract(this.parent.getPos()));
            } else {
                this.posOrigin.copy(f);
            }
        };

        /**
         * BaseObject2D.prototype.setParent - Sets the object's parent
         * @param {BaseObject2D} parent The BaseObject2D parent
         */
        this.BaseObject2D.prototype.setParent = function (parent) {
            if(this.parent != null){
                this.parent.childs.splice(this.parent.childs.indexOf(this), 1);
            }
            this.parent = parent;
            this.parent.childs.push(this);
            this.offSetPos = this.getPos();
        };

        /**
         * Object2D.prototype.setInertia - Sets the inertia and the inverse inertia to the Object2D
         *
         * @param  {number} value The inertia
         */
        Object2D.prototype.setInertia = function(value){
            this.inertia = value;
            this.inverseInertia = (value != 0)? 1/value : 0;
        };


        /**
         * BaseObject2D.prototype.setPivot - Sets the pivot to the Object2D
         *
         * @param  {Vector2} value The Pivot
         */
        this.BaseObject2D.prototype.setPivot = function(position){
            this.setPos(this.posOrigin);
            this.pivot = position;
            this.setPos(this.getPos().sum(this.pivot.rrotate(this.rotation)));
        };

        /**
        * Object2D.prototype.addForce - Applies a force to the Object2D
        *
        * @param  {Vector2} force       description
        * @param  {number}     [forceType=0] The type of force: 0-Impulse, 1-Constant Force
        */
        Object2D.prototype.addForce = function(force, forceType){
            if(!this.kinematic){
                if(forceType == undefined || forceType == 0){
                    this.velocity.x += force.x/this.mass;
                    this.velocity.y += force.y/this.mass;
                } else {
                    this.force.x += force.x;
                    this.force.y += force.y;
                }
            }
        };

        /**
        * Object2D.prototype.applyImpulse - Applies an impulse
        *
        * @param  {Vector2} impulse       The impulse
        * @param  {Vector2} contactVector The point of the impulse
        */
        Object2D.prototype.applyImpulse = function(impulse, contactVector){
            if(!this.kinematic){
                this.velocity = impulse.clone();
                /*var rotatedForce = impulse.rrotate(-90).normalized();
                var dot = -rotatedForce.dot(contactVector.normalized());
                $d.Log("CONTACT: " + contactVector.toString(2) + "\t IMPULSE: " + impulse.toString(2) + "\t DOT: " + dot);
                var contact2 = rotatedForce.multiply(contactVector.magnitude()*dot);
                var rot = -contact2.cross(impulse)/(this.mass)/100;*/
                //var rContactVector = contactVector.rrotate(this.rotation).normalized();
                //var dot = impulse.dot(rContactVector);
                //var cross = impulse.normalized().cross(rContactVector);
                var rot = -this.inverseInertia * contactVector.normalized().cross(impulse);
                //var rot = (dot*cross)/this.mass;
                //$d.Log("CONTACT: " + rContactVector.toString(2) + "\tDOT: " + dot.toFixed(2) + "\tCROSS: " + cross.toFixed(2) + "\tROT: " + rot.toFixed(2));
                //if(rot != 0) $d.Log(rot);
                this.angularVelocity += rot;
            }
        };

        /**
        * Object2D.prototype.setCollider - Sets the collider
        *
        * @param  {Collider} collider The collider
        */
        Object2D.prototype.setCollider = function(collider, noadd){
            if(noadd == undefined || !noadd){
                if(this.collider == undefined){
                    internal.phycs.push(this);
                    internal.threads.phx.msgTail.push({
                        fn: 'updateList',
                        phycs: internal.phycs
                    });
                }
            }
            this.collider = collider;
        };

        /**
        * BaseObject2D.prototype.lookAt - Rotates the object to looks at a target
        *
        * @param  {BaseObject2D} Obj2 The target
        */
        this.BaseObject2D.prototype.lookAt = function(Obj2){
            this.setPos(this.posOrigin);
            var target = Obj2.getPos().substract(this.getPos());
            this.rotation = (target.angle()*(180/Math.PI) - 180) + this.lookAtOffset;
            this.setPos(this.getPos().sum(this.pivot.rrotate(this.rotation)));
        };

        this.Object2D = Object2D;

        /**
        * BoxCollider - Creates a new Collider
        *
        * @constructor
        * @param  {number} width  Width of the box
        * @param  {number} height Height of the box
        * @augments BaseCollider
        */
        this.BoxCollider = function(width, height){
            $e.BaseCollider.call(this, 0);
            this.vertexs = [
                new $e.Vector2(-width/2, height/2),
                new $e.Vector2(width/2, height/2),
                new $e.Vector2(width/2, -height/2),
                new $e.Vector2(-width/2, -height/2)
            ];
            this.calculateNormals();
        };

        /**
        * CircleCollider - Creates a new Collider
        *
        * @constructor
        * @param  {number} radius The Radius of the Circle
        * @augments BaseCollider
        */
        this.CircleCollider = function(radius){
            $e.BaseCollider.call(this, 1);
            this.radius = radius;
            this.maxRadius = radius;
        };

        /**
        * PolygonCollider - Creates a new Collider
        *
        * @constructor
        * @param  {Vector2[]} vertexs The array of Vertexs
        * @augments BaseCollider
        */
        this.PolygonCollider = function(vertexs){
            if(typeof vertexs == "object"){
                if(vertexs.length >= 3){
                    $e.BaseCollider.call(this, 2);
                    this.vertexs = vertexs;
                    this.calculateNormals();
                } else {
                    $d.LogError("The polygon collider needs at least 3 points");
                }
            } else {
                $d.LogError("Invalid value, expected Array");
            }
        };

        /**
         * The Virtual Base Collider
         *
         * @abstract
         */
        this.BaseCollider = function(type){
            this.selectable = true;
            this.type = type;
            this.contactPoint;
            this.vertexs = [];
            this.normals = [];
            this.checked = false;
            this.maxRadius = -vbn;
            this.checked = 0;
        };

        /**
        * BoxCollider.prototype.calculateNormals - Calculates the normals for each face of the polygon
        */
        this.PolygonCollider.prototype.calculateNormals = this.BoxCollider.prototype.calculateNormals = function(){
            for(var i = 0; i < this.vertexs.length; i++){
                var next = i + 1;
                if(next == this.vertexs.length){
                    next = 0;
                }
                this.normals.push(this.vertexs[i].normal(this.vertexs[next]).normalized());
                var dist = this.vertexs[i].magnitude();
                if(this.maxRadius < dist){
                    this.maxRadius = dist;
                }
            }
        };

        //close

        //Vector2 Maths start

        /**
        * Vector2.prototype.sum - Adds the second Vector2 from the origin
        *
        * @param  {Vector2} v2 The second Vector2
        * @return {Vector2} Returns the new Vector2
        */
        this.Vector2.prototype.sum = function(v2){
            return new $e.Vector2(this.x + v2.x, this.y + v2.y);
        };

        /**
        * Vector2.prototype.substract - Substracts the second Vector2 from the origin
        *
        * @param  {Vector2} v2 The substractor Vector2
        * @return {Vector2} Returns the new Vector2
        */
        this.Vector2.prototype.substract = function(v2){
            return new $e.Vector2(this.x - v2.x, this.y - v2.y);
        };

        /**
        * Vector2.prototype.multiply - Scales the Vector2 by the multiplier
        *
        * @param  {number}  mul The Multiplier
        * @return {Vector2} Returns the new multiplied Vector2
        */
        this.Vector2.prototype.multiply = function(mul){
            return new $e.Vector2(this.x * mul, this.y * mul);
        };

        /**
        * Vector2.prototype.scale - Scales the Vector2 by the multiplier
        *
        * @param  {number}    mul The Multiplier
        */
        this.Vector2.prototype.scale = function(mul){
            this.x = this.x * mul;
            this.y = this.y * mul;
        };

        /**
        * Vector2.prototype.normalize - Normalizes the Vector2 to return a Vector2 of length 1
        */
        this.Vector2.prototype.normalize = function(){
            if(this.x != 0 && this.y != 0){
                var l = this.magnitude();
                this.x = this.x/l;
                this.y = this.y/l;
            }
        };

        /**
        * Vector2.prototype.normalized - Normalizes the Vector2 to return a Vector2 of length 1
        *
        * @return {Vector2} returns the normalized Vector2
        */
        this.Vector2.prototype.normalized = function(){
            if(this.x == 0 && this.y == 0) return this;
            var l = this.magnitude();
            return new $e.Vector2(this.x/l, this.y/l);
        };

        /**
        * Vector2.prototype.magnitude - Calculates the length of the Vector2
        *
        * @return {number} returns the length of the Vector2
        */
        this.Vector2.prototype.magnitude = function(){
            return Math.sqrt((this.x * this.x) + (this.y * this.y));
        };

        /**
        * Vector2.prototype.dot - Calculates the Dot Vector
        *
        * @param  {Vector2} v2 The second Vector2
        * @return {number}  The Dot Vector
        */
        this.Vector2.prototype.dot = function(v2){
            return ((this.x * v2.x) + (this.y * v2.y));
        };

        /**
        * Vector2.prototype.cross - Calculates the Cross Vector
        *
        * @param  {Vector2} v2 The second Vector2
        * @return {number}  The Cross Vector
        */
        this.Vector2.prototype.cross = function(v2){
            return ((this.x * v2.y) - (v2.x * this.y));
        };

        /**
        * Vector2.prototype.angle - Calculates de Angle between 2 Vector2
        *
        * @param  {Vector2} v2 The second Vector2
        * @return {number}  The angle between the 2 bectors
        */
        this.Vector2.prototype.angle = function(v2){
            if(v2 == undefined){
                return Math.atan2(this.y, this.x);
            } else {
                return Math.atan2(v2.y - this.y, v2.x - this.x);
            }
        };

        /**
        * Vector2.prototype.normal - Normalizes Vector2 of the substraction
        *
        * @param  {Vector2} v2 The other Vector2
        * @return {Vector2} The normalized Vector2 of the substraction
        */
        this.Vector2.prototype.normal = function(v2){
            return new $e.Vector2(-(v2.y - this.y), v2.x - this.x);
        };

        /**
        * Vector2.prototype.rotate - Rotates the Vector2 by the angle
        *
        * @param  {number}    angle The angle in degreees
        */
        this.Vector2.prototype.rotate = function(angle){
            var radians = angle * (Math.PI/180);
            var cosa = Math.cos(radians);
            var sina = Math.sin(radians);
            var tempX = this.x*cosa - this.y*sina;
            var tempY = this.x*sina + this.y*cosa;
            if(Math.abs(tempX) < vln) tempX = 0;
            if(Math.abs(tempY) < vln) tempY = 0;
            this.x = tempX;
            this.y = tempY;
        };

        /**
        * Vector2.prototype.rrotate - Returns a new Vector2 rotated by the angle
        *
        * @param  {numeric} angle The angle in degreees
        * @return {Vector2} The new Vector2 rotated
        */
        this.Vector2.prototype.rrotate = function(angle){
            var v2 = new $e.Vector2(this.x, this.y);
            v2.rotate(angle);
            return v2;
        };

        /**
        * Vector2.prototype.swap - Swtiches the X and the Y
        */
        this.Vector2.prototype.swap = function(){
            var tX = this.x;
            this.x = this.y;
            this.y = tX;
        };


        /**
         * Vector2.prototype.toFixed - Fixes the Vector2
         *
         * @param  {number} fix decimal places
         */
        this.Vector2.prototype.toFixed = function(fix){
            this.x = this.x.toFixed(fix);
            this.y = this.y.toFixed(fix);
        };

        /**
        * Vector2.prototype.clone - returns a new Vector2
        *
        * @return {Vector2} The new copy of itself
        */
        this.Vector2.prototype.clone = function(){
            return new $e.Vector2(this.x, this.y);
        };


        /**
        * Vector2.prototype.copy - Copy a second Vector2 into the origin
        *
        * @param  {Vector2}   v2 The Vector2 to be copied
        */
        this.Vector2.prototype.copy = function(v2){
            this.x = v2.x;
            this.y = v2.y;
        };


        /**
        * Vector2.prototype.toString - Transforms Vector2 to String
        *
        * @param  {Vector2} fixed Decimals to print
        * @return {String}  The printable string
        */
        this.Vector2.prototype.toString = function(fixed){
            if(fixed != undefined){
                return "(" + this.x.toFixed(fixed) + "," + this.y.toFixed(fixed) + ")";
            } else {
                return "(" + this.x + "," + this.y + ")";
            }
        };

        //close

    }

    window.$e = $e; 


})(window);
