import { loadShadersFromURLS, setupWebGL, buildProgramFromSources } from '../../libs/utils.js';
import { mat4, vec3, flatten, lookAt, ortho, mult } from '../../libs/MV.js';

import * as SPHERE from '../../libs/objects/sphere.js';
import * as CUBE from '../../libs/objects/cube.js';

/** @type {WebGL2RenderingContext} */
let gl;
let program;
let vao;

/** View and Projection matrices */
let mView;
let mProjection;

const edge = 2.0;

let instances = [];


function render(time) {
    window.requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    const u_ctm = gl.getUniformLocation(program, "u_ctm");
    gl.uniformMatrix4fv(u_ctm, false, flatten(mult(mProjection, mult(mView, mat4()))));

    for (let p of instances) {
        p(gl, program, gl.LINES)
    }
}



function setup(shaders) {
    const canvas = document.getElementById('gl-canvas');

    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = window.innerHeight;

    gl = setupWebGL(canvas);
    program = buildProgramFromSources(gl, shaders['shader.vert'], shaders['shader.frag']);

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.viewport(0, 0, canvas.width, canvas.height);

    mView = lookAt(vec3(0, 0, 0), vec3(-1, -1, -2), vec3(0, 1, 0));
    setupProjection();

    SPHERE.init(gl, program);
    CUBE.init(gl, program);

    function setupProjection() {
        if (canvas.width < canvas.height) {
            const yLim = edge * canvas.height / canvas.width;
            mProjection = ortho(-edge, edge, -yLim, yLim, -10, 10);
        }
        else {
            const xLim = edge * canvas.width / canvas.height;
            mProjection = ortho(-xLim, xLim, -edge, edge, -10, 10);
        }

    }

    document.getElementById("add_cube").addEventListener("click", function () {
        instances.push(CUBE.draw)
        const option = new Option("Cube" + object_instances.length);
        document.getElementById("object_instances").add(option);
    })

    document.getElementById("add_sphere").addEventListener("click", function () {
        instances.push(SPHERE.draw)
        const option = new Option("Sphere" + object_instances.length);
        document.getElementById("object_instances").add(option);
    })

    window.addEventListener("resize", function () {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = window.innerHeight;

        setupProjection();

        gl.viewport(0, 0, canvas.width, canvas.height);
    });


    window.requestAnimationFrame(render);
}

const shaderUrls = ['shader.vert', 'shader.frag'];

loadShadersFromURLS(shaderUrls).then(shaders => setup(shaders));