class CurvePoint {

    constructor(x, y, z) {
        this.radius = 8;
        this.fixed = false;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    getDimention() {
        return this.z === undefined ? 2 : 3;
    }

    isFixed(val) {
        if (typeof val == "boolean") {
            this.fixed = val;
            return this;
        }
        return this.fixed;
    }
};