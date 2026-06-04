const speedo = document.getElementById('speedo');
let bobTimer = 0;
let gameTime = 0; 

function animate() {
    requestAnimationFrame(animate);

    // Safeguard: Wait until renderer, scene, and camera are fully initialized
    if (!window.renderer || !window.scene || !window.camera) return;

    if (window.gameStarted) {
        gameTime += 0.015;

        // 1. Update Ocean Waves
        if (typeof window.updateOceanWaves === 'function' && window.yawObject) {
            window.updateOceanWaves(gameTime, window.yawObject.position.x, window.yawObject.position.z);
        }

        // 2. Run Physics Safely
        if (typeof window.updatePhysics === 'function') {
            window.updatePhysics();
        }

        // 3. Manage Cloud Tracking
        if (typeof window.manageEndlessClouds === 'function' && window.yawObject) {
            window.manageEndlessClouds(window.yawObject.position.z);
        }

        // 4. Read Speed Safely from Physics
        // Uses window.velocity if it exists, otherwise defaults to zero vectors to prevent crashes
        const vel = window.velocity || { x: 0, y: 0, z: 0 };
        const horizSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
        
        if (speedo) {
            speedo.innerText = Math.round(horizSpeed * 1000);
        }

        // 5. Viewmodel / Weapon Bobbing Mechanics
        if (window.viewmodel) {
            const grounded = typeof window.isGrounded !== 'undefined' ? window.isGrounded : true;

            if (grounded && horizSpeed > 0.005) {
                bobTimer += horizSpeed * 0.8;
                window.viewmodel.position.y = Math.sin(bobTimer * 2) * 0.025;
                window.viewmodel.position.x = Math.cos(bobTimer) * 0.015;
            } else if (!grounded) {
                window.viewmodel.position.y = THREE.MathUtils.lerp(window.viewmodel.position.y, -0.04, 0.1);
                window.viewmodel.position.x = THREE.MathUtils.lerp(window.viewmodel.position.x, 0.01, 0.1);
            } else {
                bobTimer += 0.02;
                window.viewmodel.position.y = Math.sin(bobTimer * 0.5) * 0.004;
                window.viewmodel.position.x = THREE.MathUtils.lerp(window.viewmodel.position.x, 0, 0.1);
            }
        }
    }

    window.renderer.render(window.scene, window.camera);
}

// Fire up the loop
animate();
