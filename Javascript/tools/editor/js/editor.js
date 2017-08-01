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
		
		this.lala = new $e.Object2D("Lala", new $e.Vector2(200,200), 0, 0, 0, 0, 0);
		this.lala.texture = new $e.Texture("point", ["js/spr_point.png"], new $e.Vector2(50,50), 1, true);
		this.lala.setCollider(new $e.BoxCollider(50,50));
		$e.add2DObject(this.lala, -50);
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