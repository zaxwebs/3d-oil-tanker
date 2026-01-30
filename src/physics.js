/**
 * Ship physics simulation
 */
import * as THREE from 'three';
import { SHIP } from './config.js';

export class ShipPhysics {
    constructor() {
        this.speed = 0;
        this.rotationSpeed = 0;
    }

    /**
     * Get current speed value (for UI display)
     */
    getSpeed() {
        return Math.abs(this.speed) * 100;
    }

    /**
     * Update physics based on input state
     * @param {Object} inputState - Current input state { forward, backward, left, right }
     */
    update(inputState) {
        this._updateSpeed(inputState);
        this._updateRotation(inputState);
    }

    /**
     * Apply physics to ship group (movement and rotation)
     * @param {THREE.Group} shipGroup - The ship group to move
     * @param {THREE.Object3D} ship - The ship model for roll effect
     */
    applyToGroup(shipGroup, ship) {
        // Apply rotation
        shipGroup.rotation.y += this.rotationSpeed;

        // Apply movement (translate in local Z direction)
        shipGroup.translateZ(-this.speed);

        // Apply roll (tilt based on turning)
        if (ship) {
            const targetRoll = this.rotationSpeed * SHIP.rollMultiplier;
            ship.rotation.z = THREE.MathUtils.lerp(
                ship.rotation.z,
                targetRoll,
                SHIP.rollLerpFactor
            );
        }
    }

    /**
     * Update ship speed based on input
     */
    _updateSpeed(inputState) {
        if (inputState.forward) {
            this.speed += SHIP.acceleration;
        } else if (inputState.backward) {
            this.speed -= SHIP.acceleration;
        } else {
            // Natural drag
            if (this.speed > 0) {
                this.speed -= SHIP.deceleration;
            } else if (this.speed < 0) {
                this.speed += SHIP.deceleration;
            }

            // Stop completely if slow enough
            if (Math.abs(this.speed) < SHIP.deceleration) {
                this.speed = 0;
            }
        }

        // Clamp speed
        this.speed = THREE.MathUtils.clamp(
            this.speed,
            -SHIP.maxReverseSpeed,
            SHIP.maxSpeed
        );
    }

    /**
     * Update ship rotation based on input and current speed
     */
    _updateRotation(inputState) {
        // Turn influence scales with speed (rudder needs flow)
        const speedFactor = Math.abs(this.speed) / SHIP.maxSpeed;
        const turnInfluence = Math.max(speedFactor, SHIP.minTurnInfluence);
        const direction = this.speed >= 0 ? 1 : -1;

        if (inputState.left) {
            this.rotationSpeed += SHIP.rotationAcceleration * turnInfluence * direction;
        } else if (inputState.right) {
            this.rotationSpeed -= SHIP.rotationAcceleration * turnInfluence * direction;
        } else {
            // Drift / decelerate rotation
            if (this.rotationSpeed > 0) {
                this.rotationSpeed -= SHIP.rotationDeceleration;
            } else if (this.rotationSpeed < 0) {
                this.rotationSpeed += SHIP.rotationDeceleration;
            }

            // Apply damping
            this.rotationSpeed *= SHIP.rotationDamping;

            // Stop if very slow
            if (Math.abs(this.rotationSpeed) < 0.0001) {
                this.rotationSpeed = 0;
            }
        }

        // Clamp rotation speed
        this.rotationSpeed = THREE.MathUtils.clamp(
            this.rotationSpeed,
            -SHIP.maxRotationSpeed,
            SHIP.maxRotationSpeed
        );
    }
}
