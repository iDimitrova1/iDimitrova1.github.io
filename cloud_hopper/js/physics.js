// Kinematic States
let velocity = new THREE.Vector3();
let isGrounded = false;

// Upgraded Physics Tuners
const GROUND_ACCEL = 0.08;     // Boosted from 0.04 for quicker acceleration
const GROUND_FRICTION = 0.86;  // Adjusted to allow clean momentum slide
const AIR_ACCEL = 0.025;       // Snappier air strafing adjustments
const BASE_JUMP_FORCE = 0.22;  // Minimum jump force
const GRAVITY = 0.009;         // Slightly adjusted gravity curve
const AIR_SPEED_LIMIT = 0.16;  // Raised max speed limit cap

function resetPlayer() {
    yawObject.position.set(0, playerHeight, 0);
    velocity.set(0, 0, 0);
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
            // Calculate current horizontal speed vector length
            const horizSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
            
            // Dynamic Jump Modifier: running fast multiplies your vertical pop!
            const jumpBonus = horizSpeed * 0.75; 
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

    // Apply Downward Pull
    velocity.y -= GRAVITY;
    yawObject.position.add(velocity);

    // Bounding Box Collision Engine
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

    // Reset when plunging into the endless ocean
    if (yawObject.position.y < -15) {
        resetPlayer();
    }
}
