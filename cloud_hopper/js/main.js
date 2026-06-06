// --- MAIN GAME ENGINE CONTROLLER ---

// 1. Core Clock & UI Elements
const clock = new THREE.Clock();
const speedo = document.getElementById('speedo');
let bobTimer = 0;
let gameTime = 0;

/**
 * Main Animation and Logic Clock Loop
 */
function animate() {
    requestAnimationFrame(animate);

    // Get the seconds passed since the last rendered frame
    const delta = clock.getDelta();

    // Cap extreme delta spikes (e.g., if the user switches browser tabs) to prevent clipping
    const cappedDelta = Math.min(delta, 0.1);

    if (gameStarted) {
        // A. Track accumulated runtime for mathematical wave equations
        gameTime += cappedDelta;
        updateOceanWaves(gameTime);

        // B. Advance physics engine frame using time-corrected steps
        updatePhysics(cappedDelta);

        // C. Track the player's current depth location to handle endless generation
        if (typeof yawObject !== 'undefined') {
            manageEndlessClouds(yawObject.position.z);
        }

        // D. Update Velocity HUD Speedometer
        if (typeof velocity !== 'undefined') {
            const horizSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
            // Scaled multiplier to match a clean tactical speed readout
            speedo.innerText = Math.round(horizSpeed * 1000);
            
            //D.1 Score track
	if (typeof yawObject !== 'undefined') {
  	  manageEndlessClouds(yawObject.position.z);
   	 updateScore(yawObject.position.z); // Track progress
	}
            
            // E. Counter-Strike Viewmodel Animation Controller
            animateViewmodel(horizSpeed, cappedDelta);
        }
    }

    // F. Render the synchronized scene frame to the canvas viewport
    if (typeof renderer !== 'undefined' && typeof scene !== 'undefined' && typeof camera !== 'undefined') {
        renderer.render(scene, camera);
    }
}

/**
 * Handles CS 1.6 Viewmodel Bobbing, Jumps, and Sway
 * @param {number} horizSpeed - Current flat moving speed
 * @param {number} delta - Capped clock time slice
 */
function animateViewmodel(horizSpeed, delta) {
    if (!viewmodel) return;

    if (isGrounded && horizSpeed > 0.005) {
        // Player is sprinting: Bob rhythmically based on velocity pace
        bobTimer += horizSpeed * 20 * delta; 
        viewmodel.position.y = Math.sin(bobTimer * 2) * 0.025;
        viewmodel.position.x = Math.cos(bobTimer) * 0.015;
    } else if (!isGrounded) {
        // Player is airborne: Smoothly sag the weapon down out of vision center
        viewmodel.position.y = THREE.MathUtils.lerp(viewmodel.position.y, -0.04, 10 * delta);
        viewmodel.position.x = THREE.MathUtils.lerp(viewmodel.position.x, 0.01, 10 * delta);
    } else {
        // Player is standing completely still: Idle organic breathing rhythm
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
    
    // It only updates if currentScore is higher than maxScore
    if (currentScore > maxZ) {
        maxZ = currentScore;
        scoreEl.innerText = maxZ;
    }
}

// --- KICKSTART THE SYSTEM ---
// Start the master execution loop
animate();
