function Lerp(a,b,u) {
    return a + (b - a) * (1-u);
};

function Color(r,g,b){
	this.r = r;
	this.g = g;
	this.b = b;
}

Color.prototype.Lerp = function(a,b,l){
	return new Color(Lerp(a.r, b.r, l), Lerp(a.g, b.g, l), Lerp(a.b, b.b, l));
};


/*

var c1 = new Color(255, 255, 255);
var c2 = new Color(0, 0, 0);

var elem = document.getElementById("mai");
var inter = setInterval(function(){
	console.log(c2);
	c2 = c1.Lerp(c1,c2,0.01);
	elem.style.backgroundColor = "rgb("+Math.round(c2.r)+","+Math.round(c2.g)+","+Math.round(c2.b)+")";
}, 100);

 */