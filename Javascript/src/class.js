function initClass() {
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