class SceneTree extends NaviaBase 
{
	
	//Navia Starts here
	start(obj) 
	{
		this.tree = {};
		//Creates a local copy
		//this.localObj = obj.objects.concat();
    }
    
    //Called once per frame
    update(obj)
	{
		this.localObjs = objs.objects.concat();
		processTree(this.localObjs, [null]);
    }

    processTree(objs, parents)
    {
    	
    	//Take out all the parents
    	/*for(var i = 0; i < objs.length; i++){
    		var obj = objs[i];
    		if(obj.parent == parents[parents.length-1]){
    			if(parents[parents.length-1] == null){
    				this.tree[obj.id + "||" + obj.name] = {};
    			} else {
    				var ind = 0;
    				var current = this.tree;
    				for(var x = 0; x < parents.length; x++){
    					current = current[parents[x]];
    				}
    			}
    			objs.splice(i,1);
    		}
    	}*/
    }

    updateTree()
    {
    	//<li><a href="#">1st level item</a></li> Single
    	/* Father
          <li>
            <input id="sub-group-1" type="checkbox" hidden />
            <label for="sub-group-1"><span class="fa fa-angle-right"></span> Second level</label>
            <ul class="group-list">
              //CHILDS
            </ul>
          </li>
    	 */
    }
	
}