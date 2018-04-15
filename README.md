D3 Curve Editor [![Build Status](https://travis-ci.org/Ni55aN/d3-curve-editor.svg?branch=master)](https://travis-ci.org/Ni55aN/d3-curve-editor)
====
#### JavaScript library for editing curves
![curve editor](http://svgshare.com/i/3vs.svg)

### Usage
Include it in your html:
```html
<script src="https://cdn.jsdelivr.net/npm/d3@4.10.2/build/d3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/d3-curve-editor@0.2.0/build/d3-curve-editor.min.js"></script>
<link  href="https://cdn.jsdelivr.net/npm/d3-curve-editor@0.2.0/build/d3-curve-editor.css" rel="stylesheet" type="text/css"></link>
```
Or install from NPM
```js
import * as D3CE from 'd3-curve-editor';
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
var container = querySelector('#editor');

var editor = new D3CE.CurveEditor(container,lines,{curve: d3.curveCatmullRom});
editor.eventListener.on('change',()=>{});
```
For details see [demo](https://codepen.io/Ni55aN/pen/Zavjxv)

### Dependencies
  - [D3.js](https://github.com/d3/d3)


License
----
MIT
