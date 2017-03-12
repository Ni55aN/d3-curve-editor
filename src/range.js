export class Range {

    constructor(a, b) {
        this.a = a;
        this.b = b;
    }

    clamp(value) {
        return Math.max(this.a, Math.min(this.b, value));
    }

    contains(value) {
        return this.a <= value && value <= this.b;
    }

    toArray() {
        return [this.a, this.b];
    }
}