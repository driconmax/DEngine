var $D = {

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
            console.log("["+this.Date().TimeStamp()+"] DEngine says: " + text);
        }
    },
    LogObject: function(object){
        this.Log("Object Debug");
        console.log(object);
    }

}
