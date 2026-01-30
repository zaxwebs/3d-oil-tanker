/**
 * Camera control with follow mode and smooth transitions
 */
import * as THREE from 'three';
import { CAMERA } from './config.js';

export class CameraController {
    constructor() {
        this.isFollowMode = true;
        this.wasFollowMode = true;
        this.isTransitioning = false;
        this.transitionStartTime = 0;
        this.transitionStartPos = new THREE.Vector3();
        this.transitionTargetPos = new THREE.Vector3();
    }

    /**
     * Toggle between follow and free camera modes
     */
    toggleFollowMode() {
        this.isFollowMode = !this.isFollowMode;
        return this.isFollowMode;
    }

    /**
     * Set follow mode state
     */
    setFollowMode(enabled) {
        this.isFollowMode = enabled;
    }

    /**
     * Get current follow mode state
     */
    getFollowMode() {
        return this.isFollowMode;
    }

    /**
     * Update camera position based on current mode
     * @param {THREE.Camera} camera - The camera to update
     * @param {THREE.Group} shipGroup - The ship group to follow
     * @param {OrbitControls} controls - The orbit controls
     */
    update(camera, shipGroup, controls) {
        if (this.isFollowMode) {
            this._updateFollowMode(camera, shipGroup, controls);
        } else {
            this._updateFreeMode(camera, shipGroup, controls);
        }
    }

    /**
     * Handle follow mode camera positioning
     */
    _updateFollowMode(camera, shipGroup, controls) {
        // Reset transition state when returning to follow mode
        this.isTransitioning = false;
        this.wasFollowMode = true;

        // Disable manual controls to prevent fighting
        controls.enabled = false;

        // Calculate camera position behind and above ship
        const relativeCameraOffset = new THREE.Vector3(
            CAMERA.followOffset.x,
            CAMERA.followOffset.y,
            CAMERA.followOffset.z
        );
        const cameraOffset = relativeCameraOffset.applyMatrix4(shipGroup.matrixWorld);

        // Smooth camera movement
        camera.position.lerp(cameraOffset, CAMERA.followLerpFactor);
        camera.lookAt(shipGroup.position);
    }

    /**
     * Handle free mode camera with smooth transition from follow
     */
    _updateFreeMode(camera, shipGroup, controls) {
        // Check if we just switched to free mode
        if (this.wasFollowMode) {
            this.wasFollowMode = false;
            this.isTransitioning = true;
            this.transitionStartTime = performance.now();

            // Capture start position
            this.transitionStartPos.copy(camera.position);

            // Calculate target position (further back and higher)
            const relativeTargetOffset = new THREE.Vector3(
                CAMERA.freeOffset.x,
                CAMERA.freeOffset.y,
                CAMERA.freeOffset.z
            );
            this.transitionTargetPos.copy(
                relativeTargetOffset.applyMatrix4(shipGroup.matrixWorld)
            );
        }

        if (this.isTransitioning) {
            const elapsed = performance.now() - this.transitionStartTime;
            const progress = Math.min(elapsed / CAMERA.transitionDuration, 1.0);

            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            camera.position.lerpVectors(
                this.transitionStartPos,
                this.transitionTargetPos,
                ease
            );
            camera.lookAt(shipGroup.position);

            if (progress >= 1.0) {
                this.isTransitioning = false;
                controls.target.copy(shipGroup.position);
            }
        } else {
            // Enable manual controls
            controls.enabled = true;
            controls.update();
        }
    }
}
