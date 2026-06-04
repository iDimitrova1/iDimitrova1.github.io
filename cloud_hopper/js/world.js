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
        roughness: 0.85,
        flatShading: true 
    });

    const sphereCount = Math.floor((width * depth) / 1.4) + 8;
    
    for (let i = 0; i < sphereCount; i++) {
        let radius = 0.6 + Math.random() * 0.8;
        let scaleY = 1.0;

        if (varianceType === 1) {       
            scaleY = 1.5 + Math.random() * 0.6;
        } else if (varianceType === 2) { 
            scaleY = 0.4 + Math.random() * 0.3;
            radius += 0.4;
        }

        const geo = new THREE.SphereGeometry(radius, 8, 8);
        const mesh = new THREE.Mesh(geo, cloudMat);
        mesh.scale.set(1.0, scaleY, 1.0);

        const offsetX = (Math.random() - 0.5) * (width - 1.0);
        const offsetZ = (Math.random() - 0.5) * (depth - 1.0);
        
        const distFromCenter = Math.sqrt(offsetX*offsetX + offsetZ*offsetZ);
        const maxDist = Math.sqrt((width*width + depth*depth) / 4);
        const centerLift = (1.0 - (distFromCenter / maxDist)) * 0.7;
        const offsetY = ((Math.random() - 0.5) * 0.3) + centerLift;

        mesh.position.set(offsetX, offsetY, offsetZ);
        cloudGroup.add(mesh);
    }

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
    addCloudPlatform(0, 0, 0, 12, 12, 0);
}

// Global Manager triggered by main.js every frame
function manageEndlessClouds(playerZ) {
    

    // 1. SPAWN LOOP: Keep drawing clouds up to 180 units ahead of the player
    while (lastSpawnZ > playerZ - 180) {
        // Increment parameters to build smoothly along the negative Z channel
        const gap = 13 + Math.random() * 5; // Random jump distance (13 to 18 units)
        lastSpawnZ -= gap;
        
        // Moderate weave left and right so it isn't a perfectly straight line
        lastSpawnX += (Math.random() - 0.5) * 6;
        lastSpawnX = Math.max(-10, Math.min(10, lastSpawnX)); // Keep within bounds
        
        // Gradual elevation adjustments
        nextSpawnY += (Math.random() - 0.3) * 1.5;
        nextSpawnY = Math.max(-2, Math.min(15, nextSpawnY)); // Prevent drifting too high/low

        const width = 8 + Math.random() * 5;
        const depth = 8 + Math.random() * 5;
        const randomStyle = Math.floor(Math.random() * 3); // 0=Normal, 1=Puffy, 2=Flat

        addCloudPlatform(lastSpawnX, nextSpawnY, lastSpawnZ, width, depth, randomStyle);
    }

    // 2. CLEANUP LOOP: Delete clouds passed by more than 40 units
    for (let i = platforms.length - 1; i >= 0; i--) {
        const p = platforms[i];
        if (p.centerZ > playerZ + 40) {
            scene.remove(p.mesh);

            // Crucial: Clear GPU memory allocations to prevent browser tab crashes
            p.mesh.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });

            // Remove from tracking array
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
