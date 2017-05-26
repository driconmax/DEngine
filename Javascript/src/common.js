/*

#DSV:0.5#

*/

(function(window){

    'use strict';

    var $d = new function(){
        var stats = {
            Logs: 0,
            Errors: 0,
            Warnings: 0
        }
        var drawer;
        
        this.Date = function(){
            var date = new Date();
            return {
                TimeStamp: function(){
                    return date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
                }
            }
        }
        this.Log = function(text){
            if(typeof text === 'object'){
                this.LogObject(text);
            } else {
                stats.Logs++;
                console.log("["+this.Date().TimeStamp()+"] DEngine: " + text);
                Draw(text, 0);
            }
        }
        this.LogWarning = function(text){
            stats.Warnings++;
            if(typeof text === 'object'){
                this.LogObject(text);
            } else {
                console.warn("["+this.Date().TimeStamp()+"] DEngine: " + text);
                Draw(text, 1);
            }
        }
        this.LogError = function(text, error){
            stats.Errors++;
            if(typeof text === 'object'){
                this.LogObject(text);
            } else {
                console.error("["+this.Date().TimeStamp()+"] DEngine: " + text);
                Draw(text, 2);
                if(error != undefined){
                    this.LogObject(error);
                }
            }
        }
        this.LogObject = function(object){
            stats.Logs++;
            this.Log("Object Debug");
            console.log(object);
        }
        this.Stats = function(){
            this.LogObject(stats);
        }
        this.FormatMiliseconds = function(duration){
            var milliseconds = parseInt((duration%1000)/100),
                     seconds = parseInt((duration/1000)%60),
                     minutes = parseInt((duration/(1000*60))%60),
                       hours = parseInt((duration/(1000*60*60))%24);

            hours = (hours < 10) ? "0" + hours : hours;
            minutes = (minutes < 10) ? "0" + minutes : minutes;
            seconds = (seconds < 10) ? "0" + seconds : seconds;

            return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
        }
        this.SetDrawer = function(customDrawer){
            if(typeof drawer == "function"){
                drawer = customDrawer;
            }
        }
        
        
        function Draw(text, type){
            if(drawer != undefined){
                drawer(text, type);
            }
        }

    }

    window.$d = $d;

})(window)