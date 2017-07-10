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
		
		this.lala = new $e.Object2D("Lala", new $e.Vector2(400,300), 0, 0, 0, 0, 0);
		this.col = new $e.BoxCollider(10,10);
		this.lala.setCollider(this.col);
		this.lolo = $e.add2DObject(this.lala, -50/*, this.awa = [], 60*/);
    }
    
    //Called once per frame
    update(obj){
        for(var i = 0; i < this.modules.length; i++){
            this.modules[i].update(obj);
        }
    }
    
    addModule(module){
        this.modules.push(module);
        if(this.running){
            module.start();
        }
    }
    
}