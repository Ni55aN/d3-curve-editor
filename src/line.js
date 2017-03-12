export class Line {

    constructor(color, points, max) {
        this.color = color;
        this.points = points;
        this.max = max;

        if (points.length < 2)
            throw new Error("Need more points");

        if (!this.validDimention())
            throw new Error("Not all the points of the same dimension");

    }

    validDimention() {
        return this.points.every((point) => {
            return point.getDimention() == this.points[0].getDimention();
        });
    }

    insert(i, point) {
        if (!(point instanceof CurvePoint)) throw new Error("Invalid instance");
        if (this.points.length >= this.max) throw new Error("Max points");
        this.points.splice(i, 0, point);
    }

    remove(point) {

        if (this.points.length <= 2)
            throw new Error("You cannot remove the remaining 2 points");

        if (point.isFixed())
            throw new Error("This point is fixed");

        var index = this.points.indexOf(point);
        this.points.splice(index, 1);

        return this.points[Math.max(index - 1, 0)];
    }

    getNeighbor(point, axis, closed) {

        var minDistance = null;
        var index = -1;
        var count = this.points.length;

        var l = count - 1;

        if (closed)
            l = count;

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

    distToSegment(p, v, w, axis) {

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
        if (l2 == 0)
            return dist2(p, v);
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt(dist2(p, {
            x: v.x + t * (w.x - v.x),
            y: v.y + t * (w.y - v.y)
        }));
    }
}
