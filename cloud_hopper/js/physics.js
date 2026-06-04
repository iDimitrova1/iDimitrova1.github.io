// --- GLOBAL PHYSICS STATES ---
// Expose these so main.js can read them for the speedometer and weapon bobbing
window.velocity = new THREE.Vector3(0, 0, 0);
window.isGrounded = false;

// Physics Constants
const GRAVITY = 0.0055;
const MOVE_SPEED = 0.05;
const JUMP_FORCE = 0.13;
const FRICTION = 0.85;

window.updatePhysics = function() {
    // Safety check: ensure the player object and input keys exist before calculating
    if (!window.yawObject || !window.keys) return;

    // 1. APPLY GRAVITY
    window.velocity.y -= GRAVITY;

    // 2. CALCULATE DIRECTIONAL MOVEMENT FROM INPUTS
    const moveVector = new THREE.Vector3(0, 0, 0);

    if (window.keys.w) moveVector.z -= 1;
    if (window.keys.s) moveVector.z += 1;
    if (window.keys.a) moveVector.x -= 1;
    if (window.keys.d) moveVector.x += 1;

    moveVector.normalize(); // Prevents moving faster diagonally

    // Translate movement relative to where the player is currently looking (Yaw rotation)
    const direction = new THREE.Vector3();
    direction.copy(moveVector).applyQuaternion(window.yawObject.quaternion);
    
    // Apply horizontal momentum
    window.velocity.x += direction.x * MOVE_SPEED;
    window.velocity.z += direction.z * MOVE_SPEED;

    // Apply horizontal friction so the player drifts to a stop naturally
    window.velocity.x *= FRICTION;
    window.velocity.z *= FRICTION;

    // 3. JUMP MECHANIC
    if (window.keys.space && window.isGrounded) {
        window.velocity.y = JUMP_FORCE;
        window.isGrounded = false;
    }

    // 4. PRE-MOVE POSITION PREDICTION (For Collision Detection)
    const nextX = window.yawObject.position.x + window.velocity.x;
    const nextY = window.yawObject.position.y + window.velocity.y;
    const nextZ = window.yawObject.position.z + window.velocity.z;

    // Account for player height offset from the platform top
    const feetY = nextY - window.playerHeight; 

    let standingOnPlatform = false;

    // 5. COLLISION DETECTION LOOP
    if (window.platforms && window.platforms.length > 0) {
        for (let i = 0; i < window.platforms.length; i++) {
            const p = window.platforms[i];

            // Check if player's X and Z coordinates are within the cloud's boundaries
            if (nextX >= p.minX && nextX <= p.maxX && nextZ >= p.minZ && nextZ <= p.maxZ) {
                
                // Check if the player is landing on top of the cloud platform
                // Allows a tiny threshold (0.2) for smooth landing frames
                if (window.yawObject.position.y - window.playerHeight >= p.topY - 0.2 && feetY <= p.topY) {
                    window.yawObject.position.y = p.topY + window.playerHeight; // Snap precisely to cloud surface
                    window.velocity.y = 0;                                      // Halt downward falling speed
                    standingOnPlatform = true;
                    break;
                }
            }
        }
    }

    window.isGrounded = standingOnPlatform;

    // 6. APPLY CALCULATED VELOCITIES TO PLAYER POSITION
    window.yawObject.position.x += window.velocity.x;
    if (!window.isGrounded) {
        window.yawObject.position.y += window.velocity.y;
    }
    window.yawObject.position.z += window.velocity.z;

    // 7. OCEAN FALL-ZONE & RESPAWN MECHANIC
    // If you miss a cloud and fall near the ocean surface, reset to the starting track
    if (window.yawObject.position.y < -10) {
        window.yawObject.position.set(0, window.playerHeight, 0); // Reset position
        window.velocity.set(0, 0, 0);                             // Clear all momentum
        window.isGrounded = true;

        // Regenerate the endless tracking clouds
        if (typeof window.clearAllClouds === 'function' && typeof window.buildInitialTrack === 'function') {
            window.clearAllClouds();
            window.buildInitialTrack();
        }
    }
};
