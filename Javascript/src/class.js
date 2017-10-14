function initClass(internal) {


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
    $e.Texture = function(name, srcs, size, time, loop){
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
    $e.Texture.prototype.getTexture = function(){
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
    $e.BaseObject2D = function(name, pos){
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
    class Object2D extends $e.BaseObject2D {
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
    $e.BaseObject2D.prototype.getPos = function(){
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
    $e.BaseObject2D.prototype.setPos = function(v2) {
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
    $e.BaseObject2D.prototype.setParent = function (parent) {
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

    Object2D.prototype.copyValues = function(otherObj){
        this.id = otherObj.id;
        this.name = otherObj.name;
        //this.pos = pos.clone();
        //this.posOrigin = this.pos.clone();
        this.posOrigin = new $e.Vector2(otherObj.posOrigin.x, otherObj.posOrigin.y);
        this.scale = new $e.Vector2(otherObj.scale.x, otherObj.scale.y);
        this.rotation = otherObj.rotation;
        this.pivot = new $e.Vector2(otherObj.pivot.x, otherObj.pivot.y);
        this.lookAtTarget = otherObj.lookAtTarget;
        this.lookAtOffset = otherObj.lookAtOffset;
        this.color = otherObj.color; 
        this.layer = otherObj.layer;
        this.parent = otherObj.parent;
        this.childs = otherObj.childs;
        this.kinematic = otherObj.kinematic;
        this.mass = otherObj.mass;
        this.newtonian = otherObj.newtonian;
        this.drag = otherObj.drag;
        this.angularDrag = otherObj.angularDrag;
        this.bounce = otherObj.bounce;
        this.setInertia(otherObj.inertia);
        this.angularVelocity = new $e.Vector2(otherObj.angularVelocity.x, otherObj.angularVelocity.y);
        this.velocity = new $e.Vector2(otherObj.velocity.x, otherObj.velocity.y);
        this.force = new $e.Vector2(otherObj.force.x, otherObj.force.y);
        this.collisions = otherObj.collisions;
        this.collider = otherObj.collider;
    }

    Object2D.prototype.duplicate = function(otherObj){
        var ret = new $e.Object2D("Base OBJ", new $e.Vector2(0, 0), 1, 1, 1, 1);
        ret.copyValues(otherObj);
        return ret;
    }


    /**
     * BaseObject2D.prototype.setPivot - Sets the pivot to the Object2D
     *
     * @param  {Vector2} value The Pivot
     */
    $e.BaseObject2D.prototype.setPivot = function(position){
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
                    data: {
                        fn: 'updateList',
                        phycs: internal.phycs
                    }
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
    $e.BaseObject2D.prototype.lookAt = function(Obj2){
        this.setPos(this.posOrigin);
        var target = Obj2.getPos().substract(this.getPos());
        this.rotation = (target.angle()*(180/Math.PI) - 180) + this.lookAtOffset;
        this.setPos(this.getPos().sum(this.pivot.rrotate(this.rotation)));
    };

    $e.Object2D = Object2D;

    /* ONLY PHYSICS */


    const vbn = 1000000;
    const vln = 1/vbn;

    /**
    * Vector2 - Creates a new 2 dimensional Vector
    *
    * @constructor
    * @param  {number} x X axis position
    * @param  {number} y Y axis position
    */
    $e.Vector2 = function(x, y){
        this.x = x;
        this.y = y;
    };

    /**
    * BoxCollider - Creates a new Collider
    *
    * @constructor
    * @param  {number} width  Width of the box
    * @param  {number} height Height of the box
    * @augments BaseCollider
    */
    $e.BoxCollider = function(width, height){
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
    $e.CircleCollider = function(radius){
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
    $e.PolygonCollider = function(vertexs){
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
    $e.BaseCollider = function(type){
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
    $e.PolygonCollider.prototype.calculateNormals = $e.BoxCollider.prototype.calculateNormals = function(){
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
    $e.Vector2.prototype.sum = function(v2){
        return new $e.Vector2(this.x + v2.x, this.y + v2.y);
    };

    /**
    * Vector2.prototype.substract - Substracts the second Vector2 from the origin
    *
    * @param  {Vector2} v2 The substractor Vector2
    * @return {Vector2} Returns the new Vector2
    */
    $e.Vector2.prototype.substract = function(v2){
        return new $e.Vector2(this.x - v2.x, this.y - v2.y);
    };

    /**
    * Vector2.prototype.multiply - Scales the Vector2 by the multiplier
    *
    * @param  {number}  mul The Multiplier
    * @return {Vector2} Returns the new multiplied Vector2
    */
    $e.Vector2.prototype.multiply = function(mul){
        return new $e.Vector2(this.x * mul, this.y * mul);
    };

    /**
    * Vector2.prototype.scale - Scales the Vector2 by the multiplier
    *
    * @param  {number}    mul The Multiplier
    */
    $e.Vector2.prototype.scale = function(mul){
        this.x = this.x * mul;
        this.y = this.y * mul;
    };

    /**
    * Vector2.prototype.normalize - Normalizes the Vector2 to return a Vector2 of length 1
    */
    $e.Vector2.prototype.normalize = function(){
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
    $e.Vector2.prototype.normalized = function(){
        if(this.x == 0 && this.y == 0) return this;
        var l = this.magnitude();
        return new $e.Vector2(this.x/l, this.y/l);
    };

    /**
    * Vector2.prototype.magnitude - Calculates the length of the Vector2
    *
    * @return {number} returns the length of the Vector2
    */
    $e.Vector2.prototype.magnitude = function(){
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    };

    /**
    * Vector2.prototype.dot - Calculates the Dot Vector
    *
    * @param  {Vector2} v2 The second Vector2
    * @return {number}  The Dot Vector
    */
    $e.Vector2.prototype.dot = function(v2){
        return ((this.x * v2.x) + (this.y * v2.y));
    };

    /**
    * Vector2.prototype.cross - Calculates the Cross Vector
    *
    * @param  {Vector2} v2 The second Vector2
    * @return {number}  The Cross Vector
    */
    $e.Vector2.prototype.cross = function(v2){
        return ((this.x * v2.y) - (v2.x * this.y));
    };

    /**
    * Vector2.prototype.angle - Calculates de Angle between 2 Vector2
    *
    * @param  {Vector2} v2 The second Vector2
    * @return {number}  The angle between the 2 bectors
    */
    $e.Vector2.prototype.angle = function(v2){
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
    $e.Vector2.prototype.normal = function(v2){
        return new $e.Vector2(-(v2.y - this.y), v2.x - this.x);
    };

    /**
    * Vector2.prototype.rotate - Rotates the Vector2 by the angle
    *
    * @param  {number}    angle The angle in degreees
    */
    $e.Vector2.prototype.rotate = function(angle){
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
    $e.Vector2.prototype.rrotate = function(angle){
        var v2 = new $e.Vector2(this.x, this.y);
        v2.rotate(angle);
        return v2;
    };

    /**
    * Vector2.prototype.swap - Swtiches the X and the Y
    */
    $e.Vector2.prototype.swap = function(){
        var tX = this.x;
        this.x = this.y;
        this.y = tX;
    };


    /**
     * Vector2.prototype.toFixed - Fixes the Vector2
     *
     * @param  {number} fix decimal places
     */
    $e.Vector2.prototype.toFixed = function(fix){
        this.x = this.x.toFixed(fix);
        this.y = this.y.toFixed(fix);
    };

    /**
    * Vector2.prototype.clone - returns a new Vector2
    *
    * @return {Vector2} The new copy of itself
    */
    $e.Vector2.prototype.clone = function(){
        return new $e.Vector2(this.x, this.y);
    };

    /**
     * Vector2.prototype.getNew - Returns a new Vector2
     * @param  {number} x X Value
     * @param  {number} y Y Value
     * @return {Vector2}   The new Vector2
     */
    $e.Vector2.prototype.getNew = function(x,y){
        return new $e.Vector2(x, y);
    }


    /**
    * Vector2.prototype.copy - Copy a second Vector2 into the origin
    *
    * @param  {Vector2}   v2 The Vector2 to be copied
    */
    $e.Vector2.prototype.copy = function(v2){
        this.x = v2.x;
        this.y = v2.y;
    };


    /**
    * Vector2.prototype.toString - Transforms Vector2 to String
    *
    * @param  {Vector2} fixed Decimals to print
    * @return {String}  The printable string
    */
    $e.Vector2.prototype.toString = function(fixed){
        if(fixed != undefined){
            return "(" + this.x.toFixed(fixed) + "," + this.y.toFixed(fixed) + ")";
        } else {
            return "(" + this.x + "," + this.y + ")";
        }
    };
}