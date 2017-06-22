/* Navia Engine Base Class */

class NaviaBase {
    
    constructor(){
        super();
        this.running = false;
    }
    
    //Navia Starts here
    start() {
        this.running = true;
    }
    
    //Called once each frame
    update(obj){
        
    }
    
}