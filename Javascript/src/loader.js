(function(){
    var script = function (name, url){
        this.name = name;
        this.url = url;
    }
    var scripts = [
        new script("Common", "http://cdn.driconmax.com.ar/DEngine/master/Javascript/src/common.js"),
        new script("Core", "http://cdn.driconmax.com.ar/DEngine/master/Javascript/src/core.js")
    ];

    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.onreadystatechange= function () {
        if (this.readyState == 'complete') helper();
    }
    script.onload= helper;
    script.src= 'helper.js';
    head.appendChild(script);

    var lastLoadIndex = -1;
    var currentIndex = 0;
    var inter = setInterval(function(){
        if(currentIndex == scripts.length){
            clearInterval(inter);
            $d.Log("Load complete");
        } else {
            if(currentIndex != lastLoadIndex){
                try{
                    lastLoadIndex = currentIndex;
                    console.log("Loading " + currentIndex + "/" + scripts.length);
                    var item = scripts[currentIndex];
                    var x = document.createElement('script');
                    x.src = item.url;
                    x.type = "application/javascript";
                    x.onreadystatechange = function () {
                        this.ddone = true;
                        if (this.ddone == undefined && (this.readyState == 'loaded' || this.readyState == 'complete')){
                            currentIndex++;
                        }
                    }
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
        }
    },100);
})()