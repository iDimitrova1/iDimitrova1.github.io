const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff); 
scene.fog = new THREE.FogExp2(0xaaccff, 0.007); // Fog blends the ocean seamlessly into the sky

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Enhanced Lighting for Real Water Highlights
scene.add(new THREE.AmbientLight(0xffffff, 0.4)); // Soft ambient environment light
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9); // Strong sun light for specular glints
dirLight.position.set(100, 150, 50);
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

// --- NEW HIGH-DENSITY SMOOTH OCEAN ---
// 120x120 segments over a 600-unit area creates a highly detailed surface mesh
const oceanGeo = new THREE.PlaneGeometry(600, 600, 120, 120);
const oceanMat = new THREE.MeshStandardMaterial({ 
    color: 0x0044ff,      // Deep tropical blue
    roughness: 0.15,      // Shiny, glossy surface
    metalness: 0.1,       // Reflects sky light
    transparent: true,
    opacity: 0.85         // Slight transparency for depth
});
const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -13;   // Distance below the clouds
scene.add(ocean);

// Globally accessible wave generator that tracks player coordinates
function updateOceanWaves(time, playerX, playerZ) {
    // Keep the ocean perfectly centered underneath the player
    ocean.position.x = playerX;
    ocean.position.z = playerZ;

    const posAttr = oceanGeo.attributes.position;
    
    for (let i = 0; i < posAttr.count; i++) {
        // Calculate world coordinates so the waves don't "slide" awkwardly when you run
        const worldX = posAttr.getX(i) + playerX;
        const worldZ = posAttr.getY(i) + playerZ; // Local Y maps to World Z due to plane rotation

        // Layering 3 different sine frequencies for organic, natural fluid swells
        const swell1 = Math.sin(worldX * 0.04 + time * 1.5) * 0.7;
        const swell2 = Math.cos(worldZ * 0.04 + time * 1.2) * 0.6;
        const chop = Math.sin((worldX + worldZ) * 0.1 + time * 2.0) * 0.2;

        posAttr.setZ(i, swell1 + swell2 + chop);
    }
    
    posAttr.needsUpdate = true;
    oceanGeo.computeVertexNormals(); // Recalculate lighting normals so the specular highlights move with the waves
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

    platforms.push({ 
        mesh: cloudGroup,
        centerZ: z,
        minX: x - width/2 - 0.4, maxX: x + width/2 + 0.4, 
        minZ: z - depth/2 - 0.4, maxZ: z + depth/2 + 0.4, 
        topY: y + 0.25
    });
}

function buildInitialTrack() {
    lastSpawnZ = 0;
    nextSpawnY = 0;
    lastSpawnX = 0;
    addCloudPlatform(0, 0, 0, 12, 12, 0);
}

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
}

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

buildInitialTrack();
