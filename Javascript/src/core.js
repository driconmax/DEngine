/*

#DSV:0.5 

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
            world: {
                gravity: 10,
                drag: 1
            },
            globals: {
                maxForce: 150,
                opacity: 0.9,
                background: "#FFF"
            },
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
            internal.controlVars.update.finish = true;
        }

        function DrawFPS(){
            internal.ctx.font = "12px Arial";
            internal.ctx.fillStyle = "#000";
            //internal.ctx.fillText("FPS: " + Math.ceil(internal.time.FPSsum / internal.time.FPScount),10,10);
            internal.ctx.fillText("FPS: " + Math.round(internal.time.FPS),10,10);
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
                    if(tempObj != obj){
                        v3.x = tempObj.pos.x - obj.pos.x;
                        v3.y = tempObj.pos.y - obj.pos.y;
                        var dist = v3.magnitude();
                        dist = dist - obj.collider.maxRadius - tempObj.collider.maxRadius;
                        //$d.Log(dist);
                        if((dist) < 0){
                            var a = FindAxisLeastPenetration(obj, tempObj);
                            if(a.bestDistance < 0){
                                //$d.Log(a);
                                obj.collider.contactPoint = a.faceIndex;

                                /*var v3 = obj.collider.normals[a.faceIndex];
                                var mag = obj.velocity.magnitude();
                                v3 = v3.normalized();
                                v3.multiply(-mag*0.1);
                                obj.addForce(v3.x, v3.y);*/
                                //var tVel = new $e.Vector2(-obj.velocity.x, -obj.velocity.y);
                                //var inAngle = tVel.angle(tempObj.velocity);
                                //$d.Log(inAngle);
                                //obj.velocity.rotate(inAngle);
                            } else {
                                obj.collider.contactPoint = undefined;
                            }

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
                faceIndex: bestIndex
            };
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
                internal.ctx.translate(obj.pos.x, internal.size.y - obj.pos.y);
                internal.ctx.rotate(obj.rotation * Math.PI / 180);
                internal.ctx.fillRect(- 10/2, - 10/2, 10, 10);
                if(internal.debug && obj.collider != undefined) {
                    internal.ctx.beginPath();
                    if(obj.collider.type == 1){
                        internal.ctx.arc(0, 0, obj.collider.radius, 0, 2*Math.PI);
                    } else {
                        internal.ctx.moveTo(obj.collider.vertexs[obj.collider.vertexs.length-1].x, -obj.collider.vertexs[obj.collider.vertexs.length-1].y);
                        for(var i = 0; i < obj.collider.vertexs.length; i++){
                            internal.ctx.lineTo(obj.collider.vertexs[i].x, -obj.collider.vertexs[i].y);
                        }
                    }
                    internal.ctx.strokeStyle = '#0F4';
                    internal.ctx.stroke();                    
                    internal.ctx.fillStyle = "#F77";
                    if(obj.collider.contactPoint != undefined){
                        internal.ctx.fillRect(obj.collider.vertexs[obj.collider.contactPoint].x - 2, -(obj.collider.vertexs[obj.collider.contactPoint].y) - 2, 4, 4);
                    }
                }
                internal.ctx.rotate(-obj.rotation * Math.PI / 180);
                internal.ctx.translate(-obj.pos.x, -(internal.size.y - obj.pos.y));
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

        this.Vector2.prototype.multiply = function(mul){
            this.x = this.x * mul;
            this.y = this.y * mul;
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

        this.Vector2.prototype.toString = function(){
            return "X: " + this.x + "\tY: " + this.y;
        }

        //close

    }

    window.$e = $e;


})(window)
