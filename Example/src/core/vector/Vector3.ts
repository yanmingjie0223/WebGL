/**
 * Constructor of Vector3
 * If opt_src is specified, new vector is initialized by opt_src.
 * @param opt_src source vector(option)
 */
class Vector3 {

    public elements: Float32Array;

    constructor(opt_src?: Array<number>) {
        var v = new Float32Array(3);
        if (opt_src) {
            v[0] = opt_src[0]; v[1] = opt_src[1]; v[2] = opt_src[2];
        }
        this.elements = v;
    }

    /**
     * Normalize
     * @return this
     */
    public normalize() {
        const v = this.elements;
        let c = v[0], d = v[1], e = v[2], g = Math.sqrt(c * c + d * d + e * e);
        if (g) {
            if (g == 1) return this;
        }
        else {
            v[0] = 0; v[1] = 0; v[2] = 0;
            return this;
        }
        g = 1 / g;
        v[0] = c * g;
        v[1] = d * g;
        v[2] = e * g;
        return this;
    };

}
