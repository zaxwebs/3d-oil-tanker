import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// --- Scene Setup ---
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
camera.position.set(30, 30, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Enhanced vibrancy
renderer.toneMappingExposure = 0.5;
document.body.appendChild(renderer.domElement);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 10, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.1; // Don't go below water

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0); // Sun
directionalLight.position.set(-1, 1, 1);
scene.add(directionalLight);

// --- Ocean ---
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
const water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    }
);
water.rotation.x = - Math.PI / 2;
scene.add(water);

// --- Sky ---
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const sun = new THREE.Vector3();

function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - 2); // Elevation
    const theta = THREE.MathUtils.degToRad(180); // Azimuth

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;
}
updateSun();

// --- Ship Logic ---
let ship;
const shipGroup = new THREE.Group();
scene.add(shipGroup);

const loader = new GLTFLoader();
loader.load('models/tanker_ship/scene.gltf', function (gltf) {
    ship = gltf.scene;
    ship.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed
    ship.position.y = 0.5; // Sit on top of water
    shipGroup.add(ship);

    // Hide loading text
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
}, undefined, function (error) {
    console.error(error);
});

// --- Physics Variables ---
const shipStats = {
    speed: 0,
    maxSpeed: 2.0,
    acceleration: 0.02,
    deceleration: 0.01,
    rotationSpeed: 0,
    maxRotationSpeed: 0.02,
    rotationAcceleration: 0.0005,
    rotationDeceleration: 0.0005, // Drift effect
    rotationDamping: 0.95 // Damping for drift
};

const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// --- Input Handling ---
window.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
            keys.forward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.backward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = true;
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
            keys.forward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.backward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = false;
            break;
    }
});

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    render();
    updatePhysics();
}

function updatePhysics() {
    if (!ship) return;

    // Acceleration / Deceleration
    if (keys.forward) {
        shipStats.speed += shipStats.acceleration;
    } else if (keys.backward) {
        shipStats.speed -= shipStats.acceleration;
    } else {
        // Natural drag
        if (shipStats.speed > 0) shipStats.speed -= shipStats.deceleration;
        if (shipStats.speed < 0) shipStats.speed += shipStats.deceleration;

        // Stop completely if slow enough
        if (Math.abs(shipStats.speed) < shipStats.deceleration) shipStats.speed = 0;
    }

    // Clamp speed
    shipStats.speed = Math.max(Math.min(shipStats.speed, shipStats.maxSpeed), -shipStats.maxSpeed / 2);

    // Turning
    // Only turn if moving (or turn very slowly if stopped - realistic for rudders)
    // Actually, let's allow turning but scale it by speed for realism, 
    // but keep some base turning capability for gameplay feel if desired.
    // For now, strict realism: rudder needs flow.
    const speedFactor = Math.abs(shipStats.speed) / shipStats.maxSpeed;
    const turnInfluence = Math.max(speedFactor, 0.1); // Minimum turn ability
    const direction = shipStats.speed >= 0 ? 1 : -1;

    if (keys.left) {
        shipStats.rotationSpeed += shipStats.rotationAcceleration * turnInfluence * direction;
    } else if (keys.right) {
        shipStats.rotationSpeed -= shipStats.rotationAcceleration * turnInfluence * direction;
    } else {
        // Drift / Decelerate rotation
        if (shipStats.rotationSpeed > 0) shipStats.rotationSpeed -= shipStats.rotationDeceleration;
        if (shipStats.rotationSpeed < 0) shipStats.rotationSpeed += shipStats.rotationDeceleration;

        // Damping
        shipStats.rotationSpeed *= shipStats.rotationDamping;

        if (Math.abs(shipStats.rotationSpeed) < 0.0001) shipStats.rotationSpeed = 0;
    }

    // Clamp rotation speed
    shipStats.rotationSpeed = Math.max(Math.min(shipStats.rotationSpeed, shipStats.maxRotationSpeed), -shipStats.maxRotationSpeed);

    // Apply rotation
    shipGroup.rotation.y += shipStats.rotationSpeed;

    // Apply movement
    shipGroup.translateZ(-shipStats.speed);

    // Tilt (Roll) based on turning
    // Target roll angle
    const targetRoll = shipStats.rotationSpeed * 10; // Multiplier for visual effect
    ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, targetRoll, 0.05);

    // Camera follow
    // Simple follow: behind and above
    const relativeCameraOffset = new THREE.Vector3(0, 30, 80);
    const cameraOffset = relativeCameraOffset.applyMatrix4(shipGroup.matrixWorld);

    // Smooth camera
    camera.position.lerp(cameraOffset, 0.05);
    camera.lookAt(shipGroup.position);

    // Update water
    water.material.uniforms['time'].value += 1.0 / 60.0;

    // Update Stats
    const speedVal = document.getElementById('speed-val');
    const headingVal = document.getElementById('heading-val');
    if (speedVal) speedVal.innerText = (Math.abs(shipStats.speed) * 100).toFixed(1); // Arbitrary scale for knots
    if (headingVal) headingVal.innerText = (Math.abs(shipGroup.rotation.y * (180 / Math.PI)) % 360).toFixed(0);
}

function render() {
    renderer.render(scene, camera);
}

// --- Resize Handler ---
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

animate();
