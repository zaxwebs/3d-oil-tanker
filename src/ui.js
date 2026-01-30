/**
 * UI state management with cached DOM elements
 */
import * as THREE from 'three';

export class UIManager {
    constructor() {
        this.elements = {
            loading: document.getElementById('loading'),
            speedVal: document.getElementById('speed-val'),
            headingVal: document.getElementById('heading-val'),
            coordVal: document.getElementById('coord-val'),
            cameraToggle: document.getElementById('camera-toggle'),
            panHint: document.getElementById('pan-hint'),
            statsToggle: document.getElementById('stats-toggle'),
            statsCard: document.getElementById('stats-card')
        };

        this._setupStatsToggle();
        this._setupCameraToggleListener();
    }

    /**
     * Hide the loading indicator
     */
    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.style.display = 'none';
        }
    }

    /**
     * Update stats display values
     * @param {number} speed - Current speed
     * @param {number} headingRadians - Current heading in radians
     */
    updateStats(speed, headingRadians) {
        const speedStr = speed.toFixed(1);
        const headingStr = (Math.abs(headingRadians * (180 / Math.PI)) % 360).toFixed(0);

        if (this.elements.speedVal && this.elements.speedVal.innerText !== speedStr) {
            this.elements.speedVal.innerText = speedStr;
        }

        if (this.elements.headingVal && this.elements.headingVal.innerText !== headingStr) {
            this.elements.headingVal.innerText = headingStr;
        }
    }

    /**
     * Update coordinate display
     * @param {number} x - X position
     * @param {number} z - Z position
     */
    updateCoordinates(x, z) {
        const coordStr = `${Math.round(x)}, ${Math.round(z)}`;
        if (this.elements.coordVal && this.elements.coordVal.innerText !== coordStr) {
            this.elements.coordVal.innerText = coordStr;
        }
    }

    /**
     * Update UI based on camera mode
     */
    updateCameraModeUI() {
        const { cameraToggle, panHint } = this.elements;
        if (cameraToggle && panHint) {
            panHint.classList.toggle('disabled-hint', cameraToggle.checked);
        }
    }

    /**
     * Get current camera follow mode from checkbox
     */
    isFollowModeEnabled() {
        return this.elements.cameraToggle?.checked ?? true;
    }

    /**
     * Set camera follow checkbox state
     */
    setFollowMode(enabled) {
        if (this.elements.cameraToggle) {
            this.elements.cameraToggle.checked = enabled;
            this.updateCameraModeUI();
        }
    }

    /**
     * Toggle camera follow mode
     */
    toggleFollowMode() {
        if (this.elements.cameraToggle) {
            this.elements.cameraToggle.checked = !this.elements.cameraToggle.checked;
            this.updateCameraModeUI();
            return this.elements.cameraToggle.checked;
        }
        return true;
    }

    /**
     * Handle pan mode cursor state
     */
    setPanModeCursor(active) {
        document.body.style.cursor = active ? 'grab' : 'default';
    }

    /**
     * Setup mobile stats panel toggle
     */
    _setupStatsToggle() {
        const { statsToggle, statsCard } = this.elements;
        if (!statsToggle || !statsCard) return;

        statsToggle.addEventListener('click', () => {
            const isVisible = statsCard.classList.contains('mobile-visible');

            if (isVisible) {
                statsCard.classList.remove('mobile-visible');
                statsToggle.classList.remove('active');
                document.body.classList.remove('stats-visible');
            } else {
                statsCard.classList.add('mobile-visible');
                statsToggle.classList.add('active');
                document.body.classList.add('stats-visible');
            }
        });
    }

    /**
     * Setup camera toggle change listener
     */
    _setupCameraToggleListener() {
        if (this.elements.cameraToggle) {
            this.elements.cameraToggle.addEventListener('change', () => {
                this.updateCameraModeUI();
            });
            // Initial state
            this.updateCameraModeUI();
        }
    }
}
