const speedo = document.getElementById('speedo');

function animate() {
    requestAnimationFrame(animate);

    if (gameStarted) {
        // Run physics iterations
        updatePhysics();

        // Feed real-time speedometer interface
        const horizSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z) * 1000;
        speedo.innerText = Math.round(horizSpeed);
    }

    // Paint scene frame updates
    renderer.render(scene, camera);
}

// Fire the application clock loop
animate();
