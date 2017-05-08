(function(){
    var scripts = [
        {
            name: "MainScript",
            url: "https://raw.githubusercontent.com/driconmax/dengine/master/Javascript/main.js"
        }
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
                appendChild(x);
            }
        } catch(e){
            console.error("DEngine error: " + e);
        }
    }
})()
