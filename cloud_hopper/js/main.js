const speedo = document.getElementById('speedo');
let bobTimer = 0;
let gameTime = 0; // Tracks running clock ticks for wave math

function animate() {
    requestAnimationFrame(animate);

    if (gameStarted) {
        // 1. Progress time tracker and cycle ocean wave vertex offsets
        gameTime += 0.015;
        updateOceanWaves(gameTime);

        // 2. Compute physics frame
        updatePhysics();

        // 3. Map HUD Speedometer
        const horizSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        speedo.innerText = Math.round(horizSpeed * 1000);

        // 4. CS-Style Viewmodel Bobbing
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

animate();
