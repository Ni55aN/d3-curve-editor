import {Axes} from './axes';
import {CurvePoint} from './curve-point';
import {EventListener} from './eventlistener'
import {Range} from './range';

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
            line: lines.length==1?lines[0]:null,
            point: null
        };

        var range = this.properties.range;

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
            .curve(this.properties.curve);

        this.coordSwitcher = this.container.append('text')
            .on('click', () => {

                if (this.properties.dimention === 2)
                    throw new Error('dimention = 2');

                for (var i = 0; i < Axes.list.length; i++)
                    if (this.properties.activeAxes === Axes.list[i]) {
                        this.properties.activeAxes = Axes.list[(i + 1) % Axes.list.length];
                        break;
                    }

                this.coordSwitcher.text(() => {
                    return this.properties.activeAxes.name;
                })

                this.resize();

            })
            .text(() => {
                return this.properties.activeAxes.name;
            })
            .style('display', this.properties.dimention > 2 ? 'block' : 'none')
            .classed('switcher', true);

        d3.select(window)
            .on('keydown.' + this._id, this.keydown.bind(this))
            .on('resize.' + this._id, this.resize.bind(this));

        this.resize();
    }

    axis(i) {
        return this.properties.activeAxes.indices[i];
    }

    getCoordinate(point, i) {
        return point[this.axis(i)];
    }

    setCoordinate(point, i, val) {
        point[this.axis(i)] = val;
    }

    resize() {
        var bbox = this.container.node().getBoundingClientRect();

        var width = bbox.width;
        var height = bbox.height;
        var margin = this.properties.margin;
        var w, h;

        if (!this.properties.stretch) {

            w = Math.max(height, width);
            h = Math.max(height, width);
        } else {
            w = width;
            h = height;
        }

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

        this.x.range([0, w]);
        this.y.range([h, 0]);

        this.zoom.translateExtent([
            [-margin, -margin],
            [w + margin, h + margin]
        ]);
        this.zoom.scaleTo(this.container, 1);

        this.coordSwitcher
            .attr('x', width - 2 * Axes.tickMargin)
            .attr('y', Axes.tickMargin)

        this.update();
    }

    updatePath() {
        var path = this.view.selectAll('path')
            .data(this.lines)
            .attr('d', this.valueline);

        var new_path = path.enter()
            .append('path')
            .classed('line', true);

        this.valueline
            .x((d) => {
                return this.x(this.getCoordinate(d, 0));
            })
            .y((d) => {
                return this.y(this.getCoordinate(d, 1));
            });

        new_path.merge(path)
            .attr('d', (d) => {
                return this.valueline(d.points);
            })
            .attr('class', (d) => {
                return d === this.active.line ? 'line active' : 'line';
            });
    }

    updatePoints() {
        var item = this.view.selectAll('circle')
            .data(this.lines.reduce(function (a, b) {
                return a.concat(b.points);
            }, []));

        item.exit().remove();

        var new_item = item.enter()
            .append('circle');

        new_item
            .on('click', point => this.selectPoint(point))
            .call(d3.drag()
                .on('start', (d) => { this.active.point = d; this.updatePoints()})   
                .on('drag', this.onDrag.bind(this)));

        item = new_item.merge(item);

        item.attr('cx', (d) => {
            return this.x(this.getCoordinate(d, 0));
        })
            .attr('cy', (d) => {
                return this.y(this.getCoordinate(d, 1));
            })
            .attr('r', function(d) {
                return d.radius
            })
            .attr('class', (d) => {
                return 'point ' + (this.active.point === d ? 'active' : '') + (d.isFixed() ? ' fixed' : '');
            });

    }

    onDrag(d) {
        var position = d3.mouse(this.view.node());

        if (d.isFixed()) return;

        var range = this.properties.range;

        var rangeX = range[this.axis(0)];

        this.setCoordinate(d, 0, rangeX.clamp(this.x.invert(position[0])));
        var rangeY = range[this.axis(1)];

        this.setCoordinate(d, 1, rangeY.clamp(this.y.invert(position[1])));

        this.eventListener.trigger('change', this.active.line, this.active.point);
        this.update();
    }

    update() {
        this.updatePath();
        this.updatePoints();
    }

    addPoint() {
        if (!this.active.line) {
            alert('Select the required line for adding points');
            return;
        }

        var mouse = d3.mouse(this.view.node());
        var point = new CurvePoint();

        this.setCoordinate(point, 0, this.x.invert(mouse[0]));
        this.setCoordinate(point, 1, this.y.invert(mouse[1]));

        var range = this.properties.range;
        var rangeX = range[this.axis(0)];
        var rangeY = range[this.axis(1)];

        if (!rangeX.contains(this.getCoordinate(point, 0)) ||
            !rangeY.contains(this.getCoordinate(point, 1))) {
            alert('Out of range');
            return;
        }

        var neighbor = this.active.line.getNeighbor(point, [this.axis(0), this.axis(1)], this.properties.closed);

        if (this.properties.dimention === 3) {
            var prev = this.active.line.points[neighbor];
            var next = this.active.line.points[neighbor + 1];

            this.setCoordinate(point, 2, (this.getCoordinate(prev, 2) + this.getCoordinate(next, 2) / 2));
        }

        this.active.line.insert(neighbor + 1, point);
        this.eventListener.trigger('add', this.active.line, point);
        this.selectPoint(point);

    }

    rectClick() {
        if (this.properties.fixedCount === false)
            this.addPoint();
    }

    selectPoint(point) {
        this.active.line = this.lines.find(function(line) {
            return line.points.indexOf(point) !== -1;
        });
        this.active.point = point;
        this.update();
    }

    keydown() {
        if (this.container.node() !== document.activeElement)
            return;

        switch (d3.event.keyCode) {
        case 46:

            if (this.active.point === null)
                break;

            try {
                var prev = this.active.line.remove(this.active.point);

                this.eventListener.trigger('remove', this.active.line, this.active.point);
                this.selectPoint(prev);
            } catch (e) {
                alert(e.message);
            }
            break;
        }
    }
}