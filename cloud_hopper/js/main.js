// --- MAIN GAME LOOP DRIVER ---
const speedo = document.getElementById('speedo');
let bobTimer = 0;

function animate() {
    requestAnimationFrame(animate);

    // Only update mechanics if the player has clicked the menu and locked their mouse
    if (gameStarted) {
        
        // 1. Run the physics iteration (Calculates movement, gravity, and cloud collisions)
        updatePhysics();

        // 2. Calculate horizontal velocity for the UI speedometer
        const horizSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        speedo.innerText = Math.round(horizSpeed * 1000);

        // 3. Counter-Strike Style Viewmodel Bobbing & Sway
        if (viewmodel) {
            if (isGrounded && horizSpeed > 0.005) {
                // Running: Bob the knife rhythmically matching the movement speed
                bobTimer += horizSpeed * 0.8;
                viewmodel.position.y = Math.sin(bobTimer * 2) * 0.025;
                viewmodel.position.x = Math.cos(bobTimer) * 0.015;
            } else if (!isGrounded) {
                // Airborne: Realistically sag and freeze the knife while jumping
                viewmodel.position.y = THREE.MathUtils.lerp(viewmodel.position.y, -0.04, 0.1);
                viewmodel.position.x = THREE.MathUtils.lerp(viewmodel.position.x, 0.01, 0.1);
            } else {
                // Idle: Soft, organic breathing motion when standing completely still
                bobTimer += 0.02;
                viewmodel.position.y = Math.sin(bobTimer) * 0.004;
                viewmodel.position.x = THREE.MathUtils.lerp(viewmodel.position.x, 0, 0.1);
            }
        }
    }

    // 4. Render the updated frame to the viewport
    renderer.render(scene, camera);
}

// Start the game loop clock
animate();
