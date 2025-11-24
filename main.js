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
const keyMap = {
    'KeyW': 'key-w',
    'ArrowUp': 'key-w',
    'KeyS': 'key-s',
    'ArrowDown': 'key-s',
    'KeyA': 'key-a',
    'ArrowLeft': 'key-a',
    'KeyD': 'key-d',
    'ArrowRight': 'key-d'
};

function setKeyActive(code, active) {
    const elementId = keyMap[code];
    if (elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            if (active) el.classList.add('active');
            else el.classList.remove('active');
        }
    }
}

// On-screen controls
const onScreenKeys = {
    'key-w': 'forward',
    'key-s': 'backward',
    'key-a': 'left',
    'key-d': 'right'
};

Object.keys(onScreenKeys).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        const action = onScreenKeys[id];

        const startAction = (e) => {
            e.preventDefault(); // Prevent text selection/scrolling
            keys[action] = true;
            el.classList.add('active');
        };

        const endAction = (e) => {
            e.preventDefault();
            keys[action] = false;
            el.classList.remove('active');
        };

        el.addEventListener('mousedown', startAction);
        el.addEventListener('touchstart', startAction, { passive: false });

        el.addEventListener('mouseup', endAction);
        el.addEventListener('mouseleave', endAction);
        el.addEventListener('touchend', endAction);
    }
});

window.addEventListener('keydown', (e) => {
    setKeyActive(e.code, true);
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
        case 'KeyC':
            const toggle = document.getElementById('camera-toggle');
            if (toggle) {
                toggle.checked = !toggle.checked;
                updateUIState();
            }
            break;
        case 'KeyH':
        case 'Space':
            // Hold Pan Mode - Only if NOT in follow mode
            const camToggle = document.getElementById('camera-toggle');
            if (camToggle && !camToggle.checked) {
                controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
                document.body.style.cursor = 'grab';
            }
            break;
    }
});

function updateUIState() {
    const toggle = document.getElementById('camera-toggle');
    const panHint = document.getElementById('pan-hint');
    if (toggle && panHint) {
        if (toggle.checked) {
            panHint.classList.add('disabled-hint');
        } else {
            panHint.classList.remove('disabled-hint');
        }
    }
}

// Initial UI state check and listener
const cameraToggleEl = document.getElementById('camera-toggle');
if (cameraToggleEl) {
    cameraToggleEl.addEventListener('change', updateUIState);
    updateUIState(); // Run once on init
}

// Stats toggle for mobile
const statsToggleBtn = document.getElementById('stats-toggle');
const statsCard = document.getElementById('stats-card');

if (statsToggleBtn && statsCard) {
    statsToggleBtn.addEventListener('click', () => {
        const isVisible = statsCard.classList.contains('mobile-visible');

        if (isVisible) {
            // Hide stats
            statsCard.classList.remove('mobile-visible');
            statsToggleBtn.classList.remove('active');
            document.body.classList.remove('stats-visible');
        } else {
            // Show stats
            statsCard.classList.add('mobile-visible');
            statsToggleBtn.classList.add('active');
            document.body.classList.add('stats-visible');
        }
    });
}

window.addEventListener('keyup', (e) => {
    setKeyActive(e.code, false);
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
        case 'KeyH':
        case 'Space':
            // Release Pan Mode
            controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
            document.body.style.cursor = 'default';
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

    // Camera follow logic
    const cameraToggle = document.getElementById('camera-toggle');
    const isFollowMode = cameraToggle && cameraToggle.checked;

    // State for transition
    if (window.wasFollowMode === undefined) window.wasFollowMode = true;
    if (window.isTransitioning === undefined) window.isTransitioning = false;
    if (window.transitionStartTime === undefined) window.transitionStartTime = 0;
    if (window.transitionStartPos === undefined) window.transitionStartPos = new THREE.Vector3();
    if (window.transitionTargetPos === undefined) window.transitionTargetPos = new THREE.Vector3();

    if (isFollowMode) {
        // Reset transition state if we go back to follow mode
        window.isTransitioning = false;
        window.wasFollowMode = true;

        // Disable manual controls to prevent fighting/jumping
        controls.enabled = false;

        // Simple follow: behind and above
        const relativeCameraOffset = new THREE.Vector3(0, 30, 80);
        const cameraOffset = relativeCameraOffset.applyMatrix4(shipGroup.matrixWorld);

        // Smooth camera
        camera.position.lerp(cameraOffset, 0.05);
        camera.lookAt(shipGroup.position);
    } else {
        // Check if we just switched to free mode
        if (window.wasFollowMode) {
            window.wasFollowMode = false;
            window.isTransitioning = true;
            window.transitionStartTime = performance.now();

            // Capture start position
            window.transitionStartPos.copy(camera.position);

            // Calculate target position (more back and higher)
            const relativeTargetOffset = new THREE.Vector3(0, 60, 150);
            window.transitionTargetPos.copy(relativeTargetOffset.applyMatrix4(shipGroup.matrixWorld));
        }

        if (window.isTransitioning) {
            const duration = 1500; // ms
            const elapsed = performance.now() - window.transitionStartTime;
            const progress = Math.min(elapsed / duration, 1.0);

            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            camera.position.lerpVectors(window.transitionStartPos, window.transitionTargetPos, ease);
            camera.lookAt(shipGroup.position);

            if (progress >= 1.0) {
                window.isTransitioning = false;
                controls.target.copy(shipGroup.position);
            }
        } else {
            // Enable manual controls
            controls.enabled = true;
            controls.update();
        }
    }

    // Update water
    water.material.uniforms['time'].value += 1.0 / 60.0;

    const speedVal = document.getElementById('speed-val');
    const headingVal = document.getElementById('heading-val');

    if (speedVal) {
        const currentSpeed = (Math.abs(shipStats.speed) * 100).toFixed(1);
        if (speedVal.innerText !== currentSpeed) {
            speedVal.innerText = currentSpeed;
        }
    }

    if (headingVal) {
        const currentHeading = (Math.abs(shipGroup.rotation.y * (180 / Math.PI)) % 360).toFixed(0);
        if (headingVal.innerText !== currentHeading) {
            headingVal.innerText = currentHeading;
        }
    }
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
