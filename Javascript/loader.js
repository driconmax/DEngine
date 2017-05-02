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
        document.getElementsByTagName("body")[0].appendChild(x);
    } catch(e){
        console.error("DEngine error: " + e);
    }
}
