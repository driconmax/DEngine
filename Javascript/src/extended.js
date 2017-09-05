function Lerp(a,b,u) {
    return (1-a) + (b - a) * u;
};

function Color(r,g,b){
	this.r = r;
	this.g = g;
	this.b = b;
}

Color.prototype.Lerp = function(a,b,l){
	return new Color(Lerp(a.r, b.r, l), Lerp(a.g, b.g, l), Lerp(a.b, b.b, l));
};