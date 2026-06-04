// --- PERFORMANCE OPTIMIZED LOW-POLY OCEAN ---

// Create the geometry and stylized low-poly material
const oceanGeo = new THREE.PlaneGeometry(600, 600, 30, 30);
const oceanMat = new THREE.MeshStandardMaterial({ 
    color: 0x0044ff,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
    flatShading: true
});

const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -13; // Sits safely below the lowest starting clouds

// Ensure the scene exists before injecting the ocean mesh
if (window.scene) {
    window.scene.add(ocean);
}

// Global wave calculation function called by main.js
window.updateOceanWaves = function(time, playerX, playerZ) {
    ocean.position.x = playerX;
    ocean.position.z = playerZ;

    const posAttr = oceanGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        const worldX = posAttr.getX(i) + playerX;
        const worldZ = posAttr.getY(i) + playerZ;
        
        // Simulates realistic crests and troughs using overlapping sine/cosine waves
        const swell1 = Math.sin(worldX * 0.05 + time * 1.2) * 0.6;
        const swell2 = Math.cos(worldZ * 0.05 + time * 1.0) * 0.5;
        
        posAttr.setZ(i, swell1 + swell2);
    }
    posAttr.needsUpdate = true;
    oceanGeo.computeVertexNormals();
};
