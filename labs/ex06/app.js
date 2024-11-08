import { loadShadersFromURLS, loadShadersFromScripts, setupWebGL, buildProgramFromSources } from "../../libs/utils.js";
import { vec2, flatten } from "../../libs/MV.js";

/** @type {WebGLRenderingContext} */
var gl;
var program;
var vao;

const NTRIS = 10000;
const TRI_SCALE = 0.02;

function setup(shaders) {
    // Setup
    const canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas);

    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    function addTriangle() {
        const x = Math.random() * 2 - 1;
        const y = Math.random() * 2 - 1;

        const head = Math.random() * 2 * Math.PI;
        const x1 = x + Math.cos(head) * TRI_SCALE;
        const y1 = y + Math.sin(head) * TRI_SCALE;

        const head2 = head + Math.random() * Math.PI;
        const x2 = x1 + Math.cos(head2) * TRI_SCALE;
        const y2 = y1 + Math.sin(head2) * TRI_SCALE;

        vertices.push(vec2(x, y)); vertices.push(vec2(x1, y1)); vertices.push(vec2(x2, y2));
    }

    const vertices = [];
    for (let i = 0; i < NTRIS; i++) {
        addTriangle();
    }

    const aBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const a_position = gl.getAttribLocation(program, "a_position");
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position);

    gl.bindVertexArray(null);

    // Setup the viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Setup the background color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Call animate for the first time
    window.requestAnimationFrame(animate);
}

function animate() {
    window.requestAnimationFrame(animate);

    // Drawing code
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3 * NTRIS);
    gl.bindVertexArray(null);
}

loadShadersFromURLS(["shader.vert", "shader.frag"]).then(shaders => setup(shaders));
//setup(loadShadersFromScripts(["shader.vert", "shader.frag"]));