// Kinematic States
let velocity = new THREE.Vector3();
let isGrounded = false;

// --- DYNAMIC MIDDLE-GROUND TUNERS ---
const GROUND_ACCEL = 0.09;     // Sweeter pickup speed (between 0.04 and 0.08)
const GROUND_FRICTION = 0.85;  // Crisp but natural slide deceleration
const AIR_ACCEL = 0.02;        // Clean, responsive mid-air adjustments
const BASE_JUMP_FORCE = 0.23;  // Solid base hop height
const GRAVITY = 0.0105;        // Balanced gravity arc
const AIR_SPEED_LIMIT = 0.2;  // Controlled horizontal air cap

function resetPlayer() {
    yawObject.position.set(0, playerHeight + 5.0, 0);
    yawObject.rotation.set(0, 0, 0);
    pitchObject.rotation.set(0, 0, 0);
    velocity.set(0, 0, 0);
    

    // CRITICAL: This variable name MUST match the one in updateScore!
    // If you used maxZ previously, change it to maxScore here.
    maxZ = 0; 
    
    if (scoreEl) {
        scoreEl.innerText = "0";
    }
}

function updatePhysics() {
    let wishDir = new THREE.Vector3();
    if (keys.w) wishDir.z -= 1;
    if (keys.s) wishDir.z += 1;
    if (keys.a) wishDir.x -= 1;
    if (keys.d) wishDir.x += 1;
    wishDir.normalize();
    wishDir.applyQuaternion(yawObject.quaternion);

    if (isGrounded) {
        velocity.x *= GROUND_FRICTION;
        velocity.z *= GROUND_FRICTION;

        if (wishDir.lengthSq() > 0) {
            velocity.x += wishDir.x * GROUND_ACCEL;
            velocity.z += wishDir.z * GROUND_ACCEL;
        }

        if (keys.space) {
            const horizSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
            
            // Rebalanced jump multiplier for controllable sprint-jumps
            const jumpBonus = horizSpeed * 0.35; 
            velocity.y = BASE_JUMP_FORCE + jumpBonus;
            
            isGrounded = false;
        }
    } else {
        if (wishDir.lengthSq() > 0) {
            const currentSpdProj = velocity.x * wishDir.x + velocity.z * wishDir.z;
            if (currentSpdProj < AIR_SPEED_LIMIT) {
                velocity.x += wishDir.x * AIR_ACCEL;
                velocity.z += wishDir.z * AIR_ACCEL;
            }
        }
    }

    // Kinematic updates
    velocity.y -= GRAVITY;
    yawObject.position.add(velocity);

    // Collision Box Processing
    let wasGroundedThisFrame = false;
    for (let p of platforms) {
        if (yawObject.position.x > p.minX && yawObject.position.x < p.maxX &&
            yawObject.position.z > p.minZ && yawObject.position.z < p.maxZ) {
            
            const feetY = yawObject.position.y - playerHeight;
            if (velocity.y <= 0 && feetY <= p.topY && feetY > p.topY - 0.8) {
                velocity.y = 0;
                yawObject.position.y = p.topY + playerHeight;
                wasGroundedThisFrame = true;
            }
        }
    }
    isGrounded = wasGroundedThisFrame;

    // Reset loop if plunging into the waves
    if (yawObject.position.y < -12) {
        resetPlayer();
    }
}
