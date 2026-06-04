const speedo = document.getElementById('speedo');
let bobTimer = 0;
let gameTime = 0; 

function animate() {
    requestAnimationFrame(animate);

    if (gameStarted) {
        gameTime += 0.015;
        updateOceanWaves(gameTime);

        // Run movement mechanics calculations
        updatePhysics();

        // NEW: Check positions to spawn and delete clouds dynamically
        manageEndlessClouds(yawObject.position.z);

        // Map HUD Speedometer
        const horizSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        speedo.innerText = Math.round(horizSpeed * 1000);

        // CS 1.6 Viewmodel Sprite Bobbing Controller
        if (viewmodel) {
            if (isGrounded && horizSpeed > 0.005) {
                bobTimer += horizSpeed * 0.8;
                viewmodel.position.y = Math.sin(bobTimer * 2) * 0.025;
                viewmodel.position.x = Math.cos(bobTimer) * 0.015;
            } else if (!isGrounded) {
                viewmodel.position.y = THREE.MathUtils.lerp(viewmodel.position.y, -0.04, 0.1);
                viewmodel.position.x = THREE.MathUtils.lerp(viewmodel.position.x, 0.01, 0.1);
            } else {
                bobTimer += 0.02;
                viewmodel.position.y = Math.sin(bobTimer) * 0.004;
                viewmodel.position.x = THREE.MathUtils.lerp(viewmodel.position.x, 0, 0.1);
            }
        }
    }

    renderer.render(scene, camera);
}

// Run the core clock loop
animate();
