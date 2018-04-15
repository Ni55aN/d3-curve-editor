export class CurvePoint {

    constructor(x, y, z) {
        this.radius = 8;
        this.fixed = false;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    getDimension() {
        return typeof this.z === 'undefined' ? 2 : 3;
    }

    getDimention() {
        console.warn('The getDimention() method was renamed to getDimension()')
        return this.getDimension();
    }

    isFixed(val) {
        if (typeof val === 'boolean') {
            this.fixed = val;
            return this;
        }
        return this.fixed;
    }
}