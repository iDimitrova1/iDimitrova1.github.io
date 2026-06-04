// --- GLOBAL STARTING STATE ---
window.gameStarted = false;

window.keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

// --- MOUSE LOCK HANDLER ---
document.addEventListener('click', () => {
    if (!window.gameStarted) {
        // Ensure renderer exists before accessing its canvas element
        if (window.renderer && window.renderer.domElement) {
            window.renderer.domElement.requestPointerLock();
        }
    }
});

// Sync game engine states when mouse lock changes
document.addEventListener('pointerlockchange', () => {
    if (window.renderer && document.pointerLockElement === window.renderer.domElement) {
        window.gameStarted = true;
        const overlay = document.getElementById('overlay');
        if (overlay) overlay.style.display = 'none';
    } else {
        window.gameStarted = false;
        const overlay = document.getElementById('overlay');
        if (overlay) overlay.style.display = 'flex';
    }
});

// --- KEYBOARD CONTROLS ---
document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyW': case 'ArrowUp':    window.keys.w = true; break;
        case 'KeyA': case 'ArrowLeft':  window.keys.a = true; break;
        case 'KeyS': case 'ArrowDown':  window.keys.s = true; break;
        case 'KeyD': case 'ArrowRight': window.keys.d = true; break;
        case 'Space':                   window.keys.space = true; break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyW': case 'ArrowUp':    window.keys.w = false; break;
        case 'KeyA': case 'ArrowLeft':  window.keys.a = false; break;
        case 'KeyS': case 'ArrowDown':  window.keys.s = false; break;
        case 'KeyD': case 'ArrowRight': window.keys.d = false; break;
        case 'Space':                   window.keys.space = false; break;
    }
});
