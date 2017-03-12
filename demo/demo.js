 window.onload = function(){
     
        var event = new D3CE.Event();
      	var lines = [];
        lines.push(new D3CE.Line("#47a",[
                        new D3CE.CurvePoint(0,0).isFixed(true),
                      	new D3CE.CurvePoint(1,1)
                      ]));
        lines.push(new D3CE.Line("#fd3",[
                        new D3CE.CurvePoint(0.2,0),
                     	new D3CE.CurvePoint(1,0.4)
                      ]));
      
	  
       var editor = new D3CE.CurveEditor('editor', d3.curveCatmullRom,lines,{},event);
      
      	var event2 = new D3CE.Event();
        event2.onChange = function(line,point){
          editor2.update();
          editor3.update();
        }
        event2.onAdd = function(line,point){
          editor2.update();
          editor3.update();
        }
         
        event2.onRemove = function(line,point){
          editor2.update();
          editor3.update();
        }
        
       var lines2 = [];
        lines2.push(new D3CE.Line("#fd3",[
                        new D3CE.CurvePoint(0.2,0.8,0),
                     	new D3CE.CurvePoint(0.2,0.7,0.3),
          				new D3CE.CurvePoint(1,0.5,0)
                      ]));
        
      
      var editor2 = new D3CE.CurveEditor('editor2', d3.curveBasis,lines2,{},event2);
      var editor3 = new D3CE.CurveEditor('editor3', d3.curveBasis,lines2,{},event2);
      
        
      };