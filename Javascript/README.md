# DEngine - Javascript

Javascript version.

## Implementation

Your HTML file must have a body with a canvas element

```html
<html>
    <head>
        <title>DEngine</title>
    </head>
    <body>
        <canvas id="mainCanvas" width=500 height=500></canvas>
        <script src="http://cdn.driconmax.com.ar/DEngine/master/Javascript/src/loader.min.js" type="application/javascript" ></script>
    </body>
</html>
```

### Offline

Include this line in your HTML file
```html
<script src="dengine/javascript/loader.min.js">
```

### Online

Include this line in your HTML file
```html
<script src="http://cdn.driconmax.com.ar/DEngine/master/Javascript/src/loader.min.js">
```

To test if everything is working try this

```javascript
$e.init(document.getElementById("mainCanvas"), function(){}, function(){})
$e.add2DObject(new $e.Object2D("Object 1", 20, 500, 5, 5), -50);
$e.add2DObject(new $e.Object2D("Object 2", 60, 500, 1, 5), -50);
```
