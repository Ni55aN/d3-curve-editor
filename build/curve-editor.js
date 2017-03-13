(function (exports) {
'use strict';

var Axes = {
    tickMargin: 40,
    list: [{
        name: "Front",
        indices: ['x', 'y', 'z']
    }, {
        name: "Right",
        indices: ['z', 'y', 'x']
    }, {
        name: "Top",
        indices: ['x', 'z', 'y']
    }]
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var CurvePoint = function () {
    function CurvePoint(x, y, z) {
        classCallCheck(this, CurvePoint);

        this.radius = 8;
        this.fixed = false;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    createClass(CurvePoint, [{
        key: "getDimention",
        value: function getDimention() {
            return this.z === undefined ? 2 : 3;
        }
    }, {
        key: "isFixed",
        value: function isFixed(val) {
            if (typeof val == "boolean") {
                this.fixed = val;
                return this;
            }
            return this.fixed;
        }
    }]);
    return CurvePoint;
}();

var Range = function () {
    function Range(a, b) {
        classCallCheck(this, Range);

        this.a = a;
        this.b = b;
    }

    createClass(Range, [{
        key: "clamp",
        value: function clamp(value) {
            return Math.max(this.a, Math.min(this.b, value));
        }
    }, {
        key: "contains",
        value: function contains(value) {
            return this.a <= value && value <= this.b;
        }
    }, {
        key: "toArray",
        value: function toArray$$1() {
            return [this.a, this.b];
        }
    }]);
    return Range;
}();

var CurveEditor = function () {
    function CurveEditor(id, curve, lines, properties, event) {
        var _this = this;

        classCallCheck(this, CurveEditor);


        this.properties = Object.assign({
            dimention: lines[0].points[0].getDimention(),
            activeAxes: Axes.list[0],
            fixedCount: false,
            fixedAxis: null,
            stretch: false,
            closed: curve === d3.curveBasisClosed || curve === d3.curveCardinalClosed || curve === d3.curveCatmullRomClosed || curve === d3.curveLinearClosed,
            margin: 25,
            range: {
                x: new Range(0, 1),
                y: new Range(0, 1),
                z: new Range(0, 1)
            }
        }, properties);

        this.lines = lines;
        this.event = event;
        this.active = {
            line: lines.length == 1 ? lines[0] : null,
            point: null
        };

        var range = this.properties.range;
        this.x = d3.scaleLinear().domain(range[this.axis(0)].toArray());
        this.y = d3.scaleLinear().domain(range[this.axis(1)].toArray());

        this.svg = d3.select('svg#' + id);

        this.svg.classed("curve-editor", true).attr("tabindex", 1);

        this.rect = this.svg.append("rect").attr("fill", "transparent").on("click", this.rectClick.bind(this));

        this.view = this.svg.append('g');

        this.zoom = d3.zoom().scaleExtent([0.5, 2]).on("zoom", function () {
            _this.view.attr("transform", d3.event.transform);
            _this.gX.call(_this.xAxis.scale(d3.event.transform.rescaleX(_this.x)));
            _this.gY.call(_this.yAxis.scale(d3.event.transform.rescaleY(_this.y)));
        });

        this.svg.call(this.zoom);

        this.xAxis = d3.axisBottom(this.x);
        this.yAxis = d3.axisLeft(this.y);

        this.gX = this.svg.append('g');
        this.gY = this.svg.append('g');

        this.valueline = d3.line().curve(curve);

        this.coordSwitcher = this.svg.append('text').on('click', function () {

            if (_this.properties.dimention === 2) throw new Error("dimention = 2");

            for (var i = 0; i < Axes.list.length; i++) {
                if (_this.properties.activeAxes === Axes.list[i]) {
                    _this.properties.activeAxes = Axes.list[(i + 1) % Axes.list.length];
                    break;
                }
            }_this.coordSwitcher.text(function () {
                return _this.properties.activeAxes.name;
            });

            _this.resize();
        }).text(function () {
            return _this.properties.activeAxes.name;
        }).style('display', this.properties.dimention > 2 ? "block" : "none").classed("switcher", true);

        d3.select(window).on("keydown." + id, this.keydown.bind(this)).on("resize." + id, this.resize.bind(this));

        this.resize();
    }

    createClass(CurveEditor, [{
        key: 'axis',
        value: function axis(i) {
            return this.properties.activeAxes.indices[i];
        }
    }, {
        key: 'getCoordinate',
        value: function getCoordinate(point, i) {
            return point[this.axis(i)];
        }
    }, {
        key: 'setCoordinate',
        value: function setCoordinate(point, i, val) {
            point[this.axis(i)] = val;
        }
    }, {
        key: 'resize',
        value: function resize() {
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

            this.svg.attr("width", width).attr("height", height);

            this.rect.attr("width", width).attr("height", height);

            this.xAxis.ticks(Math.floor(height / Axes.tickMargin));
            this.yAxis.ticks(Math.floor(height / Axes.tickMargin));

            this.gX.attr("transform", "translate(0," + (height - margin) + ")").call(this.xAxis);
            this.gY.attr("transform", "translate(" + margin + ", 0)").call(this.yAxis);

            this.x.range([0, w]);
            this.y.range([h, 0]);

            this.zoom.translateExtent([[-margin, -margin], [w + margin, h + margin]]);
            this.zoom.scaleTo(this.svg, 1);

            this.coordSwitcher.attr('x', width - 2 * Axes.tickMargin).attr('y', Axes.tickMargin);

            this.update();
        }
    }, {
        key: 'updatePath',
        value: function updatePath() {
            var _this2 = this;

            var path = this.view.selectAll("path").data(this.lines).attr('d', this.valueline);

            var new_path = path.enter().append("path").classed("line", true);

            this.valueline.x(function (d) {
                return _this2.x(_this2.getCoordinate(d, 0));
            }).y(function (d) {
                return _this2.y(_this2.getCoordinate(d, 1));
            });

            new_path.merge(path).attr('d', function (d) {
                return _this2.valueline(d.points);
            }).attr("class", function (d) {
                return d === _this2.active.line ? "line active" : "line";
            });
        }
    }, {
        key: 'updatePoints',
        value: function updatePoints() {
            var _this3 = this;

            var item = this.view.selectAll("circle").data(this.lines.reduce(function (a, b) {
                return a.concat(b.points);
            }, []));

            item.exit().remove();

            var new_item = item.enter().append('circle');

            new_item.on('click', function (point) {
                return _this3.selectPoint(point);
            }).call(d3.drag().on("drag", this.onDrag.bind(this)));

            item = new_item.merge(item);

            item.attr("cx", function (d) {
                return _this3.x(_this3.getCoordinate(d, 0));
            }).attr("cy", function (d) {
                return _this3.y(_this3.getCoordinate(d, 1));
            }).attr("r", function (d) {
                return d.radius;
            }).attr("class", function (d) {
                return "point " + (_this3.active.point === d ? "active" : "") + (d.isFixed() ? " fixed" : "");
            });
        }
    }, {
        key: 'onDrag',
        value: function onDrag(d) {
            var position = d3.mouse(this.view.node());
            if (d.isFixed()) return;

            var range = this.properties.range;

            var rangeX = range[this.axis(0)];
            this.setCoordinate(d, 0, rangeX.clamp(this.x.invert(position[0])));
            var rangeY = range[this.axis(1)];
            this.setCoordinate(d, 1, rangeY.clamp(this.y.invert(position[1])));

            this.event.onChange(this.active.line, this.active.point);
            this.update();
        }
    }, {
        key: 'update',
        value: function update() {
            this.updatePath();
            this.updatePoints();
        }
    }, {
        key: 'addPoint',
        value: function addPoint() {
            if (!this.active.line) {
                alert("Select the required line for adding points");
                return;
            }

            var mouse = d3.mouse(this.view.node());
            var point = new CurvePoint();
            this.setCoordinate(point, 0, this.x.invert(mouse[0]));
            this.setCoordinate(point, 1, this.y.invert(mouse[1]));

            var range = this.properties.range;
            var rangeX = range[this.axis(0)];
            var rangeY = range[this.axis(1)];
            if (!rangeX.contains(this.getCoordinate(point, 0)) || !rangeY.contains(this.getCoordinate(point, 1))) {
                alert("Out of range");
                return;
            }

            var neighbor = this.active.line.getNeighbor(point, [this.axis(0), this.axis(1)], this.properties.closed);

            if (this.properties.dimention === 3) {
                var prev = this.active.line.points[neighbor];
                var next = this.active.line.points[neighbor + 1];
                this.setCoordinate(point, 2, this.getCoordinate(prev, 2) + this.getCoordinate(next, 2) / 2);
            }

            this.active.line.insert(neighbor + 1, point);
            this.event.onAdd(this.active.line, point);
            this.selectPoint(point);
        }
    }, {
        key: 'rectClick',
        value: function rectClick() {
            if (this.properties.fixedCount === false) this.addPoint();
        }
    }, {
        key: 'selectPoint',
        value: function selectPoint(point) {
            this.active.line = this.lines.find(function (line) {
                return line.points.indexOf(point) !== -1;
            });
            this.active.point = point;
            this.update();
        }
    }, {
        key: 'keydown',
        value: function keydown() {
            if (this.svg.node() !== document.activeElement) return;

            switch (d3.event.keyCode) {
                case 46:

                    if (this.active.point === null) break;

                    try {
                        var prev = this.active.line.remove(this.active.point);
                        this.event.onRemove(this.active.line, this.active.point);
                        this.selectPoint(prev);
                    } catch (e) {
                        alert(e.message);
                    }
                    break;
            }
        }
    }]);
    return CurveEditor;
}();

var Event = function Event() {
    classCallCheck(this, Event);

    this.onAdd = function () {};
    this.onRemove = function () {};
    this.onChange = function () {};
};

var Line = function () {
    function Line(color, points, max) {
        classCallCheck(this, Line);

        this.color = color;
        this.points = points;
        this.max = max;

        if (points.length < 2) throw new Error("Need more points");

        if (!this.validDimention()) throw new Error("Not all the points of the same dimension");
    }

    createClass(Line, [{
        key: "validDimention",
        value: function validDimention() {
            var _this = this;

            return this.points.every(function (point) {
                return point.getDimention() == _this.points[0].getDimention();
            });
        }
    }, {
        key: "insert",
        value: function insert(i, point) {
            if (!(point instanceof CurvePoint)) throw new Error("Invalid instance");
            if (this.points.length >= this.max) throw new Error("Max points");
            this.points.splice(i, 0, point);
        }
    }, {
        key: "remove",
        value: function remove(point) {

            if (this.points.length <= 2) throw new Error("You cannot remove the remaining 2 points");

            if (point.isFixed()) throw new Error("This point is fixed");

            var index = this.points.indexOf(point);
            this.points.splice(index, 1);

            return this.points[Math.max(index - 1, 0)];
        }
    }, {
        key: "getNeighbor",
        value: function getNeighbor(point, axis, closed) {

            var minDistance = null;
            var index = -1;
            var count = this.points.length;

            var l = count - 1;

            if (closed) l = count;

            for (var i = 0; i < l; i++) {

                var p1 = this.points[i];
                var p2 = this.points[i + 1 == count ? 0 : i + 1];

                var segDistance = this.distToSegment(point, p1, p2, axis);
                if (minDistance === null || minDistance > segDistance) {
                    minDistance = segDistance;
                    index = i;
                }
            }

            return index;
        }
    }, {
        key: "distToSegment",
        value: function distToSegment(p, v, w, axis) {

            p = {
                x: p[axis[0]],
                y: p[axis[1]]
            };
            v = {
                x: v[axis[0]],
                y: v[axis[1]]
            };
            w = {
                x: w[axis[0]],
                y: w[axis[1]]
            };

            function dist2(v, w) {
                return Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
            }

            var l2 = dist2(v, w);
            if (l2 == 0) return dist2(p, v);
            var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
            t = Math.max(0, Math.min(1, t));
            return Math.sqrt(dist2(p, {
                x: v.x + t * (w.x - v.x),
                y: v.y + t * (w.y - v.y)
            }));
        }
    }]);
    return Line;
}();

exports.Axes = Axes;
exports.CurvePoint = CurvePoint;
exports.CurveEditor = CurveEditor;
exports.Event = Event;
exports.Line = Line;
exports.Range = Range;

}((this.D3CE = this.D3CE || {})));
