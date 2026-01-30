/**
 * Three.js scene setup and management
 */
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CAMERA, WATER, SKY, RENDERER } from './config.js';

/**
 * Create and configure the WebGL renderer
 */
export function createRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = RENDERER.exposure;
    document.body.appendChild(renderer.domElement);
    return renderer;
}

/**
 * Create and configure the perspective camera
 */
export function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        CAMERA.fov,
        window.innerWidth / window.innerHeight,
        CAMERA.near,
        CAMERA.far
    );
    camera.position.set(
        CAMERA.initialPosition.x,
        CAMERA.initialPosition.y,
        CAMERA.initialPosition.z
    );
    return camera;
}

/**
 * Create scene lighting (ambient + directional)
 */
export function createLighting(scene) {
    // Brighter ambient for better fill light
    const ambientLight = new THREE.AmbientLight(0x87ceeb, 2.5);  // Sky blue tint
    scene.add(ambientLight);

    // Stronger directional sun light
    const directionalLight = new THREE.DirectionalLight(0xfff4e6, 3.0);  // Warm sun
    directionalLight.position.set(-1, 1, 1);
    scene.add(directionalLight);

    return { ambientLight, directionalLight };
}

/**
 * Create the ocean water plane
 */
export function createWater(scene) {
    const waterGeometry = new THREE.PlaneGeometry(WATER.size, WATER.size);
    const water = new Water(waterGeometry, {
        textureWidth: WATER.textureWidth,
        textureHeight: WATER.textureHeight,
        waterNormals: new THREE.TextureLoader().load(
            'textures/waternormals.jpg',
            (texture) => {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }
        ),
        sunDirection: new THREE.Vector3(),
        sunColor: WATER.sunColor,
        waterColor: WATER.color,
        distortionScale: WATER.distortionScale,
        fog: scene.fog !== undefined
    });
    water.rotation.x = -Math.PI / 2;
    scene.add(water);
    return water;
}

/**
 * Create the sky dome and configure sun position
 */
export function createSky(scene, renderer, water) {
    const sky = new Sky();
    sky.scale.setScalar(SKY.scale);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = SKY.turbidity;
    skyUniforms['rayleigh'].value = SKY.rayleigh;
    skyUniforms['mieCoefficient'].value = SKY.mieCoefficient;
    skyUniforms['mieDirectionalG'].value = SKY.mieDirectionalG;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const sun = new THREE.Vector3();

    // Calculate sun position
    const phi = THREE.MathUtils.degToRad(90 - SKY.sunElevation);
    const theta = THREE.MathUtils.degToRad(SKY.sunAzimuth);
    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;

    return { sky, sun, pmremGenerator };
}

/**
 * Load the ship GLTF model
 * @returns {Promise<THREE.Group>} The loaded ship scene
 */
export function loadShipModel() {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            'models/tanker_ship/scene.gltf',
            (gltf) => resolve(gltf.scene),
            undefined,
            (error) => reject(error)
        );
    });
}
