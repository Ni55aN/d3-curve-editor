import {Axes} from './axes';
import {EventListener} from './eventlistener'
import {Range} from './range';
import {EditorView} from './editorview';

export class CurveEditor {

    constructor(container, lines, properties = {}) {

        this._id = Math.random().toString(36).substr(2, 9);
        this.properties = Object.assign({
            dimention: lines[0].points[0].getDimention(),
            activeAxes: Axes.list[0],
            fixedCount: false,
            fixedAxis: null,
            stretch: false,
            curve: d3.curveBasis,
            closed: properties.curve === d3.curveBasisClosed ||
                properties.curve === d3.curveCardinalClosed ||
                properties.curve === d3.curveCatmullRomClosed ||
                properties.curve === d3.curveLinearClosed,
            margin: 25,
            range: {
                x: new Range(0, 1),
                y: new Range(0, 1),
                z: new Range(0, 1)
            }
        }, properties);
        this.lines = lines;
        this.eventListener = new EventListener();
        
        this.active = {
            line: null,
            point: null
        };

        this.view = new EditorView(this, container);
    }

    selectLine(line) {
        if (this.lines.indexOf(line) === -1) throw new Error('Line not found in this editor');
        
        this.active.line = line;
        this.view.update();
    }

    selectPoint(point) {
        this.active.line = this.lines.find(function(line) {
            return line.points.indexOf(point) !== -1;
        });
        
        this.active.point = point;
        this.view.update();
    }

    addPoint(point, position) {
        if (!this.active.line) throw new Error('Need an active line');
            
        this.active.line.insert(position, point);
        this.eventListener.trigger('add', this.active.line, point);
        this.view.update();
    }

    removePoint(point) {
        var activeLine = this.lines.find(function(line) {
            return line.points.indexOf(point) !== -1;
        });

        if (!activeLine) throw new Error('Point not found in any line');

        activeLine.remove(point);
        this.active.point = null;
        this.eventListener.trigger('remove', activeLine, point);
        this.view.update();
    }

    removeLine(line) {
        var index = this.lines.indexOf(line);

        if (index === -1)
            console.warn('this line was not found in the editor')
        else
            this.lines.splice(index, 1);
        
        this.eventListener.trigger('change');
        this.view.update();
    }

    keydown() {
        switch (d3.event.keyCode) {
        case 46:
            try {
                if (this.active.point !== null)
                    this.removePoint(this.active.point);
            } catch (e) {
                alert(e.message);
                console.warn(e);
            }
            break;
        }
    }
}