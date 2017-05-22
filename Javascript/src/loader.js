(function(){
    var script = function (name, url){
        this.name = name;
        this.url = url;
    }
    var scripts = [
        new script("Common", "http://cdn.driconmax.com.ar/DEngine/master/Javascript/src/common.js"),
        new script("Core", "http://cdn.driconmax.com.ar/DEngine/master/Javascript/src/core.js")
    ];
    for (var i = 0; i < scripts.length; i++) {
        try{
            var item = scripts[i];
            var x = document.createElement('script');
            x.src = item.url;
            x.type = "application/javascript";
            var head = document.getElementsByTagName("head")[0];
            if(head == null || head == undefined){
                throw "The HTML tag HEAD is not defined";
            } else {
                head.appendChild(x);
            }
        } catch(e){
            console.error("DEngine error: " + e);
        }
    }
})()
