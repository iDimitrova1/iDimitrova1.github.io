// Kinematic States
let velocity = new THREE.Vector3();
let isGrounded = false;

// Physics Tuners
const GROUND_ACCEL = 0.04;    
const GROUND_FRICTION = 0.80; 
const AIR_ACCEL = 0.015;      
const JUMP_FORCE = 0.22;      
const GRAVITY = 0.008;        
const AIR_SPEED_LIMIT = 0.07; 

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
            velocity.y = JUMP_FORCE;
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

    // Boundary Kill Zone Check
    if (yawObject.position.y < -20) {
        resetPlayer();
    }
}
