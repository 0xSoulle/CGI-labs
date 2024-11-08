import * as THREE from '../../libs/three.module.js';

const PLANET_SCALE = 10;    // scale that will apply to each planet and satellite
const ORBIT_SCALE = 1/60;   // scale that will apply to each orbit around the sun

const SUN_DIAMETER = 1391900;
const SUN_DAY = 24.47; // At the equator. The poles are slower as the sun is gaseous

const MERCURY_DIAMETER = 4866*PLANET_SCALE;
const MERCURY_ORBIT = 57950000*ORBIT_SCALE;
const MERCURY_YEAR = 87.97;
const MERCURY_DAY = 58.646;

const VENUS_DIAMETER = 12106*PLANET_SCALE;
const VENUS_ORBIT = 108110000*ORBIT_SCALE;
const VENUS_YEAR = 224.70;
const VENUS_DAY = 243.018;

const EARTH_DIAMETER = 12742*PLANET_SCALE;
const EARTH_ORBIT = 149570000*ORBIT_SCALE;
const EARTH_YEAR = 365.26;
const EARTH_DAY = 1.0;

const MOON_DIAMETER = 3474*PLANET_SCALE;
const MOON_ORBIT = 363396*ORBIT_SCALE*60;
const MOON_YEAR = 28;
const MOON_DAY = 0;

const MARS_DIAMETER = 6760*PLANET_SCALE;
const MARS_ORBIT = 227840000*ORBIT_SCALE;
const MARS_YEAR = 686.98;
const MARS_DAY = 1.02708333;

const JUPITER_DIAMETER = 142984*PLANET_SCALE;
const JUPITER_ORBIT = 778547200*ORBIT_SCALE;
const JUPITER_YEAR = 4331.572;
const JUPITER_DAY = 0.4138889;

const SATURN_DIAMETER = 116464*PLANET_SCALE;
const SATURN_ORBIT = 1426666422*ORBIT_SCALE;
const SATURN_YEAR = 29*365;
const SATURN_DAY = 0.44583;

const VP_DISTANCE = EARTH_ORBIT;

let time=0;
let speed = 1/60.0;

let aspect;
let camera;

function setup() 
{
    const canvas = document.getElementById("gl-canvas");
    const renderer = new THREE.WebGL1Renderer({canvas});

    const fov = 80;
    aspect = 2;
    const near = 10000;
    const far = 5*VP_DISTANCE;
    const camera = new THREE.OrthographicCamera(-VP_DISTANCE*aspect, VP_DISTANCE*aspect, VP_DISTANCE, -VP_DISTANCE, near, far);
    //const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, VP_DISTANCE, VP_DISTANCE);
    camera.up.set(0,1,0);
    camera.lookAt(0,0,0);

    const scene = new THREE.Scene();

    {
        const color = 0xFFFFFF;
        const intensity = 3;
        const light = new THREE.PointLight(color, intensity);
        scene.add(light);
    }


    // Create the geometry of a unit diamater sphere
    const radius = 1;
    const widthSegments = 30;
    const heightSegments = 20;
    const sphereGeometry = new THREE.SphereGeometry(0.5, widthSegments, heightSegments);

    // Create the default material 
    const normalMaterial = new THREE.MeshNormalMaterial({wireframe: true});

    // Create the root "Solar Sytem Object" and add it to the scene
    const solarSystem = new THREE.Object3D();
    scene.add(solarSystem);

    // sun and all the planets will be added to the solar system object

    // Create the sun
    const sunMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
    sunMesh.rotation.y = 0; // Will be animated 
    sunMesh.scale.set(SUN_DIAMETER, SUN_DIAMETER, SUN_DIAMETER);
    solarSystem.add(sunMesh);
    
    // Create Mercury's orbit
    const mercuryOrbit = new THREE.Object3D();
    mercuryOrbit.rotation.y = 0; // Will be animated
    solarSystem.add(mercuryOrbit);

    // Create Mercury planet
    const mercuryMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
    mercuryMesh.position.x = MERCURY_ORBIT;
    mercuryMesh.rotation.y = 0; // Will be animated
    mercuryMesh.scale.set(MERCURY_DIAMETER, MERCURY_DIAMETER, MERCURY_DIAMETER);
    mercuryOrbit.add(mercuryMesh);

    // Create Venus' orbit
    const venusOrbit = new THREE.Object3D();
    venusOrbit.rotation.y = 0; // Will be animated
    solarSystem.add(venusOrbit);

    // Create Venus planet
    const venusMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
    venusMesh.position.x = VENUS_ORBIT;
    venusMesh.rotation.y = 0; // Will be animated;
    venusMesh.scale.set(VENUS_DIAMETER, VENUS_DIAMETER, VENUS_DIAMETER);
    venusOrbit.add(venusMesh);

    // Create EarthAndMoon orbit 
    const earthAndMoonOrbit = new THREE.Object3D();
    earthAndMoonOrbit.rotation.y = 0; //Will be animated
    scene.add(earthAndMoonOrbit);

    const earthAndMoonOrbit2 = new THREE.Object3D();
    earthAndMoonOrbit2.position.x = EARTH_ORBIT;
    earthAndMoonOrbit.add(earthAndMoonOrbit2);
 
    const earthMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
    earthMesh.scale.set(EARTH_DIAMETER, EARTH_DIAMETER, EARTH_DIAMETER);
    earthMesh.rotation.y = 0; // Will be animated
    earthAndMoonOrbit2.add(earthMesh);

    // Create Moon's orbit
    const moonOrbit = new THREE.Object3D();
    moonOrbit.rotation.y = 0; // Will be animated
    earthAndMoonOrbit2.add(moonOrbit);

    // Create the Moon
    const moonMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
    moonMesh.position.x = MOON_ORBIT;
    moonMesh.scale.set(MOON_DIAMETER, MOON_DIAMETER, MOON_DIAMETER);
    moonOrbit.add(moonMesh);

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width != width || canvas.height != height;
        if(needResize)
            renderer.setSize(width, height, false);
            
        
        return needResize;
    }

    function render() {

        time += speed;

        if(resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            aspect = canvas.clientWidth / canvas.clientHeight;
            camera.left = -VP_DISTANCE * aspect;
            camera.right = VP_DISTANCE * aspect;
            camera.top = VP_DISTANCE;
            camera.bottom = -VP_DISTANCE;
            camera.updateProjectionMatrix();
        }


        sunMesh.rotation.y = 2*Math.PI * time / SUN_DAY;
        mercuryMesh.rotation.y = 2*Math.PI * time / MERCURY_DAY;
        venusMesh.rotation.y = 2*Math.PI * time / VENUS_DAY;
        earthMesh.rotation.y = 2*Math.PI * time / EARTH_DAY;

        mercuryOrbit.rotation.y = 2*Math.PI * time / MERCURY_YEAR;
        venusOrbit.rotation.y = 2*Math.PI * time / VENUS_YEAR;
        earthAndMoonOrbit.rotation.y = 2*Math.PI * time / EARTH_YEAR;
        moonOrbit.rotation.y = 2*Math.PI * time / MOON_YEAR;
        earthAndMoonOrbit.rotation.y = 2*Math.PI * time / EARTH_YEAR;

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

setup();
