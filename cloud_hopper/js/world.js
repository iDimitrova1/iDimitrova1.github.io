// Global Manager triggered by main.js every frame
function manageEndlessClouds(playerZ) {
    // 1. SPAWN LOOP: Keep drawing clouds up to 180 units ahead of the player
    while (lastSpawnZ > playerZ - 180) {
        const gap = 13 + Math.random() * 5; 
        lastSpawnZ -= gap;
        
        lastSpawnX += (Math.random() - 0.5) * 6;
        lastSpawnX = Math.max(-10, Math.min(10, lastSpawnX)); 
        
        nextSpawnY += (Math.random() - 0.3) * 1.5;
        nextSpawnY = Math.max(-2, Math.min(15, nextSpawnY)); 

        const width = 8 + Math.random() * 5;
        const depth = 8 + Math.random() * 5;
        const randomStyle = Math.floor(Math.random() * 3); 

        addCloudPlatform(lastSpawnX, nextSpawnY, lastSpawnZ, width, depth, randomStyle);
    }

    // 2. CLEANUP LOOP: Delete clouds passed by more than 40 units
    for (let i = platforms.length - 1; i >= 0; i--) {
        const p = platforms[i];
        if (p.centerZ > playerZ + 40) {
            scene.remove(p.mesh);

            p.mesh.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });

            platforms.splice(i, 1);
        }
    }
}
