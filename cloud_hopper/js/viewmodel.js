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

    // --- POSITION, ROTATE, AND SCALE THE KNIFE ---
    
    // Make the weapon bigger as requested
    // Increase these three numbers together if you want it even larger!
    knife.scale.set(2.6, 2.6, 2.6);

    // Rotate the blade so it tilts forward like an FPS viewpoint weapon
    knife.rotation.x = Math.PI / 3.5;  // Lean forward
    knife.rotation.y = -Math.PI / 6;   // Slight inward angle
    knife.rotation.z = -Math.PI / 12;  // Natural hand slant

    // Anchor the knife to the bottom-right of the viewport
    // x: positive moves right, negative moves left
    // y: lower negative numbers pull it further DOWN to the screen edge
    // z: controls depth distance from your eyes (-0.4 keeps it crisp and close)
    knife.position.set(0.22, -3, -0.4);

    // 3. Nest the knife inside the animated viewmodel parent group
    window.viewmodel.add(knife);
}
