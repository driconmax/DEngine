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
		this.moveXPivot.collider.selectable = false;
		$e.add2DObject(this.moveXPivot, -49);
		
        this.moveYPivot = new $e.Object2D("moveYPivot", new $e.Vector2(0,0), 0, 0, 0, 0, 0);
		texture = new $e.Texture("moveXPivotSprite", ["js/Modules/pivotY.png"], new $e.Vector2(11,49), 1, true);
		this.moveYPivot.texture = texture;		
		this.moveYPivot.setPivot(new $e.Vector2(texture.width / 2,texture.height));
		this.moveYPivot.setCollider(new $e.BoxCollider(11,49));
		this.moveYPivot.collider.selectable = false;
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
		
		// Guado la lista de seleccionados
		this.myObj = obj.selected;
				
		// Muevo el objeto si esta presionado el pivot
		if($e.getKey("ClickLeft"))
		{
			if(this.currentAxis == ""){
				if(this.myObj[0] == null) {
					this.moveXPivot.setPos(new $e.Vector2(0,0));
					this.moveYPivot.setPos(new $e.Vector2(0,0));
					return;
				}
				
				if(obj.over == this.moveXPivot && this.currentAxis != "Y"){
					this.currentAxis = "X";
					this.initialOffset = obj.over.getPos().x - obj.mouse.pos.x;
				}
				else if(obj.over == this.moveYPivot && this.currentAxis != "X"){
					this.currentAxis = "Y";			
					this.initialOffset = obj.over.getPos().y - obj.mouse.pos.y;
				}
			} else {
				this.move(obj.mouse.pos, this.myObj[0], this.currentAxis, this.initialOffset);
			}
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
	
	move(mouse, obj, axis, offset)
	{ 					
		var newPos;
		switch(axis)
		{
			case "X":
					newPos = mouse.sum(new $e.Vector2(offset, 0));
					newPos.y = obj.getPos().y;
					break;
			case "Y":
					newPos = mouse.sum(new $e.Vector2(0, offset));
					newPos.x = obj.getPos().x;
					break;
			default:
					break;
		}
		obj.setPos(newPos);
	}
	
}