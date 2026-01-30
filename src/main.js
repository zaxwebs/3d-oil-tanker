/**
 * Oil Tanker Simulation - Main Entry Point
 * A 3D ship simulation with realistic physics and controls
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SHIP, CAMERA } from './config.js';
import { createRenderer, createCamera, createLighting, createWater, createSky, loadShipModel } from './scene.js';
import { InputManager } from './input.js';
import { ShipPhysics } from './physics.js';
import { CameraController } from './camera.js';
import { UIManager } from './ui.js';

// --- Initialize Scene ---
const scene = new THREE.Scene();
const renderer = createRenderer();
const camera = createCamera();

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 10, 0);
controls.enableDamping = true;
controls.maxPolarAngle = CAMERA.maxPolarAngle;

// --- Lighting ---
createLighting(scene);

// --- Water & Sky ---
const water = createWater(scene);
const { sky } = createSky(scene, renderer, water);

// --- Ship Setup ---
const shipGroup = new THREE.Group();
scene.add(shipGroup);

let ship = null;

// --- Initialize Managers ---
const inputManager = new InputManager();
const shipPhysics = new ShipPhysics();
const cameraController = new CameraController();
const uiManager = new UIManager();

// --- Load Ship Model ---
loadShipModel()
    .then((loadedShip) => {
        ship = loadedShip;
        ship.scale.set(SHIP.scale, SHIP.scale, SHIP.scale);
        ship.position.y = SHIP.waterOffset;
        shipGroup.add(ship);
        uiManager.hideLoading();
    })
    .catch((error) => {
        console.error('Failed to load ship model:', error);
    });

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Handle camera toggle request from input
    if (inputManager.consumeCameraToggle()) {
        const newMode = uiManager.toggleFollowMode();
        cameraController.setFollowMode(newMode);
    }

    // Handle pan mode
    const isFollowMode = uiManager.isFollowModeEnabled();
    cameraController.setFollowMode(isFollowMode);

    if (!isFollowMode && inputManager.isPanModeActive()) {
        controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
        uiManager.setPanModeCursor(true);
    } else if (!inputManager.isPanModeActive()) {
        controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
        uiManager.setPanModeCursor(false);
    }

    // Update physics
    if (ship) {
        const inputState = inputManager.getState();
        shipPhysics.update(inputState);
        shipPhysics.applyToGroup(shipGroup, ship);

        // Update UI stats
        uiManager.updateStats(shipPhysics.getSpeed(), shipGroup.rotation.y);
        uiManager.updateCoordinates(shipGroup.position.x, shipGroup.position.z);

        // Infinite water - follow ship position (XZ plane only)
        water.position.x = shipGroup.position.x;
        water.position.z = shipGroup.position.z;
    }

    // Update camera
    cameraController.update(camera, shipGroup, controls);

    // Update water animation
    water.material.uniforms['time'].value += 1.0 / 60.0;

    // Render
    renderer.render(scene, camera);
}

// --- Resize Handler ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Start ---
animate();
