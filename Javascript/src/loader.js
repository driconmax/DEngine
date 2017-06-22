/*

#DSV:1#

*/

var $loader = {};
(function($loader){
    $loader.script = function (name, url, local){
        this.name = name;
        this.url = url;
        this.size = 0;
        this.local = (local == undefined)? false : local;
    }
    var scripts = [];

    var filesChecked = 0;
    var totalBytes = 0;
    var lastLoadIndex = -1;
    var currentIndex = 0;
    var started = false;
    var inter;
    var error = false;

    $loader.addscript = function(item){
        scripts.push(item);
        if(item.local) filesChecked++;
    }

    $loader.addscripts = function(items){
        for(var i = 0; i < items.length; i++){
            var item = items[i];
            scripts.push(item);
            if(item.local) filesChecked++;
        }
    }

    $loader.start = function(){
        if(inter == undefined){
            for(var i = 0; i < scripts.length; i++){
                var item = scripts[i];
                if(!item.local){
                    (function(item){
                        fileheaders(item.url, function(headers) {
                            filesChecked++;
                            totalBytes += headers.size;
                            item.size = headers.size;
                            item.version = headers.version;
                        })
                    })(item);
                }
            }
            inter = setInterval(function(){
                if(filesChecked == scripts.length){
                    if(!started && $loader.onstart != undefined){
                        $loader.onstart({
                            totalbytes: totalBytes
                        });
                    }
                    started = true;
                    if(currentIndex == scripts.length){
                        clearInterval(inter);
                        $loader.progress = 100;
                        $loader.loaded = true;
                        if($loader.onload != undefined){
                            $loader.onload();
                        }
                    } else {
                        if(currentIndex != lastLoadIndex){
                            try{
                                lastLoadIndex = currentIndex;
                                var item = scripts[currentIndex];
                                if(item.local){
                                    var s = document.createElement("script");
                                    s.type = "application/javascript";
                                    s.src = item.url;
                                    var head = document.getElementsByTagName("head")[0];
                                    if(head == null || head == undefined){
                                        throw "The HTML tag HEAD is not defined";
                                    } else {
                                        head.appendChild(s);
                                        currentIndex++;
                                    }
                                } else {

                                    var req = new XMLHttpRequest();

                                    req.addEventListener("progress", function(event) {
                                        if (event.lengthComputable) {
                                            var percentComplete = Math.round(event.loaded / event.total * 100);
                                            $loader.progress = (100/scripts.length)*currentIndex + percentComplete/scripts.length;
                                            if($loader.onprogresschange != undefined){
                                                $loader.onprogresschange({
                                                    progress: $loader.progress,
                                                    current: {
                                                        fileindex: currentIndex+1,
                                                        name: scripts[currentIndex].name,
                                                        version: scripts[currentIndex].version,
                                                        size: event.total,
                                                        progress: percentComplete
                                                    },
                                                    totalfiles: scripts.length
                                                });
                                            }
                                        } else {
                                            //Can't compute total percent, unknown file size.
                                        }
                                    }, false);

                                    req.addEventListener("load", function(event) {
                                        var e = event.target;
                                        var s = document.createElement("script");
                                        s.type = "application/javascript";
                                        s.innerHTML = e.responseText;
                                        var head = document.getElementsByTagName("head")[0];
                                        if(head == null || head == undefined){
                                            throw "The HTML tag HEAD is not defined";
                                        } else {
                                            head.appendChild(s);
                                            currentIndex++;
                                        }
                                    }, false);

                                    req.open("GET", item.url);
                                    req.send();
                                }
                            } catch(e){
                                console.error("Loader error: " + e);
                            }
                        }
                    }
                }
            },100);
        } else {
            console.warn("Loader already started");
        }
    }

    $loader.stop = function(){
        if(inter != undefined){
            clearInterval(inter);
            console.warn("Loader stopped");
        } else {
            console.warn("The loader is not running");
        }
    }

    function fileheaders(url, callback) {
        var req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            if (this.readyState == this.DONE) {
                callback({
                    size: parseInt(req.getResponseHeader("Content-Length")),
                    version: req.getResponseHeader("Driconmax-Script-Version")
                });
            }
        };
        req.open("HEAD", url, true);
        req.send();
    }
})($loader)