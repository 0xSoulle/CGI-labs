#version 300 es

in uint index;
uniform(vec2())

void main() {
    gl_Position = vec4(float(index) * 0.2, 0.0f, 0.0f, 1.0f);
}