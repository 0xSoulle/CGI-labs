import { loadShadersFromURLS, setupWebGL, buildProgramFromSources } from '../../libs/utils.js';
import { mat4, vec3, flatten, lookAt, ortho, mult, translate, scalem, rotateX, rotateY, rotateZ } from '../../libs/MV.js';

import * as SPHERE from '../../libs/objects/sphere.js';
import * as CUBE from '../../libs/objects/cube.js';

/** @type {WebGLRenderingContext} */
let gl;

let program;

/** View and Projection matrices */
let mView;
let mProjection;

const edge = 2.0;

let instances = [];
let cnt = 0;

const interfaceElems = ['px', 'py', 'pz', 'sx', 'sy', 'sz', 'rx', 'ry', 'rz'];
const default_vals = [0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0];

function buildTransform(vals) {
    const [px, py, pz, sx, sy, sz, rx, ry, rz] = vals;

    const t = translate(px, py, pz);
    const r = mult(rotateZ(rz), mult(rotateY(ry), rotateX(rx)));
    const s = scalem(sx, sy, sz);
    const m = mult(t, mult(r, s));

    return m;
}

function render(time) {
    window.requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    const u_ctm = gl.getUniformLocation(program, "u_ctm");

    for (let p of instances) {
        const m = buildTransform(p.v)
        gl.uniformMatrix4fv(u_ctm, false, flatten(mult(mProjection, mult(mView, m))));
        p.obj(gl, program, gl.LINES)
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

    SPHERE.init(gl);
    CUBE.init(gl);

    const instance_list = document.getElementById('object_instances');

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

    function setupInterfaceState(enabled) {
        interfaceElems.forEach(
            id => document.getElementById(id).disabled = !enabled
        )

        document.getElementById('remove_instance').disabled = !enabled;
    }

    function resetTransform() {
        setValues(default_vals);
    }

    function setValues(vals) {
        interfaceElems.forEach((id, idx) => document.getElementById(id).value = vals[idx]);
    }

    function rebuildMModel() {

        const vals = interfaceElems.map(id => parseFloat(document.getElementById(id).value))
        const pos = instance_list.selectedIndex;
        instances[pos].v = vals;
    }

    document.getElementById("add_cube").addEventListener("click", function () {
        instances.push({ obj: CUBE.draw, v: [...default_vals] })
        const option = new Option("Cube" + cnt++);
        document.getElementById("object_instances").add(option);
        instance_list.selectedIndex = instances.length - 1;
        resetTransform();
        setupInterfaceState(true);
    })

    document.getElementById("add_sphere").addEventListener("click", function () {
        instances.push({ obj: SPHERE.draw, v: [...default_vals] })
        const option = new Option("Sphere" + cnt++);
        document.getElementById("object_instances").add(option);
        instance_list.selectedIndex = instances.length - 1;
        resetTransform();
        setupInterfaceState(true);
    })

    document.getElementById('remove_instance').addEventListener("click", function () {
        const pos = instance_list.selectedIndex;
        if (pos != -1) {
            instances.splice(pos, 1);
        }
        instance_list.remove(pos);
        instance_list.selectedIndex = Math.max(0, pos - 1);
        setValues(instances[instance_list.selectedIndex].v)
        setupInterfaceState(instance_list.options.length != 0);
    })

    window.addEventListener("resize", function () {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = window.innerHeight;

        setupProjection();

        gl.viewport(0, 0, canvas.width, canvas.height);
    });

    setupInterfaceState(false);

    interfaceElems.forEach(
        id => document.getElementById(id).addEventListener("change", function () {
            rebuildMModel();
        })
    );

    instance_list.addEventListener("change", function () {
        setValues(instances[instance_list.selectedIndex].v);
    })


    window.requestAnimationFrame(render);
}

const shaderUrls = ['shader.vert', 'shader.frag'];

loadShadersFromURLS(shaderUrls).then(shaders => setup(shaders));