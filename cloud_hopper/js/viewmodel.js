// Global container for the weapon so main.js can read it for bobbing
let viewmodel = new THREE.Group();

// 1. The Arm / Glove (Sleek CT-style dark camo sleeve)
const sleeveGeo = new THREE.BoxGeometry(0.15, 0.15, 0.5);
const sleeveMat = new THREE.MeshLambertMaterial({ color: 0x2b3a2f }); 
const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
sleeve.position.set(0.25, -0.25, -0.4);
sleeve.rotation.set(-0.3, -0.2, 0.1);
viewmodel.add(sleeve);

// 2. The Knife Handle (Grip)
const handleGeo = new THREE.BoxGeometry(0.03, 0.04, 0.18);
const handleMat = new THREE.MeshLambertMaterial({ color: 0x111111 }); 
const handle = new THREE.Mesh(handleGeo, handleMat);
handle.position.set(0.22, -0.15, -0.6);
handle.rotation.set(0.2, -0.3, 0.2);
viewmodel.add(handle);

// 3. The Knife Blade (Classic CS Silhouette)
const bladeGeo = new THREE.BoxGeometry(0.008, 0.06, 0.22);
const bladeMat = new THREE.MeshStandardMaterial({ 
    color: 0xdddddd, 
    metalness: 0.9, 
    roughness: 0.1 
});
const blade = new THREE.Mesh(bladeGeo, bladeMat);
blade.position.set(0.22, -0.11, -0.78);
blade.rotation.set(0.2, -0.3, 0.2);
viewmodel.add(blade);

// Attach directly to the camera initialized in world.js
camera.add(viewmodel);
