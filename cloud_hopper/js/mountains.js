// mountains.js
const MountainManager = {
    mountains: [],
    leftLastZ: 0,
    rightLastZ: 0,
    material: null,

    init: function(scene) {
        this.clear(scene);
        this.leftLastZ = 0;
        this.rightLastZ = 0;
        
        this.material = new THREE.MeshStandardMaterial({
            color: 0x3b444b,  
            roughness: 1.0,   
            metalness: 0.0,
            flatShading: true 
        });
        
        console.log("🏔️ MountainManager: Spawning wide, distant mountain ranges.");
    },

    manage: function(playerZ, scene) {
        const spawnAhead = 1000;  // Increased render distance so you don't see them pop in
        const deleteBehind = 150;

        // 1. Generate Left Mountain Range
        while (this.leftLastZ > playerZ - spawnAhead) {
            const gap = 60 + Math.random() * 80; 
            this.leftLastZ -= gap;
            // PUSHED BACK: x is now between -160 and -260
            this.spawn(-160 - Math.random() * 100, this.leftLastZ, scene);
        }

        // 2. Generate Right Mountain Range
        while (this.rightLastZ > playerZ - spawnAhead) {
            const gap = 60 + Math.random() * 80;
            this.rightLastZ -= gap;
            // PUSHED BACK: x is now between 160 and 260
            this.spawn(160 + Math.random() * 100, this.rightLastZ, scene);
        }

        // 3. GPU Memory Protection
        for (let i = this.mountains.length - 1; i >= 0; i--) {
            const m = this.mountains[i];
            if (m.position.z > playerZ + deleteBehind) {
                scene.remove(m);
                m.geometry.dispose(); 
                this.mountains.splice(i, 1);
            }
        }
    },

    spawn: function(x, z, scene) {
        // WIDER AND FLATTER
        const baseRadius = 120 + Math.random() * 90; // Massive, sweeping bases
        const topRadius = 5 + Math.random() * 20;    // The magic trick to cut off the pointy tip
        const height = 150 + Math.random() * 80;      // Slightly squatter heights
        
        const radialSegments = 7 + Math.floor(Math.random() * 4); 
        const heightSegments = 5 + Math.floor(Math.random() * 3); 

        // We use a Cylinder instead of a Cone to allow for the flat topRadius
        const geometry = new THREE.CylinderGeometry(topRadius, baseRadius, height, radialSegments, heightSegments);

        const positions = geometry.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
            const vy = positions.getY(i);
            
            // We only protect the very bottom base from moving, let the top get craggy!
            if (vy > -height / 2.1) {
                const jitter = 18; // Slightly more aggressive jitter for the wider faces
                
                positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * jitter);
                positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * jitter);
                positions.setY(i, vy + (Math.random() - 0.5) * jitter);
            }
        }
        
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, this.material);

        mesh.position.set(x, height / 2 - 40, z);
        mesh.rotation.y = Math.random() * Math.PI; 

        scene.add(mesh);
        this.mountains.push(mesh);
    },

    clear: function(scene) {
        this.mountains.forEach(m => {
            scene.remove(m);
            m.geometry.dispose();
        });
        this.mountains = [];
        if (this.material) {
            this.material.dispose();
            this.material = null;
        }
    }
};
