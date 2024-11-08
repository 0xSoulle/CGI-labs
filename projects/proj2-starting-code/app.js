import { lookAt, ortho, mat4, vec3, flatten, normalMatrix, mult, rotate} from '../../libs/MV.js';
import { loadShadersFromURLS, buildProgramFromSources, setupWebGL } from '../../libs/utils.js';
import { modelView, loadMatrix, pushMatrix, popMatrix, multTranslation, multScale, multRotationX,multRotationY,multRotationZ } from '../../libs/stack.js';

import * as CUBE from '../../libs/objects/cube.js';
import * as SPHERE from '../../libs/objects/sphere.js';
import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as PYRAMID from '../../libs/objects/pyramid.js';
import * as TORUS from '../../libs/objects/torus.js';

const DIST = 10;

let all_views = true;

let big_view, front_view, left_view, top_view, axo_view;

// turn this to bool so that its checked before a draw call => if mode is wireframe no double draws
let mode = null;
let projection = mat4();

let zoom = 10;
let aspect = 1.0;

// dimentions const
const TRUCK_WIDHT = 11;
const TRUCK_LENGHT = 4;
const TRUCK_HEIGHT = 5;

//action var
const ACTION_SPEED = 1;
let ladder_vert_angle = -5;
let ladder_hor_angle = 0;
let car_pos = 0;
let ladder_ext_pos = 1; 


front_view = lookAt(vec3(0, 0, DIST), vec3(0, 0, 0), vec3(0, 1, 0));
top_view = lookAt(vec3(0, DIST, 0), vec3(0, 0, 0), vec3(0, 0, -1));
left_view = lookAt(vec3(-DIST, 0, 0), vec3(0, 0, 0), vec3(0, 1, 0));
axo_view = lookAt(vec3(-DIST, DIST, DIST), vec3(0, 0, 0), vec3(0, 1, 0));
big_view = front_view;


/** @type{WebGL2RenderingContext} */
let gl;

/** @type{WebGLProgram} */
let program;

/** @type{HTMLCanvasElement} */
let canvas;


function updateModelView(gl, program, modelView) {
    const u_model_view = gl.getUniformLocation(program, "u_model_view");
    gl.uniformMatrix4fv(u_model_view, false, flatten(modelView));
    const u_normals = gl.getUniformLocation(program, "u_normals");
    gl.uniformMatrix4fv(u_normals, false, flatten(normalMatrix(modelView)));
}

function updateProjection(gl, program, projection) {
    const u_projection = gl.getUniformLocation(program, "u_projection");
    gl.uniformMatrix4fv(u_projection, false, flatten(projection));
}

function toggle_view_mode() { all_views = !all_views; }

function paint(color) {  
    gl.uniform4fv(gl.getUniformLocation(program, "u_base_color"), color);
}

function resize() {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    aspect = window.innerWidth / window.innerHeight;
}

function initialize_objects() {
    CUBE.init(gl);
    SPHERE.init(gl);
    CYLINDER.init(gl);
    PYRAMID.init(gl);
    TORUS.init(gl, 30, 30, 0.8, 0.2);
}

function main(shaders) {
    canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas);
    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    mode = gl.TRIANGLES;

    gl.clearColor(127/255, 181/255, 181/255, 1.0);

    gl.enable(gl.DEPTH_TEST);

    resize();
    window.addEventListener('keydown', function (event) {
        switch (event.key) {
            case '0': toggle_view_mode();
        }
    })
    window.addEventListener('resize', resize);
    window.addEventListener("wheel", function (event) {
        zoom *= 1 + (event.deltaY / 1000);
    });

    initialize_objects();

    // This is needed to let wireframe lines to be visible on top of shaded triangles
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);



    window.requestAnimationFrame(render);
}

function drawFloor() {
    let white = true
    for (let i = -10; i <= 10; i++) {  // horizontal 
        for (let j = -10; j <= 10; j++) { // vertical
            pushMatrix();
            multTranslation([i * 1, 0, j * 1]);
            multScale([1, 0.1,1]);
        
            if (white) {
                paint([0.85, 0.85, 0.85, 1]);
            }
            else {
                paint([22/255, 60/255, 55/255, 1]);
            }
            white = !white;

            // Draw cubes 
            updateModelView(gl, program, modelView());
            CUBE.draw(gl, program, mode);
            // Draw wireframe
            paint([0, 0, 0, 1]);
            CUBE.draw(gl, program, gl.LINES);
            popMatrix();
        }
    }
    

}
function drawWheels() {
    for (let i = -1; i <= 1; i += 2) { // left and right wheels
        for (let j = -1; j <= 1; j += 2) { // front and back wheels
            
            pushMatrix(); // rubber part
            multTranslation([3.5 * j, -0.5, 2.25 * i]);
            pushMatrix(); // tire 
            multRotationX(90);
            updateModelView(gl, program, modelView());
            paint([0, 0, 0, 1]);
            TORUS.draw(gl, program, mode);
            paint([0.2, 0.2, 0.2, 1]);
            TORUS.draw(gl, program, gl.LINES);
            popMatrix(); // pop tire

            pushMatrix(); //rim and driveshaftg part
            multRotationX(90);
            multTranslation([0, -i*0.2, 0]);

            pushMatrix(); // rim
            multScale([1.5, 0.5, 1.5]);
            updateModelView(gl, program, modelView());
            paint([0.5, 0.5, 0.5, 1]);
            CYLINDER.draw(gl, program, mode);
            paint([0.32, 0.32, 0.32, 1]);
            CYLINDER.draw(gl, program, gl.LINES);
            popMatrix(); // pop rim

            if(i == -1) { // only one cylinder needed/wheel pair
                pushMatrix(); // axles shafts
                multTranslation([0, 2, 0]);
                multScale([0.2, 3.6, 0.2]);
                updateModelView(gl, program, modelView());
                paint([0.5, 0.5, 0.5, 1]);
                CYLINDER.draw(gl, program, mode);
                paint([0.32, 0.32, 0.32, 1]);
                CYLINDER.draw(gl, program, gl.LINES);
                
                if(j == -1) {
                    pushMatrix(); // engine
                    multScale([3.5, 0.2, 3.5]);
                    updateModelView(gl, program, modelView());
                    paint([0.5, 0.5, 0.5, 1]);
                    CUBE.draw(gl, program, mode); //differential
                    paint([0.32, 0.32, 0.32, 1]);
                    CUBE.draw(gl, program, gl.LINES);
                    popMatrix(); // pop engine
                }
                else {
                    pushMatrix(); // differential
                    multScale([3.5, 0.2, 3.5]);
                    updateModelView(gl, program, modelView());
                    paint([0.5, 0.5, 0.5, 1]);
                    SPHERE.draw(gl, program, mode); 
                    paint([0.32, 0.32, 0.32, 1]);
                    SPHERE.draw(gl, program, gl.LINES);
                    popMatrix(); // pop differential
                }
                
                popMatrix(); // pop axles shafts

                if (j == 1) {
                    pushMatrix(); // driveshaft
                    multTranslation([-3.5, 2.05, 0]);
                    multScale([7, 0.2, 0.2]);
                    multRotationZ(90);
                    updateModelView(gl, program, modelView());
                    paint([0.5, 0.5, 0.5, 1]);
                    CYLINDER.draw(gl, program, mode);
                    paint([0.32, 0.32, 0.32, 1]);
                    CYLINDER.draw(gl, program, gl.LINES);
                    popMatrix(); //pop driveshaft
                }
                
            }

            popMatrix(); // pop differential part

            pushMatrix(); // cover
            multTranslation([0, 1.15, 0]);
            multScale([2.15, 0.2, 0.5]);
            updateModelView(gl, program, modelView());
            paint([0.9, 0.89, 0.89, 1]);
            CUBE.draw(gl, program, mode);
            paint([1, 1, 1, 1]);
            CUBE.draw(gl, program, gl.LINES);
            popMatrix(); // pop cover

            popMatrix(); // pop rubber
        }
    }

}

function drawBumper() {
    for (let i = -1; i <= 1; i += 2) { // front and rear mirror
        pushMatrix(); 
        multTranslation([0, 0, i*2.25]);

        pushMatrix(); //mid bumper
        multScale([4.85, 1.5, 0.5]);
        updateModelView(gl, program, modelView());
        paint([0.9, 0.89, 0.89, 1]);
        CUBE.draw(gl, program, mode);
        paint([1, 1, 1, 1]);
        CUBE.draw(gl, program, gl.LINES);
        popMatrix(); // pop mid bumper
            

        for (let j = -1; j <= 1; j += 2) { // left and right miror
            pushMatrix(); // left/right bumper
            multTranslation([j*5.05, 0, i * 0.01]);
            multScale([1, 1.5, 0.5]);
            updateModelView(gl, program, modelView());
            paint([0.9, 0.89, 0.89, 1]);
            CUBE.draw(gl, program, mode);
            paint([1, 1, 1, 1]);
            CUBE.draw(gl, program, gl.LINES);
            popMatrix(); // pop left/right bumper
        }
            
        pushMatrix(); // front and rear bumper
        multTranslation([i*5.75, 0, i*(-2.25)]); 

        if (i == -1) {
            for (let j = -1; j <= 1; j += 2) {
            pushMatrix(); // front guard
            multTranslation([0, 1.5, j*1.7]);
            
            pushMatrix(); // vertical guard
            multScale([0.25, 2.5, 0.25]);
            updateModelView(gl, program, modelView());
            paint([0.9, 0.89, 0.89, 1]);
            CUBE.draw(gl, program, mode);
            paint([1, 1, 1, 1]);
            CUBE.draw(gl, program, gl.LINES);
            popMatrix(); // pop vertical guard

            pushMatrix(); // horizontal guard
            multTranslation([0, j / 2 + 0.1, - j * 1.7]);
            multScale([0.25, 0.25, 3.2]);
            updateModelView(gl, program, modelView());
            paint([0.9, 0.89, 0.89, 1]);
            CUBE.draw(gl, program, mode);
            paint([1, 1, 1, 1]);
            CUBE.draw(gl, program, gl.LINES);
            popMatrix(); // pop horizontal guard

            popMatrix(); // pop front guard
            }
            
        }
        
        multRotationY(90);
        multScale([5, 1.5, 0.5]);
        updateModelView(gl, program, modelView());
        paint([0.9, 0.89, 0.89, 1]);
        CUBE.draw(gl, program, mode);
        paint([1, 1, 1, 1]);
        CUBE.draw(gl, program, gl.LINES);
        popMatrix(); // pop front/rear bumper

        popMatrix(); // pop bumpers
    }

}

function drawCabin() {
    pushMatrix(); // cabin
    multTranslation([-3.5, 2.75, 0]);
    pushMatrix(); // seats
    multScale([4, 4, 5]);
    updateModelView(gl, program, modelView());
    paint([188/255, 60/255, 70/255, 1]);
    CUBE.draw(gl, program, mode);
    paint([205/255, 0, 0.2, 1]);
    CUBE.draw(gl, program, gl.LINES);
    popMatrix(); // pop seats

    pushMatrix(); // front glass
    multTranslation([-2, 0.25, 0]);
    multScale([0.1, 2.5, 4]);
    updateModelView(gl, program, modelView());
    paint([190/255, 240/255, 1, 0.9]);
    CUBE.draw(gl, program, mode);
    paint([0, 200/255, 1, 1]);
    CUBE.draw(gl, program, gl.LINES);
    popMatrix(); // pop front glass

    for (let i = -1; i <= 1; i += 2) { // mirror glass
        for (let j = 0; j <= 1; j ++) { //duplicate glass
            pushMatrix(); // side glass
            multTranslation([-1 + j*2, 0.5, i*2.5]);
            multScale([1.5 - j/2, 2, 0.1]);
            multRotationY(90);
            updateModelView(gl, program, modelView());
            paint([190/255, 240/255, 1, 0.9]);
            CUBE.draw(gl, program, mode);
            paint([0, 200/255, 1, 1]);
            CUBE.draw(gl, program, gl.LINES);
            popMatrix(); // pop side glass
        
        }
    }
    
    pushMatrix(); // connector
    multTranslation([2.25, -0.25, 0]);
    multScale([0.5, 3.5, 4]);
    updateModelView(gl, program, modelView());
    paint([0.9, 0.89, 0.89, 1]);
    CUBE.draw(gl, program, mode);
    paint([1, 1, 1, 1]);
    CUBE.draw(gl, program, gl.LINES);
    popMatrix(); // pop connector

    popMatrix(); // pop cabin
}

function drawCargo() {
    pushMatrix(); // Cargo set 
    multTranslation([2.25, 2.5, 0]);

    pushMatrix(); // cargo block 
    multScale([6.5, 3.5, 5]);
    updateModelView(gl, program, modelView());
    paint([188/255, 60/255, 70/255, 1]);
    CUBE.draw(gl, program, mode);
    paint([205/255, 0, 0.2, 1]);
    CUBE.draw(gl, program, gl.LINES);
    popMatrix(); // pop cargo block

    pushMatrix(); // rotator 
    multTranslation([1.5, 2, 0]);
    multRotationY(ladder_hor_angle);

    pushMatrix(); // rotator axle 
    multScale([2.5, 0.5, 2.5]);
    updateModelView(gl, program, modelView());
    paint([193/255, 81/255, 25/255, 1]);
    CYLINDER.draw(gl, program, mode);
    paint([173/255, 71/255, 10/255, 0.85]);
    CYLINDER.draw(gl, program, gl.LINES);
    popMatrix(); // pop rotator axle
    
    pushMatrix(); // ladder set 
    multTranslation([0, 0.75, 0]);

    pushMatrix(); // ladder base 
    multScale([2, 1,1.5])
    updateModelView(gl, program, modelView());
    paint([225/255, 225/255, 225/255, 1]); 
    CUBE.draw(gl, program, mode);
    paint([0.62, 0.62, 0.62, 1]);
    CUBE.draw(gl, program, gl.LINES);
    popMatrix(); // pop ladder base

    pushMatrix(); // ladder
    multRotationZ(ladder_vert_angle); // raise ladder

    for (let x = 0; x <= 1; x ++) { // 2 ladders
        for (let i = -1; i <= 1; i +=2) { // both sides of each ladder
            pushMatrix(); // lateral
            x == 0 ? multTranslation([-4.5, 0, i*0.9]) : multTranslation([-4.5 - ladder_ext_pos, 0.3, i*0.9])
            multScale([10, 0.3, 0.3]);  
            updateModelView(gl, program, modelView());   
            paint([225/255, 225/255, 225/255, 1]);
            CUBE.draw(gl, program, mode);
            paint([0.62, 0.62, 0.62, 1]);
            CUBE.draw(gl, program, gl.LINES);
            popMatrix(); // pop lateral
        }

        for (let y = 0; y < 8; y ++) { // 8 steps on each ladder
            pushMatrix(); // step

            x == 0 ? multTranslation([-1.40 - 1.1 * y, 0, 0]) : multTranslation([-0.5 - 1.1 * y - ladder_ext_pos, 0.3, 0]);
            multScale([0.5, 0.2, 2]);
            updateModelView(gl, program, modelView());
            paint([225/255, 225/255, 225/255, 1]);
            CUBE.draw(gl, program, mode);
            paint([0.62, 0.62, 0.62, 1]);
            CUBE.draw(gl, program, gl.LINES);
            popMatrix(); // pop step
        }
        
    }

    popMatrix(); // pop ladder
    
    popMatrix(); // pop ladder set

    popMatrix(); // pop rotator

    popMatrix(); // pop cargo set
}

function drawFireTruck() {
    // BASE 

    pushMatrix(); // truck
    multTranslation([car_pos, 1.5, 0]);
    
    pushMatrix(); // truck floor
    multScale([11, 1.5, 4]);
    updateModelView(gl, program, modelView());
    paint([188/255, 60/255, 70/255, 1]);
    CUBE.draw(gl, program, mode);
    paint([205/255, 0, 0.2, 1]);
    CUBE.draw(gl, program, gl.LINES);
    popMatrix(); // pop truck floor
    
    // WHEELS
    drawWheels();
    
    // BUMPER
    drawBumper();

    // CABIN
    drawCabin();

    // CARGO
    drawCargo();

    popMatrix(); // pop truck
    
}


function draw_scene(view) {
    gl.useProgram(program);

    projection = ortho(-aspect * zoom, aspect * zoom, -zoom, zoom, -100, 100);
    updateProjection(gl, program, projection);

    loadMatrix(view);

    drawFloor();
    drawFireTruck();

}

function draw_views() {
    let hw = canvas.width / 2;
    let hh = canvas.height / 2;

    if (all_views) {
        // Draw on front view
        gl.viewport(0, hh, hw, hh);
        draw_scene(front_view);

        // Draw on top view
        gl.viewport(0, 0, hw, hh);
        draw_scene(top_view);

        // Draw on left view
        gl.viewport(hw, hh, hw, hh);
        draw_scene(left_view);

        // Draw of 4th view
        gl.viewport(hw, 0, hw, hh);
        draw_scene(axo_view);
    }
    else {
        gl.viewport(0, 0, canvas.width, canvas.height);
        draw_scene(axo_view);
    }
}

function render() {
    window.requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    draw_views();
}

loadShadersFromURLS(["shader.vert", "shader.frag"]).then(shaders => main(shaders));