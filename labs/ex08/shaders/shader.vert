#version 300 es

uniform float u_dx;
in vec4 a_position;

void main() {
    gl_Position = a_position + vec4(u_dx, 0.0f, 0.0f, 0.0f);
}
