D3 Curve Editor
====
#### JavaScript library
![curve editor](https://github.com/Ni55aN/D3-Curve-editor/blob/master/demo/screenshot.png?raw=true)

### Dependencies
  - [D3.js](https://github.com/d3/d3)

### Usage
Download the library and styles. Include it in your html.
```html
<script src="js/curve-editor.min.js"></script>
<link  href="css/curve-editor.css" rel="stylesheet" type="text/css"></link>
```
Create SVG container
```html
<svg tabindex="1" id="editor"></svg>
```
Add lines
```js
var lines = [];
lines.push(new D3CE.Line("#47a",[
                     new D3CE.CurvePoint(0,0).isFixed(true),
                    new D3CE.CurvePoint(1,1)
            ]));
lines.push(new D3CE.Line("#fd3",[
                    new D3CE.CurvePoint(0.2,0),
                    new D3CE.CurvePoint(1,0.4)
            ]));
````      
Initialize editor
```js  
var editor = new D3CE.CurveEditor('editor', d3.curveCatmullRom,lines,{},new D3CE.Event());
```
For detail see [demo](https://github.com/Ni55aN/D3-Curve-editor/tree/master/demo)


License
----
MIT