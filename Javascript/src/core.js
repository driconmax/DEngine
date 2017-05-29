/*

#DSV:0.5#

*/


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
                FPScount: 0,
                FPSsum: 0,
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

            internal.console.size = new $e.Vector2(50,50);
            internal.console.position = new $e.Vector2(internal.size.x - internal.console.size.x,0);

            internal.canvas.addEventListener('mousemove', function(evt) {
                UpdateMousePos(internal.canvas, evt);
            }, false);

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
                    internal.time.FPS = 1/(internal.time.deltaTime/internal.time.speed);
                    internal.time.FPSsum += internal.time.FPS;
                    internal.time.FPScount++;
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
            var msg = 'Mouse position: ' + internal.mouse.x + ',' + internal.mouse.y;
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
            internal.mouse.x = evt.clientX - rect.left;
            internal.mouse.y = evt.clientY - rect.top;
        }

        function UpdatePhysics(){
            var tempObj;
            for(var i = 0; i < internal.phycs.length; i++){

                tempObj = internal.phycs[i];

                if(!tempObj.kinematic){
                    CheckCollision(tempObj);  
                    tempObj.collider.checked = internal.time.elapsedTime;

                    tempObj.rotation += tempObj.angularVelocity * internal.time.deltaTime;

                    tempObj.velocity.x += tempObj.force.x;

                    tempObj.velocity.y -= internal.world.gravity;
                    tempObj.velocity.y += tempObj.force.y;

                    tempObj.pos.x += tempObj.velocity.x * internal.time.deltaTime;
                    tempObj.pos.y += tempObj.velocity.y * internal.time.deltaTime;

                    if(tempObj.pos.y < 9){
                        tempObj.pos.y = 5;
                        tempObj.velocity.y = -tempObj.velocity.y * tempObj.bounce;
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

                            /*var a = FindAxisLeastPenetration(obj, tempObj);
                            if(a.bestDistance < 0){
                                var b = FindAxisLeastPenetration(tempObj, obj);
                                if(b.bestDistance < 0){

                                    var MTD = (tempObj.collider.vertexs[b.vertexIndex].sum(tempObj.pos)).substract(obj.collider.vertexs[a.vertexIndex].sum(obj.pos));
                                    $e.addDebugObject("MTD", MTD, []);
                                    $d.Log("A: " + a.bestDistance + "\tB: " + b.bestDistance);

                                    if(obj.kinematic){
                                        tempObj.pos = tempObj.pos.substract(tempObj.pos.sum(MTD)); //-
                                    } else if(tempObj.kinematic){
                                        obj.pos = obj.pos.sum(obj.pos.sum(MTD)); //+
                                    } else {
                                        MTD.scale(0.5);
                                        obj.pos = obj.pos.sum(obj.pos.sum(MTD)); //+
                                        tempObj.pos = tempObj.pos.substract(tempObj.pos.sum(MTD)); //-
                                    }

                                }
                            }*/

                            var MTD2 = Intersect(obj, tempObj);
                            if(MTD2.intersect){
                                
                                
                                obj.pos.x -= obj.velocity.x * internal.time.deltaTime;
                                obj.pos.y -= obj.velocity.y * internal.time.deltaTime;

                                var b = FindAxisLeastPenetration(tempObj, obj);
                                var MTD = new $e.Vector2(0,0);
                                
                                var lastSpeed = obj.velocity.clone();
                                var magnitud = lastSpeed.magnitude();
                                obj.velocity.normalize();
                                
                                MTD.x = tempObj.collider.normals[b.vertexIndex].x - obj.velocity.x;
                                MTD.y = tempObj.collider.normals[b.vertexIndex].y - obj.velocity.y;
                                MTD.normalize();
                                MTD.scale(magnitud);
                                
                                obj.velocity.x = MTD.x;
                                obj.velocity.y = MTD.y;
                                
                                $d.Log("DIST: " + dist + "\tMTD: " + MTD.toString() + "\nOLD SPEED: " + lastSpeed.toString() + "\nNEW SPEED: " + obj.velocity.toString());
                                
                                
                                /*if(obj.kinematic){
                                    tempObj.pos = tempObj.pos.substract(tempObj.pos.sum(MTD)); //-
                                } else if(tempObj.kinematic){
                                    obj.pos = obj.pos.sum(obj.pos.sum(MTD)); //+
                                } else {
                                    MTD.scale(0.5);
                                    obj.pos = obj.pos.sum(obj.pos.sum(MTD)); //+
                                    tempObj.pos = tempObj.pos.substract(tempObj.pos.sum(MTD)); //-
                                }*/
                            }

                            /*var MTD = Intersect(obj, tempObj);
                            if(MTD.intersect){
                                MTD.mtd.rotate(-obj.rotation);
                                //MTD.mtd.scale(internal.time.deltaTime);
                                var a = FindAxisLeastPenetration(obj, tempObj);
                                var b = FindAxisLeastPenetration(tempObj, obj);
                                $d.Log("A: " + a.bestDistance + "\tB: " + b.bestDistance);
                                $d.Log("VA: " + obj.velocity + "\tVB: " + tempObj.velocity);
                                $d.Log("DIST: " + dist + "\tMTD: " + MTD.mtd.toString());
                                if(obj.kinematic){
                                    tempObj.pos = tempObj.pos.substract(tempObj.pos.sum(MTD.mtd)); //-
                                } else if(tempObj.kinematic){
                                    obj.pos = obj.pos.sum(obj.pos.sum(MTD.mtd)); //+
                                } else {
                                    MTD.mtd.scale(0.5);
                                    obj.pos = obj.pos.sum(obj.pos.sum(MTD.mtd)); //+
                                    tempObj.pos = tempObj.pos.substract(tempObj.pos.sum(MTD.mtd)); //-
                                }
                            }*/



                            //var a = FindAxisLeastPenetration(obj, tempObj);
                            //if(a.bestDistance < 0){
                            //$d.Log(a);
                            //obj.collider.contactPoint = a.faceIndex;

                            /*var v3 = obj.collider.normals[a.faceIndex];
                                var mag = obj.velocity.magnitude();
                                v3 = v3.normalized();
                                v3.scalar(-mag*0.1);
                                obj.addForce(v3.x, v3.y);*/
                            //var tVel = new $e.Vector2(-obj.velocity.x, -obj.velocity.y);
                            //var inAngle = tVel.angle(tempObj.velocity);
                            //$d.Log(inAngle);
                            //obj.velocity.rotate(inAngle);


                            //} else {
                            //    obj.collider.contactPoint = undefined;
                            //}

                            /*var b = FindAxisLeastPenetration(tempObj, obj);
                            if(b.bestDistance < 0){
                                //$d.Log(a);
                                tempObj.collider.contactPoint = b.faceIndex;
                            } else {
                                tempObj.collider.contactPoint = undefined;
                            }*/

                            //obj.velocity = obj.velocity.rotate();
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
                var vr = new $e.Vector2(obj.collider.vertexs[i].x, obj.collider.vertexs[i].y);
                vr.rotate(obj.rotation);
                var v = new $e.Vector2(vr.x + obj.pos.x, vr.y + obj.pos.y);
                var projection = dir.dot(v);

                if(projection > bestProjection)
                {
                    bestVertex = v;
                    bestProjection = projection;
                }
            }

            return bestVertex;
        }

        //function FindAxisLeastPenetration(faceIndex, A, B ){
        function FindAxisLeastPenetration(A, B){
            var bestDistance = -1000000;
            var bestIndex;

            for(var i = 0; i < A.collider.vertexs.length; i++)
            {
                // Retrieve a face normal from A
                var n = new $e.Vector2(A.collider.normals[i].x, A.collider.normals[i].y);
                n.rotate(A.rotation);

                // Retrieve support point from B along -n
                var s = GetSupport(B, new $e.Vector2(-n.x, -n.y));

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

        /* Collision Response - http://elancev.name/oliver/2D%20polygon.htm */

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
                var E = (B.collider.vertexs[I].rrotate(B.rotation).sum(B.pos)).substract(B.collider.vertexs[J].rrotate(B.rotation).sum(B.pos)); 
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

            Axis *= depth / axis_length_squared; 
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
                    MTD = PushVectors[I]; 
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
                internal.ctx.rotate(obj.rotation * Math.PI / 180);
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
                    internal.ctx.strokeStyle = '#0F4';
                    internal.ctx.stroke();                    
                    internal.ctx.fillStyle = "#F77";
                    if(obj.collider.contactPoint != undefined){
                        internal.ctx.fillRect(obj.collider.vertexs[obj.collider.contactPoint].x - 2, (obj.collider.vertexs[obj.collider.contactPoint].y) - 2, 4, 4);
                    }
                }
                internal.ctx.rotate(-obj.rotation * Math.PI / 180);
                internal.ctx.translate(-tv.x, -tv.y);
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
            this.mass = mass;
            this.drag = drag;
            this.bounce = bounce;
            this.angularVelocity = 0;
            this.velocity = new $e.Vector2(0,0);
            this.force = new $e.Vector2(0,0);
            this.color = "#000";
        }


        //ForceType
        //  0 - Impulse
        //  1 - Constant force
        this.Object2D.prototype.addForce = function(x, y, forceType){
            if(forceType == undefined || forceType == 0){
                this.velocity.x += x;
                this.velocity.y += y;
            } else {
                this.force.x += x;
                this.force.y += y;
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
                this.normals.push(this.vertexs[i].normal(this.vertexs[next]));
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
            return $e.Vector2(this.x * mul, this.y * mul);
        }

        this.Vector2.prototype.scale = function(mul){
            this.x = this.x * mul;
            this.y = this.y * mul;
        }
        
        this.Vector2.prototype.normalize = function(){
            var l = this.magnitude();
            this.x = this.x/l;
            this.y = this.y/l;
        }

        this.Vector2.prototype.normalized = function(){
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

        this.Vector2.prototype.clone = function(){
            return new $e.Vector2(this.x, this.y);
        }

        this.Vector2.prototype.toString = function(fixed){
            if(fixed != undefined){
                var f = 10^fixed;
                return "X: " + Math.round(this.x*f)/f + "\tY: " + Math.round(this.y*f)/f;
            } else {
                return "X: " + this.x + "\tY: " + this.y;
            }
        }

        //close

    }

    window.$e = $e;


})(window)
