import { loadShadersFromURLS, loadShadersFromScripts, setupWebGL, buildProgramFromSources } from "../../libs/utils.js";
import { vec2, flatten, add } from "../../libs/MV.js";

/** @type {WebGLRenderingContext} */
var gl;
var program;
var vao;

const N_VERTICES = 50000;
const SPEED = 0.01;

function setup(shaders) {
    // Setup
    const canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas, { alpha: true });

    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    const vertices = [];

    function generateRandomVertex() {
        var x = (Math.random() - 0.5) * 0.2;
        var y = (Math.random() - 0.5) * 0.2;
        return vec2(x, y);
    }

    function generateVertices(count) {
        let angle = 0;
        for (let i = 0; i < count; i++) {
            // Generate start position
            let delta = generateRandomVertex();
            // Generate end position
            let point = vec2(2 * i / count - 1, Math.sin(3 * angle));
            vertices.push(add(delta, point));
            angle += 2 * Math.PI / count;
            vertices.push(vec2(point));
        }
    }

    generateVertices(N_VERTICES);


    const aBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    vao = gl.createVertexArray(vao);
    gl.bindVertexArray(vao);

    const a_pos_start = gl.getAttribLocation(program, "a_pos_start");
    gl.vertexAttribPointer(a_pos_start, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(a_pos_start);

    const a_pos_end = gl.getAttribLocation(program, "a_pos_end");
    gl.vertexAttribPointer(a_pos_end, 2, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(a_pos_end);

    gl.bindVertexArray(null);

    // Setup the viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Enable Alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Setup the background color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Call animate for the first time
    window.requestAnimationFrame(animate);
}

function animate(time) {
    window.requestAnimationFrame(animate);

    // Drawing code
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    const uT = gl.getUniformLocation(program, "u_t");
    gl.uniform1f(uT, (1 + Math.sin(time * 0.004)) / 2);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.LINE_STRIP, 0, N_VERTICES);
    gl.bindVertexArray(null);
}

loadShadersFromURLS(["shader.vert", "shader.frag"]).then(shaders => setup(shaders));
