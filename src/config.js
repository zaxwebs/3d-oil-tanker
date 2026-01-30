/**
 * Configuration constants for the oil tanker simulation
 */

// Ship Physics
export const SHIP = {
    scale: 0.5,
    waterOffset: 0.5,
    maxSpeed: 1.0,
    maxReverseSpeed: 0.5, // Half of max forward speed
    acceleration: 0.005,
    deceleration: 0.005,
    maxRotationSpeed: 0.008,
    rotationAcceleration: 0.0005,
    rotationDeceleration: 0.0005,
    rotationDamping: 0.95,
    minTurnInfluence: 0.1,
    rollMultiplier: 10,
    rollLerpFactor: 0.05
};

// Camera Settings
export const CAMERA = {
    fov: 55,
    near: 1,
    far: 20000,
    initialPosition: { x: 30, y: 30, z: 100 },
    followOffset: { x: 0, y: 30, z: 80 },
    freeOffset: { x: 0, y: 60, z: 150 },
    followLerpFactor: 0.05,
    transitionDuration: 1500, // ms
    maxPolarAngle: Math.PI / 2 - 0.1
};

// Water Settings
export const WATER = {
    size: 10000,
    textureWidth: 512,
    textureHeight: 512,
    distortionScale: 3.7,
    color: 0x006994,  // Richer ocean blue
    sunColor: 0xffffff
};

// Sky Settings
export const SKY = {
    scale: 10000,
    turbidity: 2,           // Lower for clearer sky
    rayleigh: 1,            // Balanced scattering
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    sunElevation: 15,       // Higher sun for brighter light
    sunAzimuth: 180
};

// Renderer Settings
export const RENDERER = {
    exposure: 0.4  // Balanced exposure, preserving saturation
};

// Key Mappings
export const KEY_BINDINGS = {
    forward: ['KeyW', 'ArrowUp'],
    backward: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    toggleCamera: ['KeyC'],
    panMode: ['KeyH', 'Space']
};

// Key to UI element mapping
export const KEY_TO_ELEMENT = {
    'KeyW': 'key-w',
    'ArrowUp': 'key-w',
    'KeyS': 'key-s',
    'ArrowDown': 'key-s',
    'KeyA': 'key-a',
    'ArrowLeft': 'key-a',
    'KeyD': 'key-d',
    'ArrowRight': 'key-d'
};

// On-screen control element IDs
export const ONSCREEN_CONTROLS = {
    'key-w': 'forward',
    'key-s': 'backward',
    'key-a': 'left',
    'key-d': 'right'
};
