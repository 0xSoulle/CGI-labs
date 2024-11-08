import { loadShadersFromURLS, loadShadersFromScripts, setupWebGL, buildProgramFromSources } from "../../libs/utils.js";
import { vec2, flatten } from "../../libs/MV.js";

/** @type {WebGLRenderingContext} */
var gl;
var program1, program2;
var vao;

function setup(shaders) {
    // Setup
    const canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas);

    program1 = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader_int.frag"]);
    program2 = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader_out.frag"]);

    const vertices = [vec2(-0.5, -0.5), vec2(0.5, -0.5), vec2(0, 0.5)];

    const aBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    let a_position = gl.getAttribLocation(program1, "a_position");
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


    gl.bindVertexArray(vao);

    gl.useProgram(program1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.useProgram(program2);
    gl.drawArrays(gl.LINE_LOOP, 0, 3);

    gl.bindVertexArray(null);
}

{
    const allshaders = ["shader.vert", "shader_int.frag", "shader_out.frag"];
    loadShadersFromURLS(allshaders).then(shaders => setup(shaders));
}