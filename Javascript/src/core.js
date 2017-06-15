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

        var constants = {
            //g: 6674*Math.pow(10,-11)
            g: 0.01
        }

        var internal = {
            debug: true,
            catchup: false,
            started: false,
            canvas: "",
            ctx: "",
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
            layers: [],
            phycs: [],
            user: {}
        }

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
        }

        /**
        * Enables the debug mode
        *
        * @param  {boolean} value On/Off
        */
        this.setDebug = function(value){
            if($d.ValidateInput(arguments, ["boolean"])){
                internal.debug = value;
            }
        }

        /**
        * Sets the speed of the engine (Default: 1)
        *
        * @param  {type} value description
        * @return {type}       description
        */
        this.setSpeed = function(value){
            if($d.ValidateInput(arguments, ["number"])){
                internal.time.speed = value;
            }
        }

        /**
        * Sets the gravity for the physics calcs (Default: 9.98)
        *
        * @param  {number} value The gravity aceleration
        */
        this.setGravity = function(value){
            if($d.ValidateInput(arguments, ["number"])){
                internal.world.gravity = value;
            }
        }

        /**
        * Enables the Catch Up function. This function checks if the engine is running slower than the expected speed and tryies to catch up with the expected main timeline
        *
        * @param  {boolean} value On/Off
        */
        this.setCatchUp = function(value){
            if($d.ValidateInput(arguments, ["boolean"])){
                internal.catchUp = value;
            }
        }

        /**
        * Sets the background color (Default: #FFF)
        *
        * @param  {number} value The Color in HEX
        */        
        this.setBackground = function(value){
            if($d.ValidateInput(arguments, ["string"])){
                internal.globals.background = value;
            }
        }

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
        }

        /**
        * Adds a Object2D to the engine in a specified layer
        *
        * @param  {Object2D} The Object2D
        * @param  {number} layer The layer of the object (-50 to 50)
        */
        this.add2DObject = function(obj, layer){
            if($d.ValidateInput(arguments, ["object","number"])){
                var ind = internal.phycs.push(obj);
                if(internal.layers[layer+50] == undefined){
                    internal.layers[layer+50] = [];
                }
                internal.layers[layer+50].push(internal.phycs[ind-1]);
            }
        }

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
        }

        /**
        * Writes a message to the debug console
        *
        * @param  {string} string Message
        * @param  {number} type   Type of message
        */
        this.writeDebugConsole = function(string, type){
            internal.console.history.push({name: string, type: type});
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
            internal.mouse.obj.setCollider(new $e.BoxCollider(0.1,0.1));

            internal.canvas.addEventListener('mousemove', function(evt) {
                UpdateMousePos(internal.canvas, evt);
            }, false);

            internal.canvas.addEventListener("mousedown", function(evt) {
                UpdateMouseAction(evt, true);
            });

            internal.canvas.addEventListener("mouseup", function(evt) {
                UpdateMouseAction(evt, false);
            });

            internal.time.interval = StartInterval();
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
                    over: internal.mouse.over
                });
            } catch(e){
                $d.LogError("Error in User Update function", e);
            }
            UpdatePhysics();
            DrawObjects();
            //DrawFPS();
            //DrawMousePosition();
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
            var msg = 'Mouse position: ' + internal.mouse.obj.pos.x + ',' + internal.mouse.obj.pos.y;
            internal.ctx.font = '8pt Calibri';
            internal.ctx.fillStyle = 'black';
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
                    if(finalObj.x != undefined){
                        var msg = internal.debugVars[i].name + ":\t" + finalObj.toString(2);
                    } else {
                        var msg = internal.debugVars[i].name + ":\t" + finalObj;
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
            internal.mouse.obj.pos.x = evt.clientX - rect.left;
            internal.mouse.obj.pos.y = internal.size.y - evt.clientY + rect.top;
            internal.mouse.over = CheckCollision(internal.mouse.obj, true);
        }

        function UpdateMouseAction(evt, active){
            switch(evt.button){
                case 0:
                    internal.mouse.click.left = active;
                    if(!active){
                        if(internal.mouse.over != undefined){
                            if(evt.shiftKey){
                                var ind = internal.mouse.selected.indexOf(internal.mouse.over);
                                if(ind != -1){
                                    var last = internal.mouse.selected.slice(ind+1);
                                    internal.mouse.selected.splice(0,ind, last);
                                } else {
                                    internal.mouse.selected.push(internal.mouse.over);
                                }
                            } else {
                                internal.mouse.selected.push(internal.mouse.over);
                            }
                        } else {
                            internal.mouse.selected = [];
                        }
                    }
                    break;
                case 1:
                    internal.mouse.click.middle = active;
                    break;
                case 2:
                    internal.mouse.click.right = active;
                    break;
                default:
                    break;
                             }
        }

        function UpdatePhysics(){
            var objA;
            for(var i = 0; i < internal.phycs.length; i++){

                objA = internal.phycs[i];

                if(!objA.kinematic){
                    CheckCollision(objA, false);
                    objA.collider.checked = internal.time.elapsedTime;

                    objA.rotation += objA.angularVelocity * internal.time.deltaTime;
                    objA.rotation = objA.rotation%360;
                    objA.angularVelocity *= objA.angularDrag;

                    objA.velocity.x += objA.force.x/objA.mass;

                    objA.velocity.y -= internal.world.gravity;
                    objA.velocity.y += objA.force.y/objA.mass;

                    objA.pos = objA.pos.sum(objA.velocity.multiply(internal.time.deltaTime));
                    if(objA.newtonian){
                        for(var j = 0; j < internal.phycs.length; j++){
                            var objB = internal.phycs[j];
                            if(objB != objA){
                                if(objB.newtonian){
                                    var dist = objB.pos.substract(objA.pos);
                                    var dir = dist.normalized();
                                    dist = dist.magnitude();
                                    var f = constants.g*((objA.mass * objB.mass)/dist)
                                    dir.scale(f);
                                    objA.addForce(dir);
                                }
                            }
                        }
                    }
                }
            }
        }

        function CheckCollision(obj, retObj){
            var objA = obj;
            var objB;
            var v3 = new $e.Vector2(0,0);
            objA.collisions = 0;
            for(var i = 0; i < internal.phycs.length; i++){
                objB = internal.phycs[i];
                //if(objB.collider.checked != internal.time.elapsedTime || retObj){
                if(true){
                    if(objB != objA && (!objA.kinematic || !objB.kinematic)){
                        v3.x = objB.pos.x - objA.pos.x;
                        v3.y = objB.pos.y - objA.pos.y;
                        var dist = v3.magnitude();
                        dist = dist - objA.collider.maxRadius - objB.collider.maxRadius;
                        //$d.Log(dist);
                        if((dist) < 0){

                            var Na, Nb, sep;
                            var contactPA, contactPB;
                            var trueCollide = false;

                            //COLLISION CIRCLE-CIRCLE
                            if(objA.collider.type == 1 && objB.collider.type == 1){
                                if(retObj) return objB;
                                trueCollide = true;
                                //sep = objB.pos.substract(objA.pos);
                                var dir = objB.pos.substract(objA.pos).normalized();
                                sep = dir.multiply(objA.pos.substract(objB.pos).magnitude() - objA.collider.maxRadius - objB.collider.maxRadius);
                                Na = objA.pos.substract(objB.pos).normalized();
                                Nb = objB.pos.substract(objA.pos).normalized();
                                contactPA = dir.multiply(objA.collider.radius);
                                contactPB = dir.multiply(-objB.collider.radius);
                            } else if(objA.collider.type == 1 && (objB.collider.type == 0 || objB.collider.type == 2)){ //COLLISION CIRCLE-POLYGON
                                var closest = {
                                    vertex: -1,
                                    distance: 1000000
                                };
                                /*for(var j = 0; j < objB.collider.vertexs.length; j++){
                                var sub = objB.collider.vertexs[j].clone().rrotate(objB.rotation).sum(objB.pos).substract(objA.pos);
                                var dist = sub.magnitude();
                                var dir = sub.normalized();
                                if(dist < objA.collider.radius){
                                if(closest.distance > dist){
                                closest.distance = dist;
                                closest.vertex = j;
                                closest.dir = dir;
                            }
                        }
                    }*/
                                if(closest.vertex == -1){
                                    for(var j = 0; j < objB.collider.vertexs.length; j++){
                                        var aV = objB.collider.vertexs[j].rrotate(objB.rotation).sum(objB.pos);
                                        var bV;
                                        var p = objA.pos;
                                        if(j == objB.collider.vertexs.length - 1){
                                            bV = objB.collider.vertexs[0].rrotate(objB.rotation).sum(objB.pos);
                                        } else {
                                            bV = objB.collider.vertexs[j+1].rrotate(objB.rotation).sum(objB.pos);
                                        }
                                        //var dist = (((aV.x - p.x)*(bV.y-p.y))-((aV.y-p.y)*(bV.x-p.x)))/(bV.substract(aV).magnitude());
                                        var resp = pnt2line(p, aV, bV);
                                        if(resp.dist < objA.collider.radius){
                                            if(closest.distance > resp.dist){
                                                closest.distance = resp.dist;
                                                closest.vertex = j;
                                                closest.dir = resp.nearest.substract(p).normalized();
                                                contactPB = resp.nearest.substract(objB.pos);
                                                contactPA = closest.dir.multiply(objA.collider.radius);
                                            }
                                        }
                                    }
                                }
                                if(closest.vertex != -1){
                                    if(retObj) return objB;
                                    trueCollide = true;

                                    //CIRCLE
                                    sep = closest.dir.multiply(objB.pos.substract(objA.pos).magnitude() - objB.collider.maxRadius - objA.collider.maxRadius);
                                    Na = objA.pos.substract(objB.pos).normalized();

                                    //POLYGON
                                    MTDb = new $e.Vector2(0,0);
                                    Nb = objB.collider.normals[closest.vertex].clone();
                                    Nb.rotate(objB.rotation);
                                }
                            } else if((objA.collider.type == 0 || objA.collider.type == 2) && objB.collider.type == 1){ //COLLISION POLYGON-CIRCLE
                                var closest = {
                                    vertex: -1,
                                    distance: 1000000
                                };
                                if(closest.vertex == -1){
                                    for(var j = 0; j < objA.collider.vertexs.length; j++){
                                        var aV = objA.collider.vertexs[j].rrotate(objA.rotation).sum(objA.pos);
                                        var bV;
                                        var p = objB.pos;
                                        if(j == objA.collider.vertexs.length - 1){
                                            bV = objA.collider.vertexs[0].rrotate(objA.rotation).sum(objA.pos);
                                        } else {
                                            bV = objA.collider.vertexs[j+1].rrotate(objA.rotation).sum(objA.pos);
                                        }
                                        //var dist = ((aV.x - p.x)*(bV.y-p.y)-(aV.y-p.y)*(bV.x-p.x))/(bV.substract(aV).magnitude());
                                        var resp = pnt2line(p, aV, bV);
                                        if(resp.dist < objB.collider.radius){
                                            if(closest.distance > resp.dist){
                                                closest.distance = resp.dist;
                                                closest.vertex = j;
                                                closest.dir = resp.nearest.substract(p).normalized();
                                                contactPA = resp.nearest.substract(objA.pos);
                                                contactPB = closest.dir.multiply(objB.collider.radius);
                                            }
                                        }
                                    }
                                }
                                if(closest.vertex != -1){
                                    if(retObj) return objB;
                                    trueCollide = true;

                                    //CIRCLE
                                    sep = closest.dir.multiply(objA.pos.substract(objB.pos).magnitude() - objA.collider.maxRadius - objB.collider.maxRadius);
                                    Na = objB.pos.substract(objA.pos).normalized();

                                    //POLYGON
                                    MTDb = new $e.Vector2(0,0);
                                    Nb = objA.collider.normals[closest.vertex].clone();
                                    Nb.rotate(objA.rotation);
                                }
                            } else {

                                //COLLISION POLYGON-POLYGON
                                var MTD2 = Intersect(obj, objB);
                                if(MTD2.intersect){

                                    if(retObj) return objB;
                                    trueCollide = true;

                                    //A objA
                                    var b = FindAxisLeastPenetration(objB, obj);
                                    MTDa = new $e.Vector2(0,0);

                                    Na = objB.collider.normals[b.vertexIndex].clone();
                                    Na.rotate(objB.rotation);
                                    contactPB = objB.collider.vertexs[b.vertexIndex];

                                    //B objB
                                    var a = FindAxisLeastPenetration(obj, objB);
                                    MTDb = new $e.Vector2(0,0);

                                    Nb = objA.collider.normals[a.vertexIndex].clone();
                                    Nb.rotate(objA.rotation);
                                    contactPA = objA.collider.vertexs[a.vertexIndex];

                                    sep = MTD2.mtd;
                                }
                            }

                            if(trueCollide){
                                objA.collisions++;
                                //Reflect velocity
                                var rf = (objA.bounce + objB.bounce)/2;
                                var jb = rf * ((objA.velocity.multiply(objA.mass - objB.mass).sum(objB.velocity.multiply(objB.mass*2)).magnitude())/(objA.mass + objB.mass));
                                var ja = rf * ((objB.velocity.multiply(objB.mass - objA.mass).sum(objA.velocity.multiply(objA.mass*2)).magnitude())/(objB.mass + objA.mass));

                                //A OBJ
                                //if(!objA.kinematic){
                                var Vea = objA.velocity.clone();
                                var dota = Vea.dot(Na);
                                dota = -2*dota;
                                Na.scale(dota);
                                var MTDa = Vea.sum(Na);

                                objA.applyImpulse(MTDa.normalized().multiply(ja), contactPA);
                                //objA.velocity.copy(MTDa);
                                //objA.velocity.normalize();
                                //objA.velocity.scale(ja);
                                //}

                                //B OBJ
                                //if(!objB.kinematic){
                                var Veb = objB.velocity.clone();
                                var dotb = Veb.dot(Nb);
                                dotb = -2*dotb;
                                Nb.scale(dotb);
                                var MTDb = Veb.sum(Nb);

                                objB.applyImpulse(MTDb.normalized().multiply(jb), contactPB);

                                //objB.velocity.copy(MTDb);
                                //objB.velocity.normalize();
                                //objB.velocity.scale(jb);
                                //}

                                //Move the object to exit the collision
                                if(objA.kinematic){
                                    objB.pos = objB.pos.substract(sep);
                                } else if(objB.kinematic){
                                    objA.pos = objA.pos.sum(sep);
                                } else {
                                    //sep.scale(0.5);
                                    objA.pos = objA.pos.sum(sep.multiply(objB.mass / (objB.mass + objA.mass)));
                                    objB.pos = objB.pos.substract(sep.multiply(objA.mass / (objB.mass + objA.mass)));
                                }
                            }
                        }
                    }
                }
            }
        }
        function pnt2line(pnt, start, end){
            var line_vec = end.substract(start);
            var pnt_vec = pnt.substract(start);
            var line_len = line_vec.magnitude();
            var line_unitvec = line_vec.normalized();
            var pnt_vec_scaled = pnt_vec.multiply(1.0/line_len);
            var t = line_unitvec.dot(pnt_vec_scaled);
            if(t < 0){
                t = 0;
            } else if(t > 1){
                t = 1;
            }
            var nearest = line_vec.multiply(t);
            var dist = nearest.substract(pnt_vec).magnitude();
            nearest = nearest.sum(start);
            return {dist: dist, nearest: nearest};
        }

        function GetSupport(obj, dir){
            var bestProjection = -1000000;
            var bestVertex = new $e.Vector2(0,0);

            for(var i = 0; i < obj.collider.vertexs.length; i++)
            {
                var vr = obj.collider.vertexs[i].clone();
                vr.rotate(obj.rotation);
                var v = obj.pos.sum(vr);
                var projection = dir.dot(v);

                if(projection > bestProjection)
                {
                    bestVertex = v;
                    bestProjection = projection;
                }
            }

            return bestVertex;
        }

        function FindAxisLeastPenetration(A, B){
            var bestDistance = -1000000;
            var bestIndex;

            for(var i = 0; i < A.collider.vertexs.length; i++)
            {
                // Retrieve a face normal from A
                var n = A.collider.normals[i].clone();
                n.rotate(A.rotation);

                // Retrieve support point from B along -n
                var s = GetSupport(B, n.multiply(-1));

                // Retrieve vertex on face from A, transform into
                // B's model space
                var vr = new $e.Vector2(A.collider.vertexs[i].x, A.collider.vertexs[i].y);
                vr.rotate(A.rotation);
                var v = new $e.Vector2(vr.x + A.pos.x, vr.y + A.pos.y);

                // Compute penetration distance (in B's model space)
                var sv = new $e.Vector2(s.x-v.x, s.y - v.y);
                var d = n.dot(sv);

                // Store greatest distance
                if(d > bestDistance)
                {
                    bestDistance = d;
                    bestIndex = i;
                }
            }

            //faceIndex = bestIndex;
            return {
                bestDistance: bestDistance,
                vertexIndex: bestIndex
            };
        }

        function Intersect(A, B){
            // potential separation axes. they get converted into push
            var Axis = [];
            // max of 16 vertices per polygon
            var iNumAxis = 0;
            var J = A.collider.vertexs.length - 1;
            for(var I = 0; I < A.collider.vertexs.length; I++)
            {
                var E = (A.collider.vertexs[I].rrotate(A.rotation).sum(A.pos)).substract(A.collider.vertexs[J].rrotate(A.rotation).sum(A.pos));
                var N = Axis[iNumAxis++] = new $e.Vector2(-E.y, E.x);

                if (AxisSeparatePolygons(N, A, B))
                    return false;
                J = I;
            }

            J = B.collider.vertexs.length - 1
            for(var I = 0; I < B.collider.vertexs.length; I++)
            {
                var E = (B.collider.vertexs[I].sum(B.pos).rrotate(B.rotation)).substract(B.collider.vertexs[J].rrotate(B.rotation).sum(B.pos));
                var N = Axis[iNumAxis++] = new $e.Vector2(-E.y, E.x);

                if (AxisSeparatePolygons (N, A, B))
                    return false;

                J = I;
            }

            // find the MTD among all the separation vectors
            var MTD = FindMTD(Axis, iNumAxis);

            // makes sure the push vector is pushing A away from B
            var D = A.pos.substract(B.pos);
            if (D.dot(MTD) < 0.0)
                MTD.scale(-1);

            return {
                intersect: true,
                mtd: MTD
            }
        }

        function CalculateInterval(Axis, P){
            var min, max;

            var d = Axis.dot(P.collider.vertexs[0].rrotate(P.rotation).sum(P.pos));
            min = max = d;
            for(var I = 0; I < P.collider.vertexs.length; I ++)
            {
                var d = (P.collider.vertexs[I].rrotate(P.rotation).sum(P.pos)).dot(Axis);
                if (d < min)
                    min = d;
                else
                    if(d > max)
                        max = d;
            }
            return {
                min: min,
                max: max
            }
        }

        function AxisSeparatePolygons(Axis, A, B){

            var a = CalculateInterval(Axis, A);
            var b = CalculateInterval(Axis, B);

            if (a.min > b.max || b.min > a.max)
                return true;

            // find the interval overlap
            var d0 = a.max - b.min;
            var d1 = b.max - a.min;
            var depth = (d0 < d1)? d0 : d1;

            // convert the separation axis into a push vector (re-normalise
            // the axis and multiply by interval overlap)
            var axis_length_squared = Axis.dot(Axis);

            Axis.scale(depth / axis_length_squared);
            return false;
        }

        function FindMTD(PushVectors, iNumVectors){
            var MTD = PushVectors[0].clone();
            var mind2 = MTD.dot(MTD);

            for(var I = 1; I < iNumVectors; I++)
            {
                var d2 = PushVectors[I].dot(PushVectors[I]);
                if (d2 < mind2)
                {
                    mind2 = d2;
                    MTD = PushVectors[I].clone();
                }
            }
            return MTD;
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
                var tv = new $e.Vector2(obj.pos.x, internal.size.y - obj.pos.y);
                tv.toFixed(0);
                internal.ctx.translate(tv.x, tv.y);
                var rot = obj.rotation * Math.PI / 180;
                internal.ctx.rotate(-rot);
                if(internal.mouse.over == obj){
                    internal.ctx.shadowBlur = 2;
                    internal.ctx.shadowColor = "#3c84c1";
                }
                if(obj.collider.type == 1){
                    //internal.ctx.arc(0, 0, obj.collider.radius/4, 0, 2*Math.PI);
                    //internal.ctx.fill();
                    internal.ctx.fillRect(- 10/2, - 10/2, 10, 10);
                } else {
                    internal.ctx.fillRect(- 10/2, - 10/2, 10, 10);
                }
                if(internal.debug && obj.collider != undefined) {
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

                    internal.ctx.strokeStyle = '#AFA';
                    internal.ctx.stroke();
                    internal.ctx.fillStyle = "#F77";
                    if(obj.collider.contactPoint != undefined){
                        internal.ctx.fillRect(obj.collider.vertexs[obj.collider.contactPoint].x - 2, (obj.collider.vertexs[obj.collider.contactPoint].y) - 2, 4, 4);
                    }
                }
                internal.ctx.rotate(rot);
                internal.ctx.font = '6pt Calibri';
                internal.ctx.fillStyle = 'black';
                internal.ctx.fillText(obj.name, 0, 0);
                //internal.ctx.translate(-tv.x, -tv.y);
                internal.ctx.setTransform(1,0,0,1,0,0);
                internal.ctx.shadowBlur = 0;
                //$d.Log(obj.name + "\tX: " + obj.pos.x + "\tY: " + obj.pos.y);
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
        }


        /**
        * Object2D - Creates a new Object2D
        *
        * @constructor
        * @param  {string} name   Name
        * @param  {Vector2} pos    Start position
        * @param  {number} mass   Mass
        * @param  {number} drag   Drag
        * @param  {number} angularDrag   Angular Drag
        * @param  {number} bounce Bounce factor
        * @param  {bool} [newtonian=false] Newtonian object (Atracts other bodys based on it's mass)
        */
        this.Object2D = function(name, pos, mass, drag, angularDrag, bounce, newtonian){
            this.name = name;
            this.pos = pos.clone();
            this.scale = new $e.Vector2(1,1);
            this.rotation = 0;
            this.kinematic = (mass == 0);
            this.mass = ((mass == 0)? 1 : mass);
            this.newtonian = (newtonian == undefined)? false : newtonian;
            this.drag = drag;
            this.angularDrag = angularDrag;
            this.bounce = bounce;
            this.setInertia(4);
            this.angularVelocity = 0;
            this.velocity = new $e.Vector2(0,0);
            this.force = new $e.Vector2(0,0);
            this.color = "#DDD";
            this.collisions = 0;
        }

        /**
         * Object2D.prototype.setInertia - Sets the inertia and the inverse inertia to the Object2D
         *
         * @param  {number} value The inertia
         */
        this.Object2D.prototype.setInertia = function(value){
            this.inertia = value;
            this.inverseInertia = (value != 0)? 1/value : 0;
        }

        /**
        * Object2D.prototype.addForce - Applies a force to the Object2D
        *
        * @param  {Vector2} force       description
        * @param  {int}     [forceType=0] The type of force: 0-Impulse, 1-Constant Force
        */
        this.Object2D.prototype.addForce = function(force, forceType){
            if(!this.kinematic){
                if(forceType == undefined || forceType == 0){
                    this.velocity.x += force.x/this.mass;
                    this.velocity.y += force.y/this.mass;
                } else {
                    this.force.x += force.x;
                    this.force.y += force.y;
                }
            }
        }

        /**
        * Object2D.prototype.applyImpulse - Applies an impulse
        *
        * @param  {Vector2} impulse       The impulse
        * @param  {Vector2} contactVector The point of the impulse
        */
        this.Object2D.prototype.applyImpulse = function(impulse, contactVector){
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
                var rot = this.inverseInertia * contactVector.normalized().cross(impulse);
                //var rot = (dot*cross)/this.mass;
                //$d.Log("CONTACT: " + rContactVector.toString(2) + "\tDOT: " + dot.toFixed(2) + "\tCROSS: " + cross.toFixed(2) + "\tROT: " + rot.toFixed(2));
                //if(rot != 0) $d.Log(rot);
                this.angularVelocity += rot;
            }
        }

        /**
        * Object2D.prototype.setCollider - Sets the collider
        *
        * @param  {Collider} collider The collider
        */
        this.Object2D.prototype.setCollider = function(collider){
            this.collider = collider;
        }


        //COLLIDER TYPES
        //  0 - Box
        //  1 - Circle
        //  2 - Polygon

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
        }

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
        }

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
        }

        /**
         * The Virtual Base Collider
         *
         * @abstract
         */
        this.BaseCollider = function(type){
            this.type = type;
            this.contactPoint;
            this.vertexs = [];
            this.normals = [];
            this.checked = false;
            this.maxRadius = -1000000;
            this.checked = 0;
        }

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
        }

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
        }

        /**
        * Vector2.prototype.substract - Substracts the second Vector2 from the origin
        *
        * @param  {Vector2} v2 The substractor Vector2
        * @return {Vector2} Returns the new Vector2
        */
        this.Vector2.prototype.substract = function(v2){
            return new $e.Vector2(this.x - v2.x, this.y - v2.y);
        }

        /**
        * Vector2.prototype.multiply - Scales the Vector2 by the multiplier
        *
        * @param  {number}  mul The Multiplier
        * @return {Vector2} Returns the new multiplied Vector2
        */
        this.Vector2.prototype.multiply = function(mul){
            return new $e.Vector2(this.x * mul, this.y * mul);
        }

        /**
        * Vector2.prototype.scale - Scales the Vector2 by the multiplier
        *
        * @param  {number}    mul The Multiplier
        */
        this.Vector2.prototype.scale = function(mul){
            this.x = this.x * mul;
            this.y = this.y * mul;
        }

        /**
        * Vector2.prototype.normalize - Normalizes the Vector2 to return a Vector2 of length 1
        */
        this.Vector2.prototype.normalize = function(){
            if(this.x != 0 && this.y != 0){
                var l = this.magnitude();
                this.x = this.x/l;
                this.y = this.y/l;
            }
        }

        /**
        * Vector2.prototype.normalized - Normalizes the Vector2 to return a Vector2 of length 1
        *
        * @return {Vector2} returns the normalized Vector2
        */
        this.Vector2.prototype.normalized = function(){
            if(this.x == 0 && this.y == 0) return this;
            var l = this.magnitude();
            return new $e.Vector2(this.x/l, this.y/l);
        }

        /**
        * Vector2.prototype.magnitude - Calculates the length of the Vector2
        *
        * @return {number} returns the length of the Vector2
        */
        this.Vector2.prototype.magnitude = function(){
            return Math.sqrt((this.x * this.x) + (this.y * this.y));
        }

        /**
        * Vector2.prototype.dot - Calculates the Dot Vector
        *
        * @param  {Vector2} v2 The second Vector2
        * @return {number}  The Dot Vector
        */
        this.Vector2.prototype.dot = function(v2){
            return ((this.x * v2.x) + (this.y * v2.y));
        }

        /**
        * Vector2.prototype.cross - Calculates the Cross Vector
        *
        * @param  {Vector2} v2 The second Vector2
        * @return {number}  The Cross Vector
        */
        this.Vector2.prototype.cross = function(v2){
            return ((this.x * v2.y) - (v2.x * this.y));
        }

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
        }

        /**
        * Vector2.prototype.normal - Normalizes Vector2 of the substraction
        *
        * @param  {Vector2} v2 The other Vector2
        * @return {Vector2} The normalized Vector2 of the substraction
        */
        this.Vector2.prototype.normal = function(v2){
            return new $e.Vector2(-(v2.y - this.y), v2.x - this.x);
        }

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
            if(Math.abs(tempX) < 0.0000001) tempX = 0;
            if(Math.abs(tempY) < 0.0000001) tempY = 0;
            this.x = tempX;
            this.y = tempY;
        }

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
        }

        /**
        * Vector2.prototype.swap - Swtiches the X and the Y
        */
        this.Vector2.prototype.swap = function(){
            var tX = this.x;
            this.x = this.y;
            this.y = tX;
        }


        /**
         * Vector2.prototype.toFixed - Fixes the Vector2
         *
         * @param  {number} fix decimal places
         */
        this.Vector2.prototype.toFixed = function(fix){
            this.x = this.x.toFixed(fix);
            this.y = this.y.toFixed(fix);
        }

        /**
        * Vector2.prototype.clone - returns a new Vector2
        *
        * @return {Vector2} The new copy of itself
        */
        this.Vector2.prototype.clone = function(){
            return new $e.Vector2(this.x, this.y);
        }


        /**
        * Vector2.prototype.copy - Copy a second Vector2 into the origin
        *
        * @param  {Vector2}   v2 The Vector2 to be copied
        */
        this.Vector2.prototype.copy = function(v2){
            this.x = v2.x;
            this.y = v2.y;
        }


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
        }

        //close

    }

    window.$e = $e;


})(window)
