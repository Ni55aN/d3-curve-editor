import {Axes} from './axes';
import {CurvePoint} from './curve-point';
import {EventListener} from './eventlistener'
import {Range} from './range';

export class CurveEditor {

    constructor(id, curve, lines, properties) {

        this.properties = Object.assign({
            dimention: lines[0].points[0].getDimention(),
            activeAxes: Axes.list[0],
            fixedCount: false,
            fixedAxis: null,
            stretch: false,
            closed: curve === d3.curveBasisClosed ||
                curve === d3.curveCardinalClosed ||
                curve === d3.curveCatmullRomClosed ||
                curve === d3.curveLinearClosed,
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

        this.svg = d3.select('svg#' + id);

        this.svg.classed('curve-editor', true)
            .attr('tabindex', 1);

        this.rect = this.svg.append('rect')
            .attr('fill', 'transparent')
            .on('click', this.rectClick.bind(this));

        this.view = this.svg.append('g');

        this.zoom = d3.zoom()
            .scaleExtent([0.5, 2])
            .on('zoom', () => {
                this.view.attr('transform', d3.event.transform);
                this.gX.call(this.xAxis.scale(d3.event.transform.rescaleX(this.x)));
                this.gY.call(this.yAxis.scale(d3.event.transform.rescaleY(this.y)));
            });

        this.svg.call(this.zoom);

        this.xAxis = d3.axisBottom(this.x);
        this.yAxis = d3.axisLeft(this.y);

        this.gX = this.svg.append('g');
        this.gY = this.svg.append('g');

        this.valueline = d3.line()
            .curve(curve);

        this.coordSwitcher = this.svg.append('text')
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
            .on('keydown.' + id, this.keydown.bind(this))
            .on('resize.' + id, this.resize.bind(this));

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
        var bbox = this.svg.node().getBoundingClientRect();

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

        this.svg
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
        this.zoom.scaleTo(this.svg, 1);

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
            .data(this.lines.reduce(function(a, b) {
                return a.concat(b.points);
            }, []));

        item.exit().remove();

        var new_item = item.enter()
            .append('circle');

        new_item
            .on('click', point => this.selectPoint(point))
            .call(d3.drag()
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
        if (this.svg.node() !== document.activeElement)
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