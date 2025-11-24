# Oil Tanker Simulation

A realistic 3D oil tanker simulation built with **Three.js** and **Vite**. This project features physics-based ship movement, a dynamic ocean environment, and advanced camera controls.

## Features

-   **Realistic Environment**: High-quality ocean water shader and dynamic sky with sun positioning.
-   **Physics-Based Controls**:
    -   Momentum-based acceleration and deceleration.
    -   Speed-dependent turning (rudder physics).
    -   Drift and rotation damping for realistic handling.
    -   Visual ship tilting (roll) during turns.
-   **Advanced Camera System**:
    -   **Follow Mode**: Automatically tracks the ship from behind.
    -   **Free Roam**: Orbit around the ship freely.
    -   **Smooth Transitions**: Cinematic transitions when switching camera modes.
    -   **Panning**: Hold-to-pan functionality in free roam mode.
-   **Dynamic UI**: Real-time stats overlay showing speed (knots) and heading, with interactive control hints.

## Controls

| Key | Action |
| :--- | :--- |
| **W / Up** | Accelerate Forward |
| **S / Down** | Reverse / Decelerate |
| **A / Left** | Turn Port (Left) |
| **D / Right** | Turn Starboard (Right) |
| **C** | Toggle Camera Follow Mode |
| **Space (Hold)** | Pan Camera (Only in Free Roam) |
| **Mouse Drag** | Orbit Camera (Free Roam) |
| **Scroll** | Zoom In/Out |

## Setup & Running

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## Technologies

-   [Three.js](https://threejs.org/) - 3D Library
-   [Vite](https://vitejs.dev/) - Build Tool
-   [Three.js Examples](https://github.com/mrdoob/three.js/tree/master/examples/jsm) - Water & Sky Shaders

## License

This project is for educational purposes. Ship model and textures are property of their respective creators.
