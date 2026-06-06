// main.js - MAIN GAME ENGINE CONTROLLER
const ambient = new THREE.AmbientLight(0x404040, 2); // Soft overall light
const directional = new THREE.DirectionalLight(0xffffff, 1); // Highlights for the waves
directional.position.set(0, 50, 50);
scene.add(ambient);
scene.add(directional);

// 1. Core Clock & UI Elements
const clock = new THREE.Clock();
const speedo = document.getElementById('speedo');
let bobTimer = 0;
let gameTime = 0;

// Track whether the mountains have successfully booted up yet
let mountainsInitialized = false;
let oceanInitialized = false;

/**
 * Main Animation and Logic Clock Loop
 */
function animate() {
    requestAnimationFrame(animate);

    // Get the seconds passed since the last rendered frame
    const delta = clock.getDelta();
    const cappedDelta = Math.min(delta, 0.1);

    // INITIALIZATION GUARD:
    // Safely waits until scene/MountainManager are fully loaded in the browser browser window
    if (!mountainsInitialized && typeof scene !== 'undefined' && typeof MountainManager !== 'undefined') {
        MountainManager.init(scene);
        mountainsInitialized = true;
    }
    
    if (!oceanInitialized && typeof scene !== 'undefined' && typeof OceanManager !== 'undefined') {
        OceanManager.init(scene);
        oceanInitialized = true;
    }

    if (gameStarted) {
        gameTime += cappedDelta;
        if (oceanInitialized) {
            OceanManager.update(gameTime, yawObject.position.z);
        }
        updatePhysics(cappedDelta);

        if (typeof yawObject !== 'undefined') {
            manageEndlessClouds(yawObject.position.z);
        }

        if (typeof velocity !== 'undefined') {
            const horizSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
            if (speedo) {
                speedo.innerText = Math.round(horizSpeed * 1000);
            }
            
            if (typeof yawObject !== 'undefined') {
                updateScore(yawObject.position.z);
            }
            
            animateViewmodel(horizSpeed, cappedDelta);
        }
    }
	
	OceanManager.update(gameTime, yawObject.position.z);
    // Update mountain positioning relative to player progress
    if (mountainsInitialized && typeof yawObject !== 'undefined' && yawObject) {
        MountainManager.manage(yawObject.position.z, scene);
    }

    // Render the synchronized scene frame to the canvas viewport
    if (typeof renderer !== 'undefined' && typeof scene !== 'undefined' && typeof camera !== 'undefined') {
        renderer.render(scene, camera);
    }
}

/**
 * Handles CS 1.6 Viewmodel Bobbing, Jumps, and Sway
 */
function animateViewmodel(horizSpeed, delta) {
    if (!viewmodel) return;

    if (isGrounded && horizSpeed > 0.005) {
        bobTimer += horizSpeed * 20 * delta; 
        viewmodel.position.y = Math.sin(bobTimer * 2) * 0.025;
        viewmodel.position.x = Math.cos(bobTimer) * 0.015;
    } else if (!isGrounded) {
        viewmodel.position.y = THREE.MathUtils.lerp(viewmodel.position.y, -0.04, 10 * delta);
        viewmodel.position.x = THREE.MathUtils.lerp(viewmodel.position.x, 0.01, 10 * delta);
    } else {
        bobTimer += 1.5 * delta;
        viewmodel.position.y = Math.sin(bobTimer) * 0.004;
        viewmodel.position.x = THREE.MathUtils.lerp(viewmodel.position.x, 0, 10 * delta);
    }
}

let maxZ = 0;
let previousScore = 0;
let bestScore = 0;

const scoreEl = document.getElementById('score');
const prevScoreEl = document.getElementById('prev-score');
const bestScoreEl = document.getElementById('best-score');

function updateScore(zPos) {
    const currentScore = Math.floor(Math.abs(zPos));
    if (currentScore > maxZ) {
        maxZ = currentScore;
        if (scoreEl) {
            scoreEl.innerText = maxZ;
        }
    }
}

// --- KICKSTART THE SYSTEM ---
animate();
