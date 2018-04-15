import {Axes} from './axes';
import {CurvePoint} from './curve-point';

export class EditorView {

    constructor(editor, container) {
        
        this.editor = editor;
        
        var props = this.editor.properties;
        var range = props.range;
        
        this.x = d3.scaleLinear().domain(range[this.axis(0)].toArray());
        this.y = d3.scaleLinear().domain(range[this.axis(1)].toArray());
        
        this.container = d3.select(container)
            .classed('curve-editor', true)
            .attr('tabindex', 1);
        
        this.rect = this.container.append('rect')
            .attr('fill', 'transparent')
            .on('click', this.rectClick.bind(this));
        
        this.view = this.container.append('g');
        
        this.zoom = d3.zoom()
            .scaleExtent([0.5, 2])
            .on('zoom', () => {
                this.view.attr('transform', d3.event.transform);
                this.gX.call(this.xAxis.scale(d3.event.transform.rescaleX(this.x)));
                this.gY.call(this.yAxis.scale(d3.event.transform.rescaleY(this.y)));
            });
        
        this.container.call(this.zoom);
        
        this.xAxis = d3.axisBottom(this.x);
        this.yAxis = d3.axisLeft(this.y);
        
        this.gX = this.container.append('g');
        this.gY = this.container.append('g');
        
        this.valueline = d3.line()
            .curve(props.curve);
        
        this.coordSwitcher = this.container.append('text')
            .on('click', () => {
        
                if (props.dimension === 2)
                    throw new Error('dimension = 2');
        
                for (var i = 0; i < Axes.list.length; i++)
                    if (props.activeAxes === Axes.list[i]) {
                        props.activeAxes = Axes.list[(i + 1) % Axes.list.length];
                        break;
                    }
        
                this.coordSwitcher.text(() => {
                    return props.activeAxes.name;
                })
        
                this.resize();
        
            })
            .text(() => {
                return props.activeAxes.name;
            })
            .style('display', props.dimension > 2 ? 'block' : 'none')
            .classed('switcher', true);
        
        d3.select(window)
            .on('keydown.' + this.editor._id, () => {
                this.container.node() === document.activeElement ? this.editor.keydown() : null
            })
            .on('resize.' + this.editor._id, this.resize.bind(this));
        
        this.resize();
    }
    
    axis(i) {
        return this.editor.properties.activeAxes.indices[i];
    }

    getCoordinate(point, i) {
        return point[this.axis(i)];
    }

    setCoordinate(point, i, val) {
        point[this.axis(i)] = val;
    }

    resize() {
        var bbox = this.container.node().getBoundingClientRect();

        var [width, height] = [bbox.width, bbox.height]
        var margin = this.editor.properties.margin;
        
        var [w, h] = this.editor.properties.stretch ? [width, height] :
            [Math.max(height, width), Math.max(height, width)];
        
        this.x.range([0, w]);
        this.y.range([h, 0]);
    
        this.zoom.translateExtent([
            [-margin, -margin],
            [w + margin, h + margin]
        ]);

        this.container
            .attr('width', width)
            .attr('height', height);

        this.rect
            .attr('width', width)
            .attr('height', height);

        this.xAxis.ticks(Math.floor(height / Axes.tickMargin));
        this.yAxis.ticks(Math.floor(height / Axes.tickMargin));

        this.gX.attr('transform', 'translate(0,' + (height - margin) + ')').call(this.xAxis);
        this.gY.attr('transform', 'translate(' + margin + ', 0)').call(this.yAxis);

        this.zoom.scaleTo(this.container, 1);

        this.coordSwitcher
            .attr('x', width - 2 * Axes.tickMargin)
            .attr('y', Axes.tickMargin)

        this.update();
    }

    updatePath() {
        var path = this.view.selectAll('path')
            .data(this.editor.lines)
            .attr('d', this.valueline);

        path.exit().remove();
        
        var newPath = path.enter()
            .append('path')
            .classed('line', true);

        this.valueline
            .x(d => this.x(this.getCoordinate(d, 0)))
            .y(d => this.y(this.getCoordinate(d, 1)));

        newPath.merge(path)
            .attr('d', d => this.valueline(d.points))
            .attr('class', d => {
                return d === this.editor.active.line ? 'line active' : 'line';
            });
    }

    updatePoints() {
        var item = this.view.selectAll('circle')
            .data(this.editor.lines.reduce((a, b) => {
                return a.concat(b.points);
            }, []));

        item.exit().remove();

        var newItem = item.enter()
            .append('circle');

        newItem
            .on('click', point => this.editor.selectPoint(point))
            .call(d3.drag()
                .on('start', point => this.editor.selectPoint(point))   
                .on('drag', this.onDrag.bind(this)));

        item = newItem.merge(item);

        item
            .attr('cx', d => {
                return this.x(this.getCoordinate(d, 0));
            })
            .attr('cy', d => {
                return this.y(this.getCoordinate(d, 1));
            })
            .attr('r', d => d.radius)
            .attr('class', d => {
                var actClass = this.editor.active.point === d ? 'active' : '';
                var fixClass = d.isFixed() ? ' fixed' : '';

                return `point ${actClass}  ${fixClass}`;
            });

    }

    onDrag(d) {
        var position = d3.mouse(this.view.node());

        if (d.isFixed()) return;

        var range = this.editor.properties.range;
        var rangeX = range[this.axis(0)];
        var rangeY = range[this.axis(1)];
        
        this.setCoordinate(d, 0, rangeX.clamp(this.x.invert(position[0])));
        this.setCoordinate(d, 1, rangeY.clamp(this.y.invert(position[1])));

        this.editor.eventListener.trigger('change', this.editor.active);
        this.update();
    }

    addPoint() {
        if (!this.editor.active.line) {
            alert('Select the required line for adding points');
            return;
        }

        var props = this.editor.properties;
        var mouse = d3.mouse(this.view.node());
        var point = new CurvePoint();

        this.setCoordinate(point, 0, this.x.invert(mouse[0]));
        this.setCoordinate(point, 1, this.y.invert(mouse[1]));

        var range = props.range;
        var rangeX = range[this.axis(0)];
        var rangeY = range[this.axis(1)];

        if (!rangeX.contains(this.getCoordinate(point, 0)) ||
            !rangeY.contains(this.getCoordinate(point, 1))) {
            alert('Out of range');
            return;
        }

        var line = this.editor.active.line;
        var neighbor = line.getNeighbor(point, [this.axis(0), this.axis(1)], props.closed);

        if (props.dimension === 3) {
            var prev = line.points[neighbor];
            var next = line.points[neighbor + 1];
            var coord = (this.getCoordinate(prev, 2) + this.getCoordinate(next, 2) / 2);

            this.setCoordinate(point, 2, coord);
        }

        this.editor.addPoint(point, neighbor + 1);

    }

    update() {
        this.updatePath();
        this.updatePoints();
    }

    rectClick() {
        if (this.editor.properties.fixedCount === false)
            this.addPoint();
    }

}