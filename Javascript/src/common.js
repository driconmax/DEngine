/*

#DSV:0.5#

*/
/**
 * @file Common log and parse functions
 * @author Driconmax <driconmax@gmail.com>
 * @version 1.0
 *          
 * @module $d
*/

(function(window){

    'use strict';

    /**
     * The Common Object
     */
    var $d = new function(){
        var stats = {
            Logs: 0,
            Errors: 0,
            Warnings: 0
        }
        var drawer;

        /**
         * Gets the a format function
         *
         * @return {object}  The TimeStamp function
         */
        this.Date = function(){
            var date = new Date();
            return {

                /**
                 * Returns a string with the date formatted
                 * @memberof Date
                 * @return {string}  The formatted time
                 */
                TimeStamp: function(){
                    return  ((date.getHours() < 10)?"0":"")+date.getHours()+":" +
                    ((date.getMinutes() < 10)?"0":"")+date.getMinutes()+":" +
                    ((date.getSeconds() < 10)?"0":"")+date.getSeconds();
                }
            }
        }

        /**
         * Logs a string or object
         *
         * @param  {string|object} text The string or object to print
         */
        this.Log = function(text){
            if(typeof text === 'object'){
                console.log("["+this.Date().TimeStamp()+"] DEngine: ", text);
            } else {
                stats.Logs++;
                console.log("["+this.Date().TimeStamp()+"] DEngine: " + text);
                Draw(text, 0);
            }
        }

        /**
         * Logs a warning with a string or object
         *
         * @param  {string|object} text The string or object to print
         */
        this.LogWarning = function(text){
            stats.Warnings++;
            if(typeof text === 'object'){
                console.warn("["+this.Date().TimeStamp()+"] DEngine: error ", text);
                this.LogObject(text);
            } else {
                console.warn("["+this.Date().TimeStamp()+"] DEngine: " + text);
                Draw(text, 1);
            }
        }

        /**
         * Logs an error with a description and the error object
         *
         * @param  {string|object} text  The string or object description
         * @param  {object} [error] Error object
         */
        this.LogError = function(text, error){
            stats.Errors++;
            if(typeof text === 'object'){
                //this.LogObject(text);
                console.error("["+this.Date().TimeStamp()+"] DEngine: error ", text);
            } else {
                if(error != undefined){
                    console.error("["+this.Date().TimeStamp()+"] DEngine: " + text, error);
                } else {
                    console.error("["+this.Date().TimeStamp()+"] DEngine: " + text);    
                }
                Draw(text, 2);
            }
        }

        /**
         * Logs an object
         *
         * @param  {object} object The object to log
         */
        this.LogObject = function(object){
            stats.Logs++;
            this.Log("Object Debug");
            console.log(object);
        }

        /**
         * Prints the current stats of the Logs such as Log, Warning and Error counts
         *
         */
        this.Stats = function(){
            this.LogObject(stats);
        }

        /**
         * Formats miliseconds to HH:MM:SS.mm
         *
         * @param  {number} duration The miliseconds
         */
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

        /**
         * Sets an external drawer function to export the logs
         *
         * @param  {function} customDrawer The external function
         */
        this.SetDrawer = function(customDrawer){
            if(typeof drawer == "function"){
                drawer = customDrawer;
            }
        }

        /**
         * Validates the input of a function
         * An array object can be checked with array[type]
         *
         * @example
         * function test(value){
         *   return $d.ValidateInput(arguments, ["boolean"]);
         * }
         * //Returns true
         * test(true);
         * //Returns false and Error Log
         * test("A");
         * 
         * @example
         * function test(name, obj, vars, duration){
         *   return $d.ValidateInput(arguments, ["string","object","array[string]"],["number"]);
         * }
         * //Returns true
         * test("Test", {obj: 1}, ["Test1","Test2"]);
         * //Returns true
         * test("Test", {obj: 1}, ["Test1","Test2"], 1);
         * //Returns false and Error Log
         * test("Test", {obj: 1}, [1,2], 1);
         *
         * @param  {object[]} params        The function received params
         * @param  {string[]} types         The expected type of params
         * @param  {string[]} optionalTypes The optional type of params
         * @return {bool}               If the input is valid returns true, otherwise returns false
         */
        this.ValidateInput = function(params, types, optionalTypes){
            if(optionalTypes == undefined) optionalTypes = [];
            if(params.length > (types.length + optionalTypes.length)){
                $d.LogError("Invalid ammount of parameters, expected " + (types.length + optionalTypes.length) + " received " + params.length);
                return false;
            } else if(params.length < types.length) {
                $d.LogError("Invalid ammount of parameters, expected " + types.length + " received " + params.length);
                return false;
            } else {
                for (var i = 0; i < params.length; i++) {
                    if(i < types.length){
                        var item = types[i];
                    } else {
                        var item = optionalTypes[i-types.length];
                    }
                    if(item.indexOf("array") != -1){
                        if (typeof params[i] != "object" || params[i].length == undefined) {
                            $d.LogError("Invalid value, expected " + item + " received " + (typeof params[i]));
                            return false;
                        } else {
                            if(params[i].length > 0){
                                if(typeof params[i][0] != item.replace("array[","").replace("]","")){
                                    $d.LogError("Invalid array items type, expected " + item + " received array[" + (typeof params[i][0]) + "]");
                                }
                            }
                        }
                    } else {
                        if (typeof params[i] != item) {
                            $d.LogError("Invalid value, expected " + item + " received " + (typeof params[i]));
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        function Draw(text, type){
            if(drawer != undefined){
                drawer(text, type);
            }
        }

    }

    window.$d = $d;

})(window)
