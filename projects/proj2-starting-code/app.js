import { lookAt, ortho, mat4, vec3, flatten, normalMatrix, mult, rotateY, rotateX} from '../../libs/MV.js';
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

let show_cmds = true;
let mode = null;
let projection = mat4();

let zoom = 10;
let aspect = 1.0;

// dimentions const
const TRUCK_LENGTH = 12;
const TRUCK_HEIGHT = TRUCK_LENGTH/8;
const TRUCK_WIDTH = TRUCK_LENGTH * 5/12;
let LADDER_LENGTH;

//action var
const ACTION_SPEED = 0.5;
let ladder_vert_angle = 5;
let ladder_hor_angle = 0;
let car_pos = 0;
let ladder_ext_pos = 1; 

// custom view
let theta = -25;
let gamma = 25;

front_view = lookAt(vec3(0, 0, DIST), vec3(0, 0, 0), vec3(0, 1, 0));
top_view = mult(front_view, rotateX(90));
left_view = mult(front_view, rotateY(90));
axo_view = mult(mult(front_view, rotateX(gamma)), rotateY(theta));
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

function clear_commands() {
    show_cmds ? document.getElementById("help_panel").style.display = "block": document.getElementById("help_panel").style.display = "none";
}

function toggle_view(view) {
    all_views = false;
    big_view = view;
}

function toggle_view_mode() { all_views = !all_views; }

function toggle_mode() { return mode == gl.TRIANGLES ? gl.LINES : gl.TRIANGLES; }

function raise_ladder(dir) {
    ladder_vert_angle += dir * ACTION_SPEED;
    if(ladder_vert_angle < 0) {
        ladder_vert_angle = 0; 
    }
    if (ladder_vert_angle > 85) {
        ladder_vert_angle = 85;
    }
}

function rotate_ladder(dir) {
    ladder_hor_angle += dir * ACTION_SPEED;
}

function extend_ladder(dir) {
    ladder_ext_pos += dir * ACTION_SPEED;
    if(ladder_ext_pos < 1) {
        ladder_ext_pos = 1; 
    }
    if (ladder_ext_pos > LADDER_LENGTH) {
        ladder_ext_pos = LADDER_LENGTH;
    }
}

function move_truck(dir) {
    car_pos += dir * ACTION_SPEED;
}

function update_axo_view() {
    let axo = axo_view;
    axo_view = mult(mult(front_view, rotateX(gamma)), rotateY(theta));
    if (big_view == axo){
        big_view = axo_view;
    }
}

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
            // view commands
            case 'h': show_cmds= !show_cmds;clear_commands(); break;
            case '0': toggle_view_mode(); break;
            case '1': toggle_view(front_view); break;
            case '2': toggle_view(left_view); break
            case '3': toggle_view(top_view); break;
            case '4': toggle_view(axo_view); break;
            case 'r': theta = -25; gamma = 25; update_axo_view(); zoom = 10; break;
            // draw commands
            case ' ': mode = toggle_mode(); break;
            // action commands
            case 'w': raise_ladder(1); break;
            case 's': raise_ladder(-1); break;
            case 'e': rotate_ladder(1); break;
            case 'q': rotate_ladder(-1); break;
            case 'o': extend_ladder(1); break;
            case 'p': extend_ladder(-1); break;
            case 'a': move_truck(-1); break;
            case 'd': move_truck(1); break;
            //custom view
            case 'ArrowLeft': ++theta; update_axo_view(); break;
            case 'ArrowRight': --theta; update_axo_view(); break;
            case 'ArrowUp': ++gamma;update_axo_view(); break;
            case 'ArrowDown': --gamma;update_axo_view( ); break;
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
    const WHEEL_RADIUS = TRUCK_LENGTH/12; //default = 1
    const WHEEL_WIDTH = TRUCK_WIDTH/4;    //default = 1
    // TODO: add rotation
    for (let i = -1; i <= 1; i += 2) { // left and right wheels
        for (let j = -1; j <= 1; j += 2) { // front and back wheels
    
            pushMatrix(); // rubber part
            multTranslation([(TRUCK_LENGTH/3) * j, -TRUCK_HEIGHT/3, ((TRUCK_WIDTH+WHEEL_WIDTH/2)/2)* i ]);
            
            pushMatrix(); // tire 
            multScale([WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH]);
            multRotationX(90);
            multRotationY(car_pos);
            updateModelView(gl, program, modelView());
            paint([0, 0, 0, 1]);
            TORUS.draw(gl, program, mode);
            paint([0.2, 0.2, 0.2, 1]);
            TORUS.draw(gl, program, gl.LINES);
            popMatrix(); // pop tire

            pushMatrix(); // differential 
            multRotationX(90); // rotate the cilinders horizontally
            multTranslation([0, -i*(WHEEL_RADIUS/4), 0]);

            pushMatrix(); // rim
            multScale([WHEEL_RADIUS*1.5, WHEEL_WIDTH * 0.5, WHEEL_RADIUS * 1.5]);
            updateModelView(gl, program, modelView());
            paint([0.5, 0.5, 0.5, 1]);
            CYLINDER.draw(gl, program, mode);
            paint([0.32, 0.32, 0.32, 1]);
            CYLINDER.draw(gl, program, gl.LINES);
            popMatrix(); // pop rim

            if(i == -1) { // only one cylinder needed/wheel pair
                pushMatrix(); // axles shafts
                multTranslation([0, TRUCK_WIDTH/2, 0]);
                multScale([WHEEL_RADIUS * 0.2, WHEEL_WIDTH * 3.8, WHEEL_RADIUS * 0.2]);
                updateModelView(gl, program, modelView());
                paint([0.5, 0.5, 0.5, 1]);
                CYLINDER.draw(gl, program, mode);
                paint([0.32, 0.32, 0.32, 1]);
                CYLINDER.draw(gl, program, gl.LINES);
                
                pushMatrix(); // engine and differential
                multScale([WHEEL_RADIUS * 3.5, WHEEL_WIDTH * 0.3, WHEEL_RADIUS * 3.5]);
                updateModelView(gl, program, modelView());
                paint([0.5, 0.5, 0.5, 1]);

                if(j == -1) {
                    CUBE.draw(gl, program, mode); //engine
                    paint([0.32, 0.32, 0.32, 1]);
                    CUBE.draw(gl, program, gl.LINES);
                    popMatrix(); // pop engine
                }
                else {
                    SPHERE.draw(gl, program, mode); //differential
                    paint([0.32, 0.32, 0.32, 1]);
                    SPHERE.draw(gl, program, gl.LINES);
                    popMatrix(); // pop differential
                }
                
                popMatrix(); // pop axles shafts

                if (j == 1) {
                    pushMatrix(); // driveshaft
                    multTranslation([-(TRUCK_LENGTH)/3, TRUCK_WIDTH/2, 0]);
                    multScale([TRUCK_LENGTH * 2/3, WHEEL_RADIUS * 0.2, WHEEL_RADIUS * 0.2]);
                    multRotationZ(90);
                    updateModelView(gl, program, modelView());
                    paint([0.5, 0.5, 0.5, 1]);
                    CYLINDER.draw(gl, program, mode);
                    paint([0.32, 0.32, 0.32, 1]);
                    CYLINDER.draw(gl, program, gl.LINES);
                    popMatrix(); //pop driveshaft
                }
                
            }

            popMatrix(); // pop differential

            pushMatrix(); // cover
            multTranslation([0, WHEEL_RADIUS * 1.15, 0]);
            multScale([WHEEL_RADIUS * 2.2, WHEEL_RADIUS*0.2, WHEEL_WIDTH * 0.5]);
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
    const WHEEL_COVER = (TRUCK_LENGTH/12) * 2.2;  //default = WHEEL_RADIUS * 2.2
    const BUMPER_WIDTH = TRUCK_WIDTH/8;           //default = 0.5

    for (let i = -1; i <= 1; i += 2) { // front and rear mirror
        pushMatrix(); 
        multTranslation([0, 0, i*(TRUCK_WIDTH/2 + BUMPER_WIDTH/2)]);

        pushMatrix(); //mid bumper
        const MID_BUMPER_LENGTH = TRUCK_LENGTH - TRUCK_LENGTH/3 - WHEEL_COVER;
        multScale([MID_BUMPER_LENGTH, TRUCK_HEIGHT, BUMPER_WIDTH]);
        updateModelView(gl, program, modelView());
        paint([0.9, 0.89, 0.89, 1]);
        CUBE.draw(gl, program, mode);
        paint([1, 1, 1, 1]);
        CUBE.draw(gl, program, gl.LINES);
        popMatrix(); // pop mid bumper    

        for (let j = -1; j <= 1; j += 2) { // left and right mirror
            pushMatrix(); // left/right bumper
            const LFT_RGT_BUMPER_LENGTH = TRUCK_LENGTH/2 - MID_BUMPER_LENGTH/2 - WHEEL_COVER;

            multTranslation([j*(MID_BUMPER_LENGTH/2 + WHEEL_COVER + LFT_RGT_BUMPER_LENGTH/2), 0, 0]);
            multScale([LFT_RGT_BUMPER_LENGTH, TRUCK_HEIGHT, BUMPER_WIDTH]);
            updateModelView(gl, program, modelView());
            paint([0.9, 0.89, 0.89, 1]);
            CUBE.draw(gl, program, mode);
            paint([1, 1, 1, 1]);
            CUBE.draw(gl, program, gl.LINES);
            popMatrix(); // pop left/right bumper
        }

        
        pushMatrix(); // front and rear bumper
        multTranslation([i*(TRUCK_LENGTH/2 + BUMPER_WIDTH/2),0, -i*(TRUCK_WIDTH/2 + BUMPER_WIDTH/2)]); 

        if (i == -1) {
            for (let j = -1; j <= 1; j += 2) {
            pushMatrix(); // front guard
            multTranslation([0, TRUCK_HEIGHT*1, j* BUMPER_WIDTH * 4]);
            
            pushMatrix(); // vertical guard
            multScale([BUMPER_WIDTH / 2, TRUCK_HEIGHT*1.3, BUMPER_WIDTH / 2]);
            updateModelView(gl, program, modelView());
            paint([0.9, 0.89, 0.89, 1]);
            CUBE.draw(gl, program, mode);
            paint([1, 1, 1, 1]);
            CUBE.draw(gl, program, gl.LINES);
            popMatrix(); // pop vertical guard

            pushMatrix(); // horizontal guard
            multTranslation([0, j * BUMPER_WIDTH * 0.75, -j* BUMPER_WIDTH * 4]);
            multScale([BUMPER_WIDTH/2, BUMPER_WIDTH/2, BUMPER_WIDTH*8]);
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
        multScale([BUMPER_WIDTH * 10, TRUCK_HEIGHT, BUMPER_WIDTH]);
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
    const CABIN_LENGTH = TRUCK_LENGTH/3;                  //default = 4
    const CABIN_HEIGHT = TRUCK_HEIGHT * 3;                //default = 4.5
    const BUMPER_WIDTH = TRUCK_WIDTH/8;                   //default = 1
    const CABIN_WIDTH  = TRUCK_WIDTH + BUMPER_WIDTH * 2;  //default = 5


    pushMatrix(); // cabin
    multTranslation([-TRUCK_LENGTH/3, CABIN_HEIGHT/2 + TRUCK_HEIGHT/2, 0]);

    pushMatrix(); // seats
    multScale([CABIN_LENGTH, CABIN_HEIGHT, CABIN_WIDTH]);
    updateModelView(gl, program, modelView());
    paint([188/255, 60/255, 70/255, 1]);
    CUBE.draw(gl, program, mode);
    paint([205/255, 0, 0.2, 1]);
    CUBE.draw(gl, program, gl.LINES);
    popMatrix(); // pop seats

    pushMatrix(); // front glass
    multTranslation([-CABIN_LENGTH/2, CABIN_HEIGHT/10, 0]);
    multScale([0.1, CABIN_HEIGHT*0.5, CABIN_WIDTH * 4/5]);
    updateModelView(gl, program, modelView());
    paint([190/255, 240/255, 1, 0.9]);
    CUBE.draw(gl, program, mode);
    paint([0, 200/255, 1, 1]);
    CUBE.draw(gl, program, gl.LINES);
    popMatrix(); // pop front glass

    for (let i = -1; i <= 1; i += 2) {  // mirror glass
        for (let j = 0; j <= 1; j ++) { //duplicate glass
            pushMatrix(); // side glass
            multTranslation([j*CABIN_LENGTH/2 - CABIN_LENGTH/5, CABIN_HEIGHT/9, i*CABIN_WIDTH/2]);
            multScale([(CABIN_LENGTH + 1)/3 - j*(CABIN_LENGTH*0.65), CABIN_HEIGHT*0.5, 0.1]);
            multRotationY(90);
            updateModelView(gl, program, modelView());
            paint([190/255, 240/255, 1, 0.9]);
            CUBE.draw(gl, program, mode);
            paint([0, 200/255, 1, 1]);
            CUBE.draw(gl, program, gl.LINES);
            popMatrix(); //pop side glass
        }

    }
    
    pushMatrix(); // connector
    multTranslation([(CABIN_LENGTH)/2 + CABIN_LENGTH/16, -CABIN_HEIGHT/16, 0]);
    multScale([CABIN_LENGTH/8, CABIN_HEIGHT * 0.875, TRUCK_WIDTH]);
    updateModelView(gl, program, modelView());
    paint([0.9, 0.89, 0.89, 1]);
    CUBE.draw(gl, program, mode);
    paint([1, 1, 1, 1]);
    CUBE.draw(gl, program, gl.LINES);
    popMatrix(); // pop connector

    popMatrix(); // pop cabin
}

function drawCargo() {

    const CARGO_LENGTH = TRUCK_LENGTH/1.6;              //default = 7.5
    const CARGO_HEIGHT = (TRUCK_HEIGHT * 3)*0.875;      //default = 3.9375
    const CARGO_WIDTH  = TRUCK_WIDTH + TRUCK_WIDTH/4;   //default = 6.25

    pushMatrix(); // Cargo set
    const CARGO_POS = TRUCK_LENGTH/6 + TRUCK_LENGTH/48; 
    multTranslation([CARGO_POS, CARGO_HEIGHT/2 + TRUCK_HEIGHT/2, 0]);
    
    pushMatrix(); // cargo block 
    multScale([CARGO_LENGTH, CARGO_HEIGHT, CARGO_WIDTH]);
    updateModelView(gl, program, modelView());
    paint([188/255, 60/255, 70/255, 1]);
    CUBE.draw(gl, program, mode);
    paint([205/255, 0, 0.2, 1]);
    CUBE.draw(gl, program, gl.LINES);
    popMatrix(); // pop cargo block

    pushMatrix(); // rotator 
    multTranslation([CARGO_LENGTH/5, CARGO_HEIGHT/2  + CARGO_HEIGHT/16, 0]);
    multRotationY(ladder_hor_angle);

    pushMatrix(); // rotator axle 
    multScale([CARGO_LENGTH/3, CARGO_HEIGHT/8, CARGO_WIDTH/2.5]);
    updateModelView(gl, program, modelView());
    paint([193/255, 81/255, 25/255, 1]);
    CYLINDER.draw(gl, program, mode);
    paint([173/255, 71/255, 10/255, 0.85]);
    CYLINDER.draw(gl, program, gl.LINES);
    popMatrix(); // pop rotator axle
    
    pushMatrix(); // ladder set 
    multTranslation([0, CARGO_HEIGHT/5, 0]);

    pushMatrix(); // ladder base 
    multScale([TRUCK_LENGTH/6.2, TRUCK_HEIGHT/1.5, TRUCK_WIDTH/2.95])
    updateModelView(gl, program, modelView());
    paint([225/255, 225/255, 225/255, 1]); 
    CUBE.draw(gl, program, mode);
    paint([0.62, 0.62, 0.62, 1]);
    CUBE.draw(gl, program, gl.LINES);
    popMatrix(); // pop ladder base

    pushMatrix(); // ladder
    multRotationZ(-ladder_vert_angle); // raise ladder

    for (let x = 0; x <= 1; x ++) { // 2 ladders
        for (let i = -1; i <= 1; i +=2) { // both sides of each ladder
            pushMatrix(); // lateral
            x == 0 ? multTranslation([-CARGO_LENGTH/1.7, 0, i * TRUCK_WIDTH/5]) : multTranslation([-CARGO_LENGTH/1.7 - ladder_ext_pos, TRUCK_HEIGHT*0.2, i * TRUCK_WIDTH/5])
            LADDER_LENGTH = TRUCK_LENGTH/1.4;
            multScale([LADDER_LENGTH + 1, LADDER_LENGTH/30, LADDER_LENGTH/30]);
            updateModelView(gl, program, modelView());
            paint([225/255, 225/255, 225/255, 1]);
            CUBE.draw(gl, program, mode);
            paint([0.62, 0.62, 0.62, 1]);
            CUBE.draw(gl, program, gl.LINES);
            popMatrix(); // pop lateral
        }

        const num_steps = 10;
        const offset = TRUCK_HEIGHT/1.5 + TRUCK_LENGTH/24;
        let step_dist = (LADDER_LENGTH - offset)/num_steps;
        for (let step = 0; y < num_steps; y ++) {
            pushMatrix(); // step
            x == 0 ? multTranslation([-offset - step_dist * step, 0, 0]) : multTranslation([-offset/2 - step_dist * step - ladder_ext_pos, TRUCK_HEIGHT*0.2, 0]);
            multScale([TRUCK_LENGTH/24, TRUCK_HEIGHT/7.5, TRUCK_WIDTH/2.5]);
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
    multTranslation([car_pos, TRUCK_HEIGHT, 0]);
    
    pushMatrix(); // truck floor
    multScale([TRUCK_LENGTH, TRUCK_HEIGHT, TRUCK_WIDTH]);
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
        gl.viewport(0, 0, canvas.width, canvas.HEIGHT);
        draw_scene(big_view);
    }
}

function render() {
    window.requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    draw_views();
}

loadShadersFromURLS(["shader.vert", "shader.frag"]).then(shaders => main(shaders));