/* Navia Engine Editor */

window.naviaEditor = new class NaviaEditor extends NaviaBase {
    
    constructor(){
        super();
        this.modules = [];
    }
    
    //Navia Starts here
    start() {
        super.start();
        $e.setBackground("#000");
        //Set up each module
        for(var i = 0; i < this.modules.length; i++){
            this.modules[i].start();
        }
    }
    
    //Called once each frame
    update(obj){
        for(var i = 0; i < this.modules.length; i++){
            this.modules[i].update();
        }
    }
    
    addModule(module){
        this.modules.push(module);
        if(this.running){
            module.start();
        }
    }
    
}