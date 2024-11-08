#version 300 es

in vec4 a_pos_start;
in vec4 a_pos_end;

uniform float u_t;

void main() {
    gl_Position = mix(a_pos_start, a_pos_end, u_t);
}
