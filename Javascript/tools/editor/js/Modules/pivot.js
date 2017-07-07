class NaviaEditorPivots extends NaviaBase 
{
	
	//Navia Starts here
	start() 
	{
		this.oldX = 0;
		this.oldY = 0;
		this.newX = 0;
		this.newY = 0;
		this.currentAxis = "";
		
        this.moveXPivot = new $e.Object2D("moveXPivot", new $e.Vector2(0,0), 0, 0, 0, 0, 0);
		var texture = new $e.Texture("moveXPivotSprite", ["js/Modules/pivotX.png"], new $e.Vector2(49,11), 1, true);
		this.moveXPivot.texture = texture;
		this.moveXPivot.setPivot(new $e.Vector2(0,texture.height / 2));		
		this.moveXPivot.setCollider(new $e.BoxCollider(49,11));
		$e.add2DObject(this.moveXPivot, -49);
		
        this.moveYPivot = new $e.Object2D("moveYPivot", new $e.Vector2(0,0), 0, 0, 0, 0, 0);
		texture = new $e.Texture("moveXPivotSprite", ["js/Modules/pivotY.png"], new $e.Vector2(11,49), 1, true);
		this.moveYPivot.texture = texture;		
		this.moveYPivot.setPivot(new $e.Vector2(texture.width / 2,texture.height));
		this.moveYPivot.setCollider(new $e.BoxCollider(11,49));
		$e.add2DObject(this.moveYPivot, -49);
		
        //this.rotationPivot = new $e.Object2D("rotationPivot", new $e.Vector2(0,0), 0, 0, 0, 0, 0);
        //this.scaleXPivot = new $e.Object2D("scaleXPivot", new $e.Vector2(0,0), 0, 0, 0, 0, 0);
        //this.scaleYPivot = new $e.Object2D("scaleYPivot", new $e.Vector2(0,0), 0, 0, 0, 0, 0);
    }
    
    //Called once per frame
    update(obj)
	{		
		// Guardo la posicion del mouse
		this.newX = obj.mouse.pos.x; //mouseX
		this.newY = obj.mouse.pos.y; //mouseY
		
		// Guado la lista de seleccionados si no contiene algun pivot
		var objs = [this.moveXPivot, this.moveYPivot];
		if(!this.contains(obj.selected, objs))
			this.myObj = obj.selected;
				
		// Muevo el objeto si esta presionado el pivot
		if($e.getKey("KeyA")) // TODO: Hacer que esto sea con el click izquierdo del mouse
		{			
			if(this.myObj[0] == null) return;
			
			if(obj.over == this.moveXPivot && this.currentAxis != "Y")
				this.currentAxis = "X";
			else if(obj.over == this.moveYPivot && this.currentAxis != "X")
				this.currentAxis = "Y";			
			
			if(this.currentAxis == "") return;
			
			this.move(this.myObj[0], this.currentAxis);
		}
		else
		{
			this.currentAxis = "";
		}
		
		// Muevo los pivot con el objeto
		if(this.myObj[0] != null) 
		{
			var objPos = this.myObj[0].getPos();
			this.moveXPivot.setPos(objPos.sum(new $e.Vector2(49 / 2, 0)));
			this.moveYPivot.setPos(objPos.sum(new $e.Vector2(0, 49 / 2)));
		}
		
		// Actualizo la vieja posicion del mouse
		this.oldX = this.newX;
		this.oldY = this.newY;
    }
	
	contains(list, obj)
	{
		var lala = false;
		for (var i = 0; i < list.length; i++)
			for (var j = 0; j < obj.length; j++)
				if(list[i] == obj[j])
				{
					lala = true;
					break;
				}
		
		return lala;
	}
	
	move(obj, axis)
	{ 					
		// Calculo la diferencia entre la pisicion vieja y la nueva
		var diffX = this.newX - this.oldX;
		var diffY = this.newY - this.oldY;
		
		if(diffX > 100) diffX = 0;
		if(diffY > 100) diffY = 0;
		
		$d.Log(new $e.Vector2(diffX, diffY));
		// Le sumo la diferencia al eje correspondiente
		switch(axis)
		{
			case "X":
					var newPos = obj.getPos().sum(new $e.Vector2(diffX, 0));
					obj.setPos(newPos);
					break;
			case "Y":
					var newPos = obj.getPos().sum(new $e.Vector2(0, diffY));
					obj.setPos(newPos);
					break;
			default:
					break;
		}
	}
	
}