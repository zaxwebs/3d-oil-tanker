/**
 * Unified input handling for keyboard and touch controls
 */
import { KEY_BINDINGS, KEY_TO_ELEMENT, ONSCREEN_CONTROLS } from './config.js';

export class InputManager {
    constructor() {
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        this.panModeActive = false;
        this.toggleCameraRequested = false;

        this._setupKeyboardListeners();
        this._setupOnScreenControls();
    }

    /**
     * Get current input state
     */
    getState() {
        return { ...this.keys };
    }

    /**
     * Check if pan mode is currently active
     */
    isPanModeActive() {
        return this.panModeActive;
    }

    /**
     * Check and consume camera toggle request
     */
    consumeCameraToggle() {
        if (this.toggleCameraRequested) {
            this.toggleCameraRequested = false;
            return true;
        }
        return false;
    }

    /**
     * Set visual active state on key UI element
     */
    _setKeyActive(code, active) {
        const elementId = KEY_TO_ELEMENT[code];
        if (elementId) {
            const el = document.getElementById(elementId);
            if (el) {
                el.classList.toggle('active', active);
            }
        }
    }

    /**
     * Check if key code matches a binding
     */
    _matchesBinding(code, action) {
        return KEY_BINDINGS[action]?.includes(code);
    }

    /**
     * Setup keyboard event listeners
     */
    _setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            this._setKeyActive(e.code, true);

            if (this._matchesBinding(e.code, 'forward')) {
                this.keys.forward = true;
            } else if (this._matchesBinding(e.code, 'backward')) {
                this.keys.backward = true;
            } else if (this._matchesBinding(e.code, 'left')) {
                this.keys.left = true;
            } else if (this._matchesBinding(e.code, 'right')) {
                this.keys.right = true;
            } else if (this._matchesBinding(e.code, 'toggleCamera')) {
                this.toggleCameraRequested = true;
            } else if (this._matchesBinding(e.code, 'panMode')) {
                this.panModeActive = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            this._setKeyActive(e.code, false);

            if (this._matchesBinding(e.code, 'forward')) {
                this.keys.forward = false;
            } else if (this._matchesBinding(e.code, 'backward')) {
                this.keys.backward = false;
            } else if (this._matchesBinding(e.code, 'left')) {
                this.keys.left = false;
            } else if (this._matchesBinding(e.code, 'right')) {
                this.keys.right = false;
            } else if (this._matchesBinding(e.code, 'panMode')) {
                this.panModeActive = false;
            }
        });
    }

    /**
     * Setup on-screen touch/mouse controls
     */
    _setupOnScreenControls() {
        Object.entries(ONSCREEN_CONTROLS).forEach(([id, action]) => {
            const el = document.getElementById(id);
            if (!el) return;

            const startAction = (e) => {
                e.preventDefault();
                this.keys[action] = true;
                el.classList.add('active');
            };

            const endAction = (e) => {
                e.preventDefault();
                this.keys[action] = false;
                el.classList.remove('active');
            };

            el.addEventListener('mousedown', startAction);
            el.addEventListener('touchstart', startAction, { passive: false });
            el.addEventListener('mouseup', endAction);
            el.addEventListener('mouseleave', endAction);
            el.addEventListener('touchend', endAction);
        });
    }
}
