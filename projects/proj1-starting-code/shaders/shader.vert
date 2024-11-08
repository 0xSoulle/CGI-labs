#version 300 es

const uint MAX_CNTRLPTS = 256u;
uniform vec2 u_cntrl_pnts[MAX_CNTRLPTS];
uniform int u_n_segments;
uniform int u_curve_type;
uniform float u_pnt_size;
in uint index;  



vec2 b_spline(float t, vec2 p0, vec2 p1, vec2 p2, vec2 p3) {
    float t2 = t * t;
    float t3 = t2 * t;

    float b0 = (-t3 + 3.0f*t2 - 3.0f*t + 1.0f) / 6.0f;
    float b1 = (3.0f*t3 - 6.0f*t2 + 4.0f) / 6.0f;
    float b2 = (-3.0f *t3 + 3.0f * t2 + 3.0f*t + 1.0f) / 6.0f;
    float b3 = (t3 ) / 6.0f;

    return b0 * p0 + b1 * p1 + b2 * p2 + b3 * p3;
}

vec2 catmull_rom(float t, vec2 p0, vec2 p1, vec2 p2, vec2 p3) {
    float t2 = t * t;
    float t3 = t2 * t;

    float b0 = (-t3 + 2.0f*t2 - t) / 2.0f;
    float b1 = (3.0f*t3 - 5.0f*t2 + 2.0f) / 2.0f;
    float b2 = (-3.0f*t3 + 4.0f*t2 + t) / 2.0f;
    float b3 = (t3 - t2) / 2.0f;

    return b0 * p0 + b1 * p1 + b2 * p2 + b3 * p3;
}


vec2 bezier(float t, vec2 p0, vec2 p1, vec2 p2, vec2 p3) {
    float t2 = t * t;
    float t3 = t2 * t;

    float b0 = (-t3 + 3.0f*t2 -3.0f*t + 1.0f);
    float b1 = (3.0f*t3 - 6.0f*t2 + 3.0f*t);
    float b2 = (-3.0f*t3 + 3.0f*t2);
    float b3 = t3;

    return b0 * p0 + b1 * p1 + b2 * p2 + b3 * p3;
}


void main() {
    uint segment = index / uint(u_n_segments);
    gl_PointSize = u_pnt_size;


    float t = float(index %  uint(u_n_segments)) / float(u_n_segments);
    vec2 p0 = u_cntrl_pnts[int(segment)];
    vec2 p1 = u_cntrl_pnts[int(segment) + 1];
    vec2 p2 = u_cntrl_pnts[int(segment) + 2];
    vec2 p3 = u_cntrl_pnts[int(segment) + 3];

    vec2 u_pnt_pos = vec2(0.0, 0.0);
    switch(u_curve_type) {
        case 0:
            u_pnt_pos = b_spline(t, p0, p1, p2, p3);
            break;
        case 1:
            u_pnt_pos = catmull_rom(t, p0, p1, p2, p3);
            break;
        case 2:
            p0 = u_cntrl_pnts[int(segment)*3];
            p1 = u_cntrl_pnts[int(segment)*3 + 1];
            p2 = u_cntrl_pnts[int(segment)*3 + 2];
            p3 = u_cntrl_pnts[int(segment)*3 + 3];
            u_pnt_pos = bezier(t, p0, p1, p2, p3);
            break;
    }

    gl_Position = vec4(u_pnt_pos, 0.0, 1.0);

}
