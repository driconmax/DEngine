(function(){
    var script = function (name, url){
        this.name = name;
        this.url = url;
    }
    var scripts = [
        new script("Common", "https://rawgit.com/driconmax/dengine/master/Javascript/common.js"),
        new script("Core", "https://rawgit.com/driconmax/dengine/master/Javascript/core.js")
    ];
    for (var i = 0; i < scripts.length; i++) {
        try{
            var item = scripts[i];
            var x = document.createElement('script');
            x.src = item.url;
            var head = document.getElementsByTagName("head")[0];
            if(head == null){
                throw "The HTML tag HEAD is not defined";
            } else {
                head.appendChild(x);
            }
        } catch(e){
            console.error("DEngine error: " + e);
        }
    }
})()
