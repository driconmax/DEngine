(function(window){

    'use strict';

    var $d = {

        Date: function(){
            var date = new Date();
            return {
                TimeStamp: function(){
                    return date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
                }
            }
        },
        Log: function(text){
            if(typeof text === 'object'){
                this.LogObject(text);
            } else {
                console.log("["+this.Date().TimeStamp()+"] DEngine: " + text);
            }
        },
        LogWarning: function(text){
            if(typeof text === 'object'){
                this.LogObject(text);
            } else {
                console.warning("["+this.Date().TimeStamp()+"] DEngine: " + text);
                if(error != undefined){
                    this.LogObject(error);
                }
            }
        },
        LogError: function(text, error){
            if(typeof text === 'object'){
                this.LogObject(text);
            } else {
                console.error("["+this.Date().TimeStamp()+"] DEngine: " + text);
                if(error != undefined){
                    this.LogObject(error);
                }
            }
        },
        LogObject: function(object){
            this.Log("Object Debug");
            console.log(object);
        },
        CheckValue: function(params){
            
        }

    }

    window.$d = $d;

})(window)