// Ensure the camera exists before trying to mount the weapon viewmodel
if (window.camera) {

    // 1. Create the Parent Container (This handles walking bobbing animations)
    window.viewmodel = new THREE.Group();
    window.camera.add(window.viewmodel);

    // 2. Create an Inner Group to hold the actual knife components
    const knife = new THREE.Group();

    // --- BUILD THE RETRO LOW-POLY KNIFE ---
    
    // Blade (Metallic Silver)
    const bladeGeo = new THREE.BoxGeometry(0.03, 0.25, 0.01);
    const bladeMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.8,
        roughness: 0.2,
        flatShading: true
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.15; // Shift up relative to handle
    knife.add(blade);

    // Guard / Hilt (Dark Metal)
    const guardGeo = new THREE.BoxGeometry(0.06, 0.015, 0.02);
    const guardMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.5,
        roughness: 0.5
    });
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.y = 0.025;
    knife.add(guard);

    // Handle (Grip Color)
    const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.1, 6);
    const handleMat = new THREE.MeshStandardMaterial({
        color: 0x114422, // Tactical dark green
        roughness: 0.8
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = -0.04;
    knife.add(handle);

    // --- POSITION, ROTATE, AND SCALE FOR DEAD-CENTER ---
    
    // Keep it nice and prominent on the screen
    knife.scale.set(1.6, 1.6, 1.6);

    // Rotations: Flattened out so it comes straight up from the bottom
    knife.rotation.x = Math.PI / 4.5; // Lean slightly forward into the screen for depth
    knife.rotation.y = 0;             // Removed side angle so it doesn't look crooked
    knife.rotation.z = 0;             // No rotation tilt left or right

    // Positioning Grid:
    // x = 0.0  --> Placed exactly in the horizontal center of the screen
    // y = -0.32 --> Sunk low to look like it is rising straight up from the bottom edge
    // z = -0.4  --> Distance away from your eyes
    knife.position.set(0.0, -0.32, -0.4);

    // 3. Nest the knife inside the animated viewmodel parent group
    window.viewmodel.add(knife);
}
