/**
 * Physics Thread
 */

var $e;
var phycs;
var time = {
    fixedTime: 0,
    elapsedTime: 0,
    lastTime: 0,
    fxps: 20
};
var world = {
    gravity: 9.81
}
var fixedLoop = {
    inter: undefined,
    running: false,
    changes: false,
    break: -1,
    lnm: 0
}

onmessage = function(msg){
    if(msg.data != undefined && typeof(msg.data) == "object"){
        switch(msg.data.fn){
            case 'Start':
                $e = msg.data.navia;
                phycs = msg.data.phycs;
                Start();
                break;
            case 'setGravity':
                gravity = msg.data.value;
                break;
            case 'updateList':
                fixedLoop.break = fixedLoop.lnm;
                phycs = msg.data.phycs;
                break;
            case 'CheckCollision':
                postMessage({
                    obj: CheckCollision(msg.data.obj,true),
                    cb: msg.data.cb,
                    id: msg.data.id,
                    expd: msg.data.expd
                });
                break;
            default:
                break;
        }
    }
}

function Start(){
    if(fixedLoop.inter != undefined){
        clearInterval(fixedLoop.inter);
    }
    fixedLoop.inter = setInterval(function(){
        //if(fixedLoop.changes){
            postMessage(phycs);
            fixedLoop.changes = false;
        //}
        if(!fixedLoop.running){
            fixedLoop.running = true;
            UpdatePhysics();
        }
    }, 1000/20);
}

function UpdatePhysics(){
    fixedLoop.lnm++;
    var currentLnm = fixedLoop.lnm;
    var objA;
    for(var i = 0; i < phycs.length; i++){

        objA = phycs[i];
        if(objA.lookAtTarget != undefined){
            objA.angularVelocity = 0;
            objA.lookAt(objA.lookAtTarget);
        }

        if(!objA.kinematic){
            CheckCollision(objA, false);
            objA.collider.checked = time.elapsedTime;

            objA.rotation += objA.angularVelocity * time.deltaTime;
            objA.rotation = objA.rotation%360;
            objA.angularVelocity *= objA.angularDrag;

            objA.velocity.x += objA.force.x/objA.mass;

            objA.velocity.y -= world.gravity;
            objA.velocity.y += objA.force.y/objA.mass;

            objA.setPos(objA.getPos().sum(objA.velocity.multiply(time.deltaTime)));
            if(objA.newtonian){
                for(var j = 0; j < phycs.length; j++){
                    var objB = phycs[j];
                    if(objB != objA){
                        if(objB.newtonian){
                            var dist = objB.getPos().substract(objA.getPos());
                            var dir = dist.normalized();
                            dist = dist.magnitude();
                            var f = constants.g*((objA.mass * objB.mass)/dist);
                            dir.scale(f);
                            objA.addForce(dir);
                        }
                    }
                }
            }
        }
        if(fixedLoop.break == currentLnm){
            break;
        }
    }
    if(fixedLoop.break != currentLnm){
        fixedLoop.changes = true;
    }
    fixedLoop.running = false;
}

function CheckCollision(obj, retObj){
    var objA = obj;
    var objB;
    var v3 = new $e.Vector2(0,0);
    objA.collisions = 0;
    for(var i = 0; i < phycs.length; i++){
        objB = phycs[i];
        //if(objB.collider.checked != time.elapsedTime || retObj){
        if(true){
            if(objB != objA && (!objA.kinematic || !objB.kinematic)){
                v3.copy(objB.getPos().substract(objA.getPos()));
                var dist = v3.magnitude();
                dist = dist - objA.collider.maxRadius - objB.collider.maxRadius;
                //$d.Log(dist);
                if((dist) < 0){

                    var Na, Nb, sep;
                    var contactPA, contactPB;
                    var trueCollide = false;
                    var circlepolygon = false;

                    //COLLISION CIRCLE-CIRCLE
                    if(objA.collider.type == 1 && objB.collider.type == 1){
                        if(retObj) return objB;
                        trueCollide = true;
                        //sep = objB.getpos().substract(objA.getPos());
                        var dir = objB.getPos().substract(objA.getPos()).normalized();
                        sep = dir.multiply(objA.getPos().substract(objB.getPos()).magnitude() - objA.collider.maxRadius - objB.collider.maxRadius);
                        Na = objA.getPos().substract(objB.getPos()).normalized();
                        Nb = objB.getPos().substract(objA.getPos()).normalized();
                        contactPA = dir.multiply(objA.collider.radius);
                        contactPB = dir.multiply(-objB.collider.radius);
                    } else if(objA.collider.type == 1 && (objB.collider.type == 0 || objB.collider.type == 2)){
                        //COLLISION CIRCLE-POLYGON
                        circlepolygon = true;
                        var closest = {
                            vertex: -1,
                            distance: vbn
                        };
                        if(closest.vertex == -1){
                            for(var j = 0; j < objB.collider.vertexs.length; j++){
                                var aV = objB.collider.vertexs[j].rrotate(objB.rotation).sum(objB.getPos());
                                var bV;
                                var p = objA.getPos();
                                if(j == objB.collider.vertexs.length - 1){
                                    bV = objB.collider.vertexs[0].rrotate(objB.rotation).sum(objB.getPos());
                                } else {
                                    bV = objB.collider.vertexs[j+1].rrotate(objB.rotation).sum(objB.getPos());
                                }
                                //var dist = (((aV.x - p.x)*(bV.y-p.y))-((aV.y-p.y)*(bV.x-p.x)))/(bV.substract(aV).magnitude());
                                var resp = pnt2line(p, aV, bV);
                                if(resp.dist < objA.collider.radius){
                                    if(closest.distance > resp.dist){
                                        closest.distance = resp.dist;
                                        closest.vertex = j;
                                        closest.dir = resp.nearest.substract(p).normalized();
                                        contactPB = resp.nearest.substract(objB.getPos());
                                        contactPA = closest.dir.multiply(objA.collider.radius);
                                    }
                                }
                            }
                        }
                        if(closest.vertex != -1){
                            if(retObj) return objB;
                            trueCollide = true;

                            //CIRCLE
                            //sep = closest.dir.multiply(objB.getPos().substract(objA.getPos()).magnitude() - objB.collider.maxRadius - objA.collider.maxRadius);
                            sep = closest.dir.multiply(closest.distance - objA.collider.maxRadius);
                            Na = objB.collider.normals[closest.vertex].clone();
                            Na.rotate(objB.rotation);

                            //POLYGON
                            MTDb = new $e.Vector2(0,0);
                            Nb = objA.getPos().substract(objB.getPos()).normalized();
                        }
                    } else if(objB.collider.type == 1 && (objA.collider.type == 0 || objA.collider.type == 2)){
                        //COLLISION POLYGON-CIRCLE
                        circlepolygon = true;
                        var closest = {
                            vertex: -1,
                            distance: vbn
                        };
                        if(closest.vertex == -1){
                            for(var j = 0; j < objA.collider.vertexs.length; j++){
                                var aV = objA.collider.vertexs[j].rrotate(objA.rotation).sum(objA.getPos());
                                var bV;
                                var p = objB.getPos();
                                if(j == objA.collider.vertexs.length - 1){
                                    bV = objA.collider.vertexs[0].rrotate(objA.rotation).sum(objA.getPos());
                                } else {
                                    bV = objA.collider.vertexs[j+1].rrotate(objA.rotation).sum(objA.getPos());
                                }
                                //var dist = ((aV.x - p.x)*(bV.y-p.y)-(aV.y-p.y)*(bV.x-p.x))/(bV.substract(aV).magnitude());
                                var resp = pnt2line(p, aV, bV);
                                if(resp.dist < objB.collider.radius){
                                    if(closest.distance > resp.dist){
                                        closest.distance = resp.dist;
                                        closest.vertex = j;
                                        closest.dir = resp.nearest.substract(p).normalized();
                                        contactPA = resp.nearest.substract(objA.getPos());
                                        contactPB = closest.dir.multiply(objB.collider.radius);
                                    }
                                }
                            }
                        }
                        if(closest.vertex != -1){
                            if(retObj) return objB;
                            trueCollide = true;

                            //CIRCLE
                            //sep = closest.dir.multiply(objA.getPos().substract(objB.getPos()).magnitude() - objA.collider.maxRadius - objB.collider.maxRadius);
                            sep = closest.dir.multiply(closest.distance - objB.collider.maxRadius);
                            Na = objA.collider.normals[closest.vertex].clone();
                            Na.rotate(objA.rotation);

                            //POLYGON
                            MTDb = new $e.Vector2(0,0);
                            Nb = objB.getPos().substract(objA.getPos()).normalized();
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
                        var ja, jb;
                        if(circlepolygon){
                            jb = rf * ((objA.velocity.multiply(objA.mass - objB.mass).sum(objB.velocity.multiply(objB.mass*2)).magnitude())/(objA.mass + objB.mass));
                            ja = rf * ((objB.velocity.multiply(objB.mass - objA.mass).sum(objA.velocity.multiply(objA.mass*2)).magnitude())/(objB.mass + objA.mass));
                        } else {
                            ja = rf * ((objA.velocity.multiply(objA.mass - objB.mass).sum(objB.velocity.multiply(objB.mass*2)).magnitude())/(objA.mass + objB.mass));
                            jb = rf * ((objB.velocity.multiply(objB.mass - objA.mass).sum(objA.velocity.multiply(objA.mass*2)).magnitude())/(objB.mass + objA.mass));
                        }
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
                            objB.setPos(objB.getPos().substract(sep));
                        } else if(objB.kinematic){
                            objA.setPos(objA.getPos().sum(sep));
                        } else {
                            //sep.scale(0.5);
                            objA.setPos(objA.getPos().sum(sep.multiply(objB.mass / (objB.mass + objA.mass))));
                            objB.setPos(objB.getPos().substract(sep.multiply(objA.mass / (objB.mass + objA.mass))));
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
    var bestProjection = -vbn;
    var bestVertex = new $e.Vector2(0,0);

    for(var i = 0; i < obj.collider.vertexs.length; i++)
    {
        var vr = obj.collider.vertexs[i].clone();
        vr.rotate(obj.rotation);
        var v = obj.getPos().sum(vr);
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
    var bestDistance = -vbn;
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
        var v = new $e.Vector2(vr.x + A.getPos().x, vr.y + A.getPos().y);

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
        var E = (A.collider.vertexs[I].rrotate(A.rotation).sum(A.getPos())).substract(A.collider.vertexs[J].rrotate(A.rotation).sum(A.getPos()));
        var N = Axis[iNumAxis++] = new $e.Vector2(-E.y, E.x);

        if (AxisSeparatePolygons(N, A, B))
            return false;
        J = I;
    }

    J = B.collider.vertexs.length - 1;
    for(var I = 0; I < B.collider.vertexs.length; I++)
    {
        var E = (B.collider.vertexs[I].sum(B.getPos()).rrotate(B.rotation)).substract(B.collider.vertexs[J].rrotate(B.rotation).sum(B.getPos()));
        var N = Axis[iNumAxis++] = new $e.Vector2(-E.y, E.x);

        if (AxisSeparatePolygons (N, A, B))
            return false;

        J = I;
    }

    // find the MTD among all the separation vectors
    var MTD = FindMTD(Axis, iNumAxis);

    // makes sure the push vector is pushing A away from B
    var D = A.getPos().substract(B.getPos());
    if (D.dot(MTD) < 0.0)
        MTD.scale(-1);

    return {
        intersect: true,
        mtd: MTD
    };
}

function CalculateInterval(Axis, P){
    var min, max;

    var d = Axis.dot(P.collider.vertexs[0].rrotate(P.rotation).sum(P.getPos()));
    min = max = d;
    for(var I = 0; I < P.collider.vertexs.length; I ++)
    {
        var d = (P.collider.vertexs[I].rrotate(P.rotation).sum(P.getPos())).dot(Axis);
        if (d < min)
            min = d;
        else
            if(d > max)
                max = d;
    }
    return {
        min: min,
        max: max
    };
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