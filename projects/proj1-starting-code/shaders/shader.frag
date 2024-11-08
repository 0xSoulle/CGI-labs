#version 300 es

precision mediump float;
uniform vec4 u_color;
out vec4 frag_color;

void main() {
    vec2 coord = gl_PointCoord * 2.0 - 1.0; // Convert to range [-1, 1]
    float r = length(coord);
    float angle = atan(coord.y, coord.x);
    float star = abs(cos(5.0 * angle)) * r;

    if (star > 0.5) {
        discard;
    }

    frag_color = u_color;
}