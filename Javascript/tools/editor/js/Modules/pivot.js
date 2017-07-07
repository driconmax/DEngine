class NaviaEditorPivots extends NaviaBase 
{
	
	//Navia Starts here
	start() 
	{
		this.oldX = 0;
		this.oldY = 0;
		
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
		var objs = [this.moveXPivot, this.moveYPivot];
		if(!this.contains(obj.selected, objs))
			this.myObj = obj.selected;
		
		if(this.myObj[0] == null) return;
		
        var objPos = this.myObj[0].getPos();
		this.moveXPivot.setPos(objPos.sum(new $e.Vector2(49 / 2, 0)));
		this.moveYPivot.setPos(objPos.sum(new $e.Vector2(0, 49 / 2)));
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
		// Guardo la posicion del mouse
		var newX = ;//mouseX
		var newY = ;//mouseY

		// Calculo la diferencia entre la pisicion vieja y la nueva
		var diffX = newX - oldX;
		var diffY = newY - oldY;
		
		// Le sumo la diferencia al eje correspondiente
		switch(axis)
		{
			case "X":
					obj.setPos(obj.getPos().sum(new $e.Vector2(diffX, 0)));
					break;
			case "Y":
					obj.setPos(obj.getPos().sum(new $e.Vector2(0, diffY)));
					break;
			default:
					break;
		}

		// Actualizo la vieja posicion del mouse
		this.oldX = newX;
		this.oldY = newY;
	}
	
}