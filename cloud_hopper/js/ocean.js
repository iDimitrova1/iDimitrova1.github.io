// ocean.js
const OceanManager = {
    mesh: null,
    originalY: null,

    init: function(scene) {
        const oceanGeo = new THREE.PlaneGeometry(2000, 2000, 128, 128);
        oceanGeo.attributes.position.usage = THREE.DynamicDrawUsage;

        const oceanMat = new THREE.MeshStandardMaterial({ 
            color: 0x1d4ed8, 
            transparent: true,
            opacity: 0.85,
            roughness: 0.1, 
            metalness: 0.4,
            flatShading: false
        });
        
        this.mesh = new THREE.Mesh(oceanGeo, oceanMat);
        this.mesh.rotation.x = -Math.PI / 2;
        
        // FIX: The position assignment is now inside the function
        this.mesh.position.y = 0; 
        
        scene.add(this.mesh);

        const posAttr = oceanGeo.attributes.position;
        this.originalY = new Float32Array(posAttr.count);
        for (let i = 0; i < posAttr.count; i++) {
            this.originalY[i] = posAttr.getY(i);
        }
    },

    update: function(time, playerZ) {
        if (!this.mesh) return;

        const posAttr = this.mesh.geometry.attributes.position;
        
        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const z = posAttr.getZ(i);
            
            let y = this.originalY[i] + 
                    (Math.sin(x * 0.005 + time * 0.8) * 100) + 
                    (Math.cos(z * 0.006 + time * 0.5) * 100);
            
            if (isNaN(y)) y = this.originalY[i];
            
            posAttr.setY(i, y);
        }
        
        posAttr.needsUpdate = true;
        this.mesh.geometry.computeVertexNormals();
        this.mesh.position.z = playerZ;
    }
};
