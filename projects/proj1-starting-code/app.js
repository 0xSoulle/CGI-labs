import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import * as dat from "../../libs/dat.gui.module.js";
import { vec2 } from "../../libs/MV.js";
import { vec4 } from "../../libs/MV.js";

var gl;
var canvas;
var vao;
var captured_points = [];
var curves = [];

var base_velocity = vec2(Math.random() * 0.019 + 0.01, Math.random() * 0.13 + 0.01);
var curve_type = 0; // default curve type B-Spline
var draw_program;
var req_color = 0;

// Create a GUI instance
const gui = new dat.GUI();

const params = {
    x_speed: base_velocity[0],
    y_speed: base_velocity[1],
    color: "#ffffff",
    num_segments: 7,
    displayLines: true, 
    displayPoints: true,
    toggleAnimation: true,
    toggleColisions: true
};

// Add controls to the GUI
const xspeedController = gui.add(params, 'x_speed', 0.01, 1).name('x-Speed');
const yspeedController = gui.add(params, 'y_speed', 0.01, 1).name('y-Speed');
const segmentController = gui.add(params, 'num_segments', 0, 100).step(1).name('# of Segments');
const colorController = gui.addColor(params, 'color').name('Color');
const displayLinesController = gui.add(params, 'displayLines').name('Display Lines');
const displayPointsController = gui.add(params, 'displayPoints').name('Display Points');
const toggleAnimationController = gui.add(params, 'toggleAnimation').name('Toggle Animation');
const toggleColisions = gui.add(params, 'toggleColisions').name('Toggle Colisions');

// Call the update function whenever a GUI control changes
xspeedController.onChange(set_speed);
yspeedController.onChange(set_speed); 
colorController.onChange(set_color);

function create_curve() {
    if (req_color === 0) {
        req_color = vec4(Math.random() + 0.061,Math.random() + 0.061,Math.random() + 0.061,Math.random() + 0.211);
    }

    if (captured_points.length > 3) {
        curves.push(new Curve(captured_points, req_color))
        console.log("Z KEY PRESSED. Creating curve with captured control points.");
    }
    captured_points = [];
    req_color = 0;
}

function clear_curves() {
    curves = [];
    console.log("C KEY PRESSED. Clearing curves.");
}

function  increment_segments() {
    params.num_segments += 1;
    console.log("INCREASING SEGMENTS: ", params.num_segments);
    segmentController.updateDisplay();
}

function decrement_segments() {
    if (params.num_segments > 0) {
        params.num_segments -= 1;
    }
    if (params.num_segments == 0) {
        console.log("!!! Minimum number of segments reached. !!!");
    }
    console.log("DECREASING SEGMENTS: ", params.num_segments);
    segmentController.updateDisplay();

}

function set_speed() {
    base_velocity = vec2(params.x_speed, params.y_speed);
}

function increase_speed() {
    console.log("INCREASING SPEED");
    base_velocity[0] += 0.03;
    base_velocity[1] += 0.03;
    params.x_speed = base_velocity[0];
    params.y_speed = base_velocity[1];
    xspeedController.updateDisplay();
    yspeedController.updateDisplay();
}

function decrease_speed() {
    console.log("DECREASING SPEED");
    base_velocity[0] -= 0.03;
    if(base_velocity[0] < 0) {
        console.log("!!! Minimum x-speed reached. !!!");
        base_velocity[0] = 0.001;
    }

    base_velocity[1] -= 0.03;
    if(base_velocity[1] < 0) {
        console.log("!!! Minimum y-speed reached. !!!");
        base_velocity[1] = 0.001;
    }
    params.x_speed = base_velocity[0];
    params.y_speed = base_velocity[1];
    xspeedController.updateDisplay();
    yspeedController.updateDisplay();
}

function toggle_animation() {
    if (params.toggleAnimation) {
        console.log("TOGGLING ANIMATION OFF");
    }
    else {
        console.log("TOGGLING ANIMATION ON");
    }
    params.toggleAnimation = !params.toggleAnimation;
    toggleAnimationController.updateDisplay();
}

function toggle_curve_points() {
    if(params.displayPoints) {
        console.log("HIDING CURVE POINTS");
    }
    else {
        console.log("SHOWING CURVE POINTS");
    }
    params.displayPoints = !params.displayPoints;
    displayPointsController.updateDisplay();
}

function toggle_curves() {
    if(params.displayLines) {
        console.log("HIDING CURVES");
    }
    else {
        console.log("SHOWING CURVES");
    }
    params.displayLines = !params.displayLines;
    displayLinesController.updateDisplay();
}

function set_curve() {
    curve_type = document.getElementById("curve_selector").value;
    console.log("SETTING CURVE TO: ", curve_type);
}

function hexToRgb(hex) {
    /*
        example: #b32f2f
        R:b3
        G:2f
        B:2f

        parseInt strings to integers with base 16
    */
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16); 

    return vec4(r,g,b, 1);
}

function set_color() {
    req_color = hexToRgb(params.color);
}

class Curve {
    constructor(control_points, color) {
        this.type = curve_type;
        this.control_points = control_points;
        // generate random point size and color (with threshold alpha)
        this.point_size = (Math.random() * 10) + 3;
        this.color = color; 

        this.pnts_acel = [];
        // speed variation for each control point
        this.control_points.forEach((pnt, index) => {
            this.pnts_acel[index] = vec2(Math.random() * 0.019, Math.random() * 0.013);
        });   
    }

    move(time) {
        this.control_points.forEach((pnt, index) => {
            this.control_points[index][0] += (base_velocity[0] * this.pnts_acel[index][0])* time;
            this.control_points[index][1] += (base_velocity[1] * this.pnts_acel[index][1])* time;

            if (params.toggleColisions) {
                // Check for boundary collision and reverse direction if necessary
                //x-axis
                if (this.control_points[index][0] < -1) {
                    this.control_points[index][0] = -1
                    this.pnts_acel[index][0] *= -1;
                }
                if (this.control_points[index][0] > 1) {
                    this.control_points[index][0] = 1
                    this.pnts_acel[index][0] *= -1;
                }
                // y-axis
                if (this.control_points[index][1] < -1) {
                    this.control_points[index][1] = -1
                    this.pnts_acel[index][1] *= -1;
                }
                if (this.control_points[index][1] > 1) {
                    this.control_points[index][1] = 1
                    this.pnts_acel[index][1] *= -1;
                }
            }
            // if meant to not respond to colisions transport points from one point of the screen to the another 
            else {
                if (this.control_points[index][0] < -1) {
                    this.control_points[index][0] = 1
                    
                }
                if (this.control_points[index][0] > 1) {
                    this.control_points[index][0] = -1
                }
                // y-axis
                if (this.control_points[index][1] < -1) {
                    this.control_points[index][1] = 1
                }
                if (this.control_points[index][1] > 1) {
                    this.control_points[index][1] = -1
                }
            }
            

        });
    }
}

/**
 * Resize event handler
 * 
 * @param {*} target - The window that has resized
 */
function resize(target) {
    // Aquire the new window dimensions
    const width = target.innerWidth;
    const height = target.innerHeight;

    // Set canvas size to occupy the entire window
    canvas.width = width;
    canvas.height = height;

    // Set the WebGL viewport to fill the canvas completely
    gl.viewport(0, 0, width, height);
}

function setup(shaders) {
    canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas, { alpha: true });

    // Create WebGL programs
    draw_program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);


    const indexes = [60000];
    for(let index = 0; index < 60000; index++) {
        indexes[index] = index;
    }
    
    const index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(indexes), gl.STATIC_DRAW);

    const index_loc = gl.getAttribLocation(draw_program, "index");
    gl.vertexAttribIPointer(index_loc, 1, gl.UNSIGNED_INT, 0, 0);
    gl.enableVertexAttribArray(index_loc)

    // Enable Alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Handle resize events 
    window.addEventListener("resize", (event) => {
        resize(event.target);
    });

    function get_pos_from_mouse_event(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / canvas.width * 2 - 1;
        const y = -((event.clientY - rect.top) / canvas.height * 2 - 1);
        return vec2(x, y);
    }

    function distance(p1, p2) {
        return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
    }

    
    var mouse_down = false;     // mouse down flag;
    var mouse_moved = false;    // mouse moved flag;

    //TODO: event listeners in separate

    // Handle mouse down events
    canvas.addEventListener("mousedown", (event) => {
        // set mouse down flag
        mouse_down = true;
        document.getElementById("inst1").style.color = "green";
        const pos = get_pos_from_mouse_event(canvas, event);
        console.log("point", pos);
        captured_points.push(pos);
        console.log("NEW CURVE");
    });

    // Handle mouse move events
    canvas.addEventListener("mousemove", (event) => {
        if (mouse_down) {
            document.getElementById("inst2").style.color = "green";
            mouse_moved = true;
                const pos = get_pos_from_mouse_event(canvas, event);
                if (captured_points.length == 0) {
                    captured_points.push(pos);
                    console.log("first point", pos);
                }
                else if (captured_points.length == 256) { 
                    console.log("!!! Maximum number of control points reached. !!!");
                    return;
                }
                else if (distance(captured_points[captured_points.length - 1], pos) > 0.13) {
                    captured_points.push(pos);
                    console.log("next point", pos);
                }
        }   
        
    });

    // Handle mouse up events
    canvas.addEventListener("mouseup", (event) => {
        mouse_down = false;
        document.getElementById("inst1").style.color = "white";
        if (mouse_moved) {
            document.getElementById("inst2").style.color = "white";
            create_curve();
            mouse_moved = false;
            console.log("END CURVE");
            
        }

    });

    // make functions accessible to window
    window.set_curve = set_curve;

    // Handle key down events
    window.addEventListener("keydown", (event) => {
        switch(event.key.toUpperCase()) {
            // draw curve with captured control points
            case "Z": {
                create_curve();
                break;
            }
            // clear curves
            case "C": {
                clear_curves();
                break;
            }
            // increase number of segments
            case "+": {
                increment_segments();
                break
            }
            // decrease number of segments
            case "-": {
                decrement_segments();
                break;
            }
            // increase speed of curves
            case ">": {
                increase_speed();
                break;
            }
            // decrease speed of curves
            case "<": {
                decrease_speed();
                break;
            }
            // toggle animation
            case " ": {
                toggle_animation();
                break;
            }
            // hide curve points
            case "P": {
                toggle_curve_points();	
                break;
            }
            // hide curves
            case "L": {
                toggle_curves();
                break;
            }
            default: {
                console.log("NO ACTION ASSOCIATED WITH KEY ", event.key);
            }   
        }
        

    });

    // control point buffer
    const cntrl_pnts_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cntrl_pnts_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(captured_points.flat()), gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    resize(window);

    gl.clearColor(0.0, 0.0, 0.0, 1);

    // Enable Alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    window.requestAnimationFrame(animate);
}

let last_time;

function animate(timestamp) {
    window.requestAnimationFrame(animate);    

    if (last_time === undefined) {
        last_time = timestamp;
    }
    // Elapsed time (in miliseconds) since last time here
    const elapsed = timestamp - last_time;


    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(draw_program);

    gl.bindVertexArray(vao);

    // send number of segments to the shader
    const u_n_segments_loc = gl.getUniformLocation(draw_program, 'u_n_segments');
    gl.uniform1i(u_n_segments_loc, params.num_segments);

    // send each curve information to the shader
    curves.forEach(curve => {
        // move curve points according to their speed
        if (params.toggleAnimation) {
            curve.move(elapsed);
        } 

        const u_crv_type_loc = gl.getUniformLocation(draw_program, 'u_curve_type'); 
        gl.uniform1i(u_crv_type_loc, curve.type);

        // send curve control points positions to the shader
        curve.control_points.forEach((pnt, index) => {
            const u_pnt_loc = gl.getUniformLocation(draw_program, `u_cntrl_pnts[${index}]`);
            gl.uniform2fv(u_pnt_loc, pnt);   
        });

        // send curve point size to the shader
        const u_point_size_loc = gl.getUniformLocation(draw_program, 'u_pnt_size');
        gl.uniform1f(u_point_size_loc, curve.point_size);

        // send curve color to the shader
        const u_color_loc = gl.getUniformLocation(draw_program, 'u_color');
        gl.uniform4fv(u_color_loc, curve.color);

        // draw lines flag
        if (params.displayLines) {        
            // Bezier curve
            if (curve.type == 2) {
                gl.drawArrays(gl.LINE_STRIP, 0, params.num_segments*(Math.floor((curve.control_points.length - 1)/3)) + 1);
            }
            else {
                // draw the curves with a ratio of n_segments to control points [S(N-3) + 1]
                gl.drawArrays(gl.LINE_STRIP, 0, params.num_segments*(curve.control_points.length - 3) + 1);
            }
        }
        // draw points flag
        if (params.displayPoints) {
            // Bezier curve
            if (curve.type == 2) {
                gl.drawArrays(gl.POINTS, 0, params.num_segments*(Math.floor((curve.control_points.length - 1)/3)) + 1);
            }
            else {
                gl.drawArrays(gl.POINTS, 0, params.num_segments*(curve.control_points.length - 3) + 1);
            }
        }

    });

    
    if (captured_points.length > 3) {
        if (req_color == 0) {
            var unfinished = new Curve(captured_points, vec4(1,1,1,1))
        }
        else{
            var unfinished = new Curve(captured_points, req_color)
        }

        const u_crv_type_loc = gl.getUniformLocation(draw_program, 'u_curve_type'); 
        gl.uniform1i(u_crv_type_loc, unfinished.type);

        // draw unfinished curve
        unfinished.control_points.forEach((pnt, index) => {
            const u_pnt_loc = gl.getUniformLocation(draw_program, `u_cntrl_pnts[${index}]`);
            gl.uniform2fv(u_pnt_loc, pnt);
        });

        // draw unfinished curve point size
        const u_point_size_loc = gl.getUniformLocation(draw_program, 'u_pnt_size');
        gl.uniform1f(u_point_size_loc, 7.0);

        // send undraw color to the shader
        const u_color_loc = gl.getUniformLocation(draw_program, 'u_color');
        gl.uniform4fv(u_color_loc, unfinished.color);
        //

        if (params.displayLines) {    
            // Bezier curve
            if (curve_type == 2) {
                gl.drawArrays(gl.LINE_STRIP, 0, params.num_segments*(Math.floor((captured_points.length - 1)/3)) + 1);
            }   
            else { 
                // draw the curves with a ratio of n_segments to control points [S(N-3) + 1]
                gl.drawArrays(gl.LINE_STRIP, 0, params.num_segments*(captured_points.length - 3) + 1);
            }
        }
        
        if (params.displayPoints) {
            // Bezier curve
            if (curve_type == 2) {
                gl.drawArrays(gl.POINTS, 0, params.num_segments*(Math.floor((captured_points.length - 1)/3)) + 1);
            }
            else {
                gl.drawArrays(gl.POINTS, 0, params.num_segments*(captured_points.length - 3) + 1);
            }
        }

    }

    gl.bindVertexArray(null);
    gl.useProgram(null);


    last_time = timestamp;
}

loadShadersFromURLS(["shader.vert", "shader.frag"]).then(shaders => setup(shaders))