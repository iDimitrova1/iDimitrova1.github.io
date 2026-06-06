const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff); 
scene.fog = new THREE.FogExp2(0xaaccff, 0.006);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
dirLight.position.set(50, 100, 30);
scene.add(dirLight);

const playerHeight = 1.8;
const pitchObject = new THREE.Object3D();
pitchObject.add(camera);
const yawObject = new THREE.Object3D();
yawObject.position.set(0, playerHeight, 0);
yawObject.add(pitchObject);
scene.add(yawObject);

document.addEventListener('mousemove', (e) => {
    if (!gameStarted) return;
    yawObject.rotation.y -= (e.movementX || 0) * 0.002;
    pitchObject.rotation.x -= (e.movementY || 0) * 0.002;
    pitchObject.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitchObject.rotation.x));
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Low-Poly Ocean Setup
const oceanGeo = new THREE.PlaneGeometry(2000, 2000, 64, 64);
const oceanMat = new THREE.MeshStandardMaterial({ 
    color: 0x1d4ed8, 
    roughness: 0.25, 
    metalness: 0.15,
    flatShading: true
});
const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -13;
scene.add(ocean);

const posAttr = oceanGeo.attributes.position;
const originalZ = new Float32Array(posAttr.count);
for (let i = 0; i < posAttr.count; i++) {
    originalZ[i] = posAttr.getZ(i);
}

function updateOceanWaves(time) {
    const posAttr = oceanGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i); 
        const wave1 = Math.sin(x * 0.02 + time * 1.0) * 1.3;
        const wave2 = Math.cos(y * 0.03 + time * 0.8) * 1.1;
        const wave3 = Math.sin((x + y) * 0.01 + time * 1.4) * 0.4;
        posAttr.setZ(i, originalZ[i] + wave1 + wave2 + wave3);
    }
    posAttr.needsUpdate = true;
    oceanGeo.computeVertexNormals();
	if (typeof yawObject !== 'undefined') {
    // Keep the ocean following the player on the Z-axis
    // We only update the Z position to keep it aligned
    ocean.position.z = yawObject.position.z;
}
}

// --- ENDLESS PROCEDURAL CLOUD LOGIC ---
const platforms = [];
let lastSpawnZ = 0;
let nextSpawnY = 0;
let lastSpawnX = 0;

function addCloudPlatform(x, y, z, width, depth, varianceType = 0) {
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({ 
        color: 0xffffff, 
    transparent: true,
    opacity: 0.8,      // Almost solid, but light catches the edges better
    });

    const sphereGeo = new THREE.SphereGeometry(1, 16, 16);

    const sphereCount = 150 + Math.floor(Math.random() * 5);
    
	for (let i = 0; i < sphereCount; i++) {
        const mesh = new THREE.Mesh(sphereGeo, cloudMat);
        
        // Vary the size of each sphere to create a "lumpy" organic shape
        const s = 0.8 + Math.random() * 1.2;
        mesh.scale.set(s, s * 0.8, s); 

        // Position them in a cluster
        const offsetX = (Math.random() - 0.5) * width;
        const offsetZ = (Math.random() - 0.5) * depth;
        mesh.position.set(offsetX, 0, offsetZ);
        
        cloudGroup.add(mesh);
    }
    cloudGroup.position.set(x, y, z);
    scene.add(cloudGroup);

    cloudGroup.position.set(x, y, z);
    scene.add(cloudGroup);

    // Save metadata + reference to the 3D mesh container for later cleanup
    platforms.push({ 
        mesh: cloudGroup,
        centerZ: z,
        minX: x - width/2 - 0.4, maxX: x + width/2 + 0.4, 
        minZ: z - depth/2 - 0.4, maxZ: z + depth/2 + 0.4, 
        topY: y + 0.25
    });
}

// Function to generate the starting platform sequence
function buildInitialTrack() {
    lastSpawnZ = 0;
    nextSpawnY = 0;
    lastSpawnX = 0;
    
    // Safety starting zone
    addCloudPlatform(0, 0, 0, 18, 18, 0);
}

// Global Manager triggered by main.js every frame
function manageEndlessClouds(playerZ) {
    
    // 1. SPAWN LOOP: Keep drawing clouds up to 100 units ahead of the player
    
    if (playerZ > -1 && lastSpawnZ < -150)
	{ clearAllClouds(); buildInitialTrack(); return;
	}
     while (lastSpawnZ > playerZ - 100) {
        const gap = 45 + Math.random() * 12; 
        lastSpawnZ -= gap;
        
        lastSpawnX += (Math.random() - 0.5) * 16;
        lastSpawnX = Math.max(-40, Math.min(40, lastSpawnX)); 
        
        nextSpawnY += (Math.random() - 0.3) * 3.5;
        nextSpawnY = Math.max(-2, Math.min(15, nextSpawnY)); 

        const width = 14 + Math.random() * 5;
        const depth = 14 + Math.random() * 5;
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

// Complete system clean helper
function clearAllClouds() {
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
}

// Generate the first cloud setup
buildInitialTrack();
