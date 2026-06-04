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
        if (window.renderer && window.renderer.domElement) {
            window.renderer.domElement.requestPointerLock();
        }
    }
});

// Sync game engine states when mouse lock changes
document.addEventListener('pointerlockchange', () => {
    // Safely look for whatever name your HTML text block is using
    const commonOverlayIDs = ['overlay', 'blocker', 'instructions', 'menu', 'start-screen'];
    let startTextUI = null;
    
    for (const id of commonOverlayIDs) {
        const element = document.getElementById(id);
        if (element) {
            startTextUI = element;
            break;
        }
    }

    // If the browser successfully locked the mouse, hide the starting text
    if (window.renderer && document.pointerLockElement === window.renderer.domElement) {
        window.gameStarted = true;
        if (startTextUI) startTextUI.style.display = 'none';
    } else {
        // If the player hits Escape, pause the logic and bring the text back
        window.gameStarted = false;
        if (startTextUI) startTextUI.style.display = 'flex';
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
