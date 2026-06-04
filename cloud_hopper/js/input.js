// --- GLOBAL STATE ---
// These variables are shared across main.js, world.js, and physics.js
let gameStarted = false;

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

// --- POINTER LOCK (MOUSE CAPTURE) ---
// Captures the mouse cursor so moving it rotates the camera instead of leaving the screen
document.addEventListener('click', () => {
    if (!gameStarted) {
        // Request the browser to lock the pointer to the canvas canvas element
        const canvas = renderer.domElement;
        if (canvas && canvas.requestPointerLock) {
            canvas.requestPointerLock();
        }
    }
});

// Sync game states based on whether the browser successfully locked or unlocked the mouse
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
        gameStarted = true;
        // Hide UI instructions overlay if you have one (e.g., "Click to Play")
        const overlay = document.getElementById('overlay');
        if (overlay) overlay.style.display = 'none';
    } else {
        gameStarted = false;
        // Bring back the menu overlay when hitting Escape
        const overlay = document.getElementById('overlay');
        if (overlay) overlay.style.display = 'flex';
    }
});

// --- KEYBOARD LISTENERS ---
// Tracks exactly when movement keys are being held down or released
document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.w = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.a = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keys.s = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.d = true;
            break;
        case 'Space':
            keys.space = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.w = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.a = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keys.s = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.d = false;
            break;
        case 'Space':
            keys.space = false;
            break;
    }
});
