/*

#DSV:0.5#

Collision Response - http://elancev.name/oliver/2D%20polygon.htm

*/


(function(window){

    'use strict';

    var $e = new function(){

        var constants = {
            //g: 6674*Math.pow(10,-11)
            g: 6.66
        }

        var internal = {
            debug: true,
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
            mouse: 0,
            mouseover: undefined,
            layers: [],
            phycs: [],
            user: {}
        }

        //Public Functions start

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

        this.setMaxFPS = function(value){
            if(typeof value == "number"){
                internal.time.maxFPS = value;
            } else {
                $d.LogError("Invalid value, expected number");
            }
        }

        this.setDebug = function(value){
            if(typeof value == "boolean"){
                internal.debug = value;
            } else {
                $d.LogError("Invalid value, expected boolean");
            }
        }

        this.setSpeed = function(value){
            if(typeof value == "number"){
                internal.time.speed = value;
            } else {
                $d.LogError("Invalid value, expected number");
            }
        }

        this.setGravity = function(value){
            if(typeof value == "number"){
                internal.world.gravity = value;
            } else {
                $d.LogError("Invalid value, expected number");
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
            if(internal.layers[layer+50] == undefined){
                internal.layers[layer+50] = [];
            }
            internal.layers[layer+50].push(internal.phycs[ind-1]);
        }

        this.addDebugObject = function(name, obj, vars, duration){
            internal.debugVars.push({
                name: name,
                obj: obj,
                vars: vars,
                duration: duration
            });
        }

        this.writeDebugConsole = function(string, type){
            internal.console.history.push({name: string, type: type});
        }

        //close

        //Private functions start

        function Start(){
            internal.controlVars.update.finish = true;
            var sd = new Date().getTime();
            internal.time.miliseconds = sd;
            internal.mouse = new $e.Vector2(0,0);

            //Creates a new console
            internal.console.size = new $e.Vector2(50,50);
            internal.console.position = new $e.Vector2(internal.size.x - internal.console.size.x,0);

            //Creates the object for the mouse position
            internal.mouse = new $e.Object2D("Mouse", 0, 0, 1, 1, 1);
            internal.mouse.setCollider(new $e.BoxCollider(0.1,0.1));

            internal.canvas.addEventListener('mousemove', function(evt) {
                UpdateMousePos(internal.canvas, evt);
            }, false);

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
                        $d.LogWarning("Running behind the main timeline ("+(internal.time.FPS+internal.time.behindTime)+" seconds) trying to catch up at " + internal.time.catchUpTime + " seconds per frame.");
                        internal.time.behindTime += internal.time.deltaTime;
                        internal.time.deltaTime = 1/internal.time.minFPS;
                    } else {
                        if(internal.time.behindTime > 0){
                            if(internal.time.behindTime < internal.time.catchUpTime){
                                internal.time.deltaTime += internal.time.behindTime;
                                internal.time.behindTime = 0;
                                $d.LogWarning("Main timeline reached.");
                            } else {
                                internal.time.deltaTime += internal.time.catchUpTime;
                                internal.time.behindTime -= internal.time.catchUpTime;
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
                internal.user.udpate();    
            } catch(e){
                $d.LogError("Error in User Update function", e);
            }
            UpdatePhysics();
            DrawObjects();
            DrawFPS();
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
            var msg = 'Mouse position: ' + internal.mouse.pos.x + ',' + internal.mouse.pos.y;
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
                    var msg = internal.debugVars[i].name + ":\t" + finalObj.toString(2);
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
            internal.mouse.pos.x = evt.clientX - rect.left;
            internal.mouse.pos.y = internal.size.y - evt.clientY + rect.top;
            for(var i = 0; i < internal.phycs.length; i++){
                var obj = internal.phycs[i];
                var inter = Intersect(internal.mouse, obj);
                if(inter.intersect){
                    internal.mouseover = obj;
                    break;
                } else {
                    internal.mouseover = undefined;
                }
            }
        }

        function UpdatePhysics(){
            var tempObj;
            for(var i = 0; i < internal.phycs.length; i++){

                tempObj = internal.phycs[i];

                if(!tempObj.kinematic){
                    CheckCollision(tempObj);  
                    tempObj.collider.checked = internal.time.elapsedTime;

                    tempObj.rotation += tempObj.angularVelocity * internal.time.deltaTime;

                    tempObj.velocity.x += tempObj.force.x/tempObj.mass;

                    tempObj.velocity.y -= internal.world.gravity;
                    tempObj.velocity.y += tempObj.force.y/tempObj.mass;

                    tempObj.pos = tempObj.pos.sum(tempObj.velocity.multiply(internal.time.deltaTime));
                    if(tempObj.newtonian){
                        for(var j = 0; j < internal.phycs.length; j++){
                            var obj = internal.phycs[j];
                            if(obj != tempObj){
                                if(obj.newtonian){
                                    var dist = obj.pos.substract(tempObj.pos);
                                    var dir = dist.normalized();
                                    dist = dist.magnitude();
                                    var f = constants.g*((tempObj.mass * obj.mass)/dist)
                                    dir.scale(f);
                                    tempObj.addForce(dir.x, dir.y);
                                }
                            }
                        }
                    }
                }
            }
        }

        function CheckCollision(obj){
            var tempObj;
            var v3 = new $e.Vector2(0,0);
            for(var i = 0; i < internal.phycs.length; i++){
                tempObj = internal.phycs[i];
                if(tempObj.collider.checked != internal.time.elapsedTime){
                    if(tempObj != obj && (!obj.kinematic || !tempObj.kinematic)){
                        v3.x = tempObj.pos.x - obj.pos.x;
                        v3.y = tempObj.pos.y - obj.pos.y;
                        var dist = v3.magnitude();
                        dist = dist - obj.collider.maxRadius - tempObj.collider.maxRadius;
                        //$d.Log(dist);
                        if((dist) < 0){

                            var MTD2 = Intersect(obj, tempObj);
                            if(MTD2.intersect){

                                //Reflect velocity

                                //var j = (obj.bounce - tempObj.bounce + 1)*(tempObj.velocity.magnitude() - obj.velocity.magnitude())*Math.pow((1/obj.mass + 1/tempObj.mass), -1);
                                var rf = (obj.bounce + tempObj.bounce)/2;
                                //var massF = Math.pow((1/obj.mass + 1/tempObj.mass), -1);
                                //var dV = tempObj.velocity.substract(obj.velocity).magnitude();
                                var jb = rf * ((obj.velocity.multiply(obj.mass - tempObj.mass).sum(tempObj.velocity.multiply(tempObj.mass*2)).magnitude())/(obj.mass + tempObj.mass));
                                var ja = rf * ((tempObj.velocity.multiply(tempObj.mass - obj.mass).sum(obj.velocity.multiply(obj.mass*2)).magnitude())/(tempObj.mass + obj.mass));
                                //$d.Log("RF: "+rf+"\tJ: " + j);
                                //$d.Log("OV1: "+tempObj.velocity.toString(2)+"\tOV2: " +  obj.velocity.toString(2));
                                //$d.Log("OM1: "+tempObj.velocity.magnitude()+"\tOM2: " +  obj.velocity.magnitude());
                                
                                //A OBJ
                                var b = FindAxisLeastPenetration(tempObj, obj);
                                var MTD = new $e.Vector2(0,0);

                                var N = tempObj.collider.normals[b.vertexIndex].clone();
                                N.rotate(tempObj.rotation);
                                var Ve = obj.velocity.clone();
                                var dot = Ve.dot(N);
                                var dot = -2*dot;
                                N.scale(dot);
                                MTD = Ve.sum(N);

                                //obj.velocity.copy(MTD.multiply(obj.bounce));
                                obj.velocity.copy(MTD);
                                obj.velocity.normalize();
                                obj.velocity.scale(ja);
                                //obj.pos = obj.pos.sum(obj.velocity.multiply(internal.time.deltaTime));

                                //B tempObj
                                var a = FindAxisLeastPenetration(obj, tempObj);
                                MTD = new $e.Vector2(0,0);

                                N = obj.collider.normals[a.vertexIndex].clone();
                                N.rotate(obj.rotation);
                                Ve = tempObj.velocity.clone();
                                dot = Ve.dot(N);
                                dot = -2*dot;
                                N.scale(dot);
                                MTD = Ve.sum(N);

                                //tempObj.velocity.copy(MTD.multiply(tempObj.bounce));
                                tempObj.velocity.copy(MTD);
                                tempObj.velocity.normalize();
                                tempObj.velocity.scale(jb);
                                //tempObj.pos = tempObj.pos.sum(tempObj.velocity.multiply(internal.time.deltaTime));

                                //$d.Log("MTD: " + MTD2.mtd);

                                /*if(obj.kinematic){
                                    tempObj.velocity.copy(MTD.multiply(-tempObj.bounce));
                                } else if(tempObj.kinematic){
                                    obj.velocity.copy(MTD.multiply(obj.bounce));
                                } else {
                                    MTD.scale(0.5);
                                    obj.velocity.copy(MTD.multiply(obj.bounce));
                                    tempObj.velocity.copy(MTD.multiply(-tempObj.bounce));
                                }*/

                                //$d.Log("ja: " + ja + "\tjb: " + jb + "\tVa: " + obj.velocity.toString(2) + "\tVb: " + tempObj.velocity.toString(2));
                                
                                //Move the object to exit the collision
                                if(obj.kinematic){
                                    tempObj.pos = tempObj.pos.substract(MTD2.mtd);
                                } else if(tempObj.kinematic){
                                    obj.pos = obj.pos.sum(MTD2.mtd);
                                } else {
                                    MTD2.mtd.scale(0.5);
                                    obj.pos = obj.pos.sum(MTD2.mtd);
                                    tempObj.pos = tempObj.pos.substract(MTD2.mtd);
                                }
                            }
                        }
                    }
                }
            }
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
            internal.ctx.globalAlpha = internal.globals.opacity;
            internal.ctx.fillStyle = internal.globals.background;
            internal.ctx.fillRect(0,0,internal.size.x, internal.size.y);
            internal.ctx.globalAlpha = 1;
            for(var i = 0; i < internal.layers.length; i++){
                for(var f = 0; f < internal.layers[i].length; f++){
                    Draw(internal.layers[i][f]);
                }
            }
        }

        function Draw(obj){
            if(internal.debug){
                internal.ctx.fillStyle = obj.color;
                var tv = new $e.Vector2(obj.pos.x, internal.size.y - obj.pos.y);
                internal.ctx.translate(tv.x, tv.y);
                var rot = obj.rotation * Math.PI / 180;
                internal.ctx.rotate(-rot);
                if(internal.mouseover == obj){
                    internal.ctx.shadowBlur = 2;
                    internal.ctx.shadowColor = "#3c84c1";
                }
                internal.ctx.fillRect(- 10/2, - 10/2, 10, 10);
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
                internal.ctx.translate(-tv.x, -tv.y);
                internal.ctx.shadowBlur = 0;
                //$d.Log(obj.name + "\tX: " + obj.pos.x + "\tY: " + obj.pos.y);
            }
        }

        //close

        //DEngine Objects start

        this.Vector2 = function(x, y){
            this.x = x;
            this.y = y;
        }

        this.Object2D = function(name, x, y, mass, drag, bounce){
            this.name = name;
            this.pos = new $e.Vector2(x,y);
            this.scale = new $e.Vector2(1,1);
            this.rotation = 0;
            this.kinematic = (mass == 0);
            this.mass = ((mass == 0)? 1 : mass);
            this.newtonian = false;
            this.drag = drag;
            this.bounce = bounce;
            this.angularVelocity = 0;
            this.velocity = new $e.Vector2(0,0);
            this.force = new $e.Vector2(0,0);
            this.color = "#DDD";
        }


        //ForceType
        //  0 - Impulse
        //  1 - Constant force
        this.Object2D.prototype.addForce = function(x, y, forceType){
            if(!this.kinematic){
                if(forceType == undefined || forceType == 0){
                    this.velocity.x += x/this.mass;
                    this.velocity.y += y/this.mass;
                } else {
                    this.force.x += x;
                    this.force.y += y;
                }
            }
        }

        this.Object2D.prototype.setCollider = function(collider){
            this.collider = collider;
        }


        //COLLIDER TYPES
        //  0 - Box
        //  1 - Circle
        //  2 - Polygon

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

        this.CircleCollider = function(radius){
            $e.BaseCollider.call(this, 1);
            this.radius = radius;
        }

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

        this.BaseCollider = function(type){
            this.type = type;
            this.contactPoint;
            this.vertexs = [];
            this.normals = [];
            this.checked = false;
            this.maxRadius = -1000000;
            this.checked = 0;
        }

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

        this.Vector2.prototype.sum = function(v2){
            return new $e.Vector2(this.x + v2.x, this.y + v2.y);
        }

        this.Vector2.prototype.substract = function(v2){
            return new $e.Vector2(this.x - v2.x, this.y - v2.y);
        }

        this.Vector2.prototype.multiply = function(mul){
            return new $e.Vector2(this.x * mul, this.y * mul);
        }

        this.Vector2.prototype.scale = function(mul){
            this.x = this.x * mul;
            this.y = this.y * mul;
        }

        this.Vector2.prototype.normalize = function(){
            if(this.x != 0 && this.y != 0){
                var l = this.magnitude();
                this.x = this.x/l;
                this.y = this.y/l;
            }
        }

        this.Vector2.prototype.normalized = function(){
            if(this.x == 0 && this.y == 0) return this;
            var l = this.magnitude();
            return new $e.Vector2(this.x/l, this.y/l);
        }

        this.Vector2.prototype.magnitude = function(){
            return Math.sqrt((this.x * this.x) + (this.y * this.y));
        }

        this.Vector2.prototype.dot = function(v2){
            return ((this.x * v2.x) + (this.y * v2.y));
        }

        this.Vector2.prototype.cross = function(v2){
            return ((this.x * v2.y) - (v2.x * this.y));
        }

        this.Vector2.prototype.angle = function(v2){
            if(v2 == undefined){
                return Math.atan2(this.y, this.x);
            } else {
                return Math.atan2(v2.y - this.y, v2.x - this.x);
            }
        }

        this.Vector2.prototype.normal = function(v2){
            return new $e.Vector2(-(v2.y - this.y), v2.x - this.x);
        }

        this.Vector2.prototype.rotate = function(angle){
            angle = angle * (Math.PI/180);
            var cosa = Math.cos(angle);
            var sina = Math.sin(angle);
            this.x = this.x*cosa - this.y*sina;
            this.y = this.x*sina + this.y*cosa;
        }

        this.Vector2.prototype.rrotate = function(angle){
            angle = angle * (Math.PI/180);
            var cosa = Math.cos(angle);
            var sina = Math.sin(angle);
            return new $e.Vector2(this.x*cosa - this.y*sina, this.x*sina + this.y*cosa);
        }

        this.Vector2.prototype.swap = function(){
            var tX = this.x;
            this.x = this.y;
            this.y = tX;
        }

        this.Vector2.prototype.clone = function(){
            return new $e.Vector2(this.x, this.y);
        }

        this.Vector2.prototype.copy = function(v2){
            this.x = v2.x;
            this.y = v2.y;
        }

        this.Vector2.prototype.toString = function(fixed){
            if(fixed != undefined){
                var f = Math.pow(10, fixed);
                return "X: " + Math.round(this.x*f)/f + "\tY: " + Math.round(this.y*f)/f;
            } else {
                return "X: " + this.x + "\tY: " + this.y;
            }
        }

        //close

    }

    window.$e = $e;


})(window)
