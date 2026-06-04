// --- GLOBAL ENGINE INJECTIONS ---
window.scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff); 
scene.fog = new THREE.FogExp2(0xaaccff, 0.007);

window.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
window.renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Global Lighting Configurations
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(100, 150, 50);
scene.add(dirLight);

// Globalize Player Perspective Objects
window.playerHeight = 1.8;
window.pitchObject = new THREE.Object3D();
pitchObject.add(camera);
window.yawObject = new THREE.Object3D();
yawObject.position.set(0, playerHeight, 0);
yawObject.add(pitchObject);
scene.add(yawObject);

// Mouse Input Interaction Hook
document.addEventListener('mousemove', (e) => {
    if (!window.gameStarted) return;
    yawObject.rotation.y -= (e.movementX || 0) * 0.002;
    pitchObject.rotation.x -= (e.movementY || 0) * 0.002;
    pitchObject.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitchObject.rotation.x));
});

// Dynamic Aspect Ratio Resizing Window Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- ENDLESS CLOUD GENERATION LOGIC ---
window.platforms = [];
window.lastSpawnZ = 0;
window.nextSpawnY = 0;
window.lastSpawnX = 0;

window.addCloudPlatform = function(x, y, z, width, depth, varianceType = 0) {
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({ 
        color: 0xffffff, 
        roughness: 0.85,
        flatShading: true 
    });

    const sphereCount = Math.floor((width * depth) / 1.5) + 6;
    for (let i = 0; i < sphereCount; i++) {
        let radius = 0.6 + Math.random() * 0.8;
        let scaleY = 1.0;

        if (varianceType === 1) {       
            scaleY = 1.4 + Math.random() * 0.5;
        } else if (varianceType === 2) { 
            scaleY = 0.4 + Math.random() * 0.3;
            radius += 0.3;
        }

        const geo = new THREE.SphereGeometry(radius, 6, 6);
        const mesh = new THREE.Mesh(geo, cloudMat);
        mesh.scale.set(1.0, scaleY, 1.0);

        const offsetX = (Math.random() - 0.5) * (width - 1.0);
        const offsetZ = (Math.random() - 0.5) * (depth - 1.0);
        const offsetY = ((Math.random() - 0.5) * 0.3) + 0.3;

        mesh.position.set(offsetX, offsetY, offsetZ);
        cloudGroup.add(mesh);
    }

    cloudGroup.position.set(x, y, z);
    scene.add(cloudGroup);

    platforms.push({ 
        mesh: cloudGroup,
        centerZ: z,
        minX: x - width/2 - 0.4, maxX: x + width/2 + 0.4, 
        minZ: z - depth/2 - 0.4, maxZ: z + depth/2 + 0.4, 
        topY: y + 0.25
    });
};

window.manageEndlessClouds = function(playerZ) {
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
};

window.clearAllClouds = function() {
    for (let p of platforms) {
        scene.remove(p.mesh);
        p.mesh.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    }
    platforms.length = 0;
};

window.buildInitialTrack = function() {
    window.lastSpawnZ = 0;
    window.nextSpawnY = 0;
    window.lastSpawnX = 0;
    addCloudPlatform(0, 0, 0, 12, 12, 0);
};

// Start the engine track setup initialization
buildInitialTrack();
