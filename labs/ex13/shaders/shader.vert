#version 300 es

in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_ctm;

void main() {
    gl_Position = u_ctm * a_position;
}