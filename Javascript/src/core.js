(function(window){

    'use strict';

    var $e = new function(){
        var debug = false;
        var started = false;
        
        this.init = function(){
            started = true;
            console.log(this);
        }

    }

    window.$e = $e;


})(window)
