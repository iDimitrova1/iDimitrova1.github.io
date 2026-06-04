const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff); 
scene.fog = new THREE.FogExp2(0xaaccff, 0.007);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
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

// --- PERFORMANCE OPTIMIZED LOW-POLY OCEAN ---
// 30x30 grid runs incredibly fast while maintaining that classic geometric wave look
const oceanGeo = new THREE.PlaneGeometry(600, 600, 30, 30);
const oceanMat = new THREE.MeshStandardMaterial({ 
    color: 0x0044ff,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
    flatShading: true // Highlights the geometric retro edges
});
const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -13;   
scene.add(ocean);

function updateOceanWaves(time, playerX, playerZ) {
    ocean.position.x = playerX;
    ocean.position.z = playerZ;

    const posAttr = oceanGeo.attributes.position;
    
    for (let i = 0; i < posAttr.count; i++) {
        const worldX = posAttr.getX(i) + playerX;
        const worldZ = posAttr.getY(i) + playerZ;

        // Smooth rolling wave frequencies
        const swell1 = Math.sin(worldX * 0.05 + time * 1.2) * 0.6;
        const swell2 = Math.cos(worldZ * 0.05 + time * 1.0) * 0.5;
        
        posAttr.setZ(i, swell1 + swell2);
    }
    
    posAttr.needsUpdate = true;
    oceanGeo.computeVertexNormals();
}

// --- ENDLESS CLOUD GENERATION ---
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

        const geo = new THREE.SphereGeometry(radius, 6, 6); // Lowered polygon counts per cloud sphere
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
}

function buildInitialTrack() {
    lastSpawnZ = 0;
    nextSpawnY = 0;
    lastSpawnX = 0;
    addCloudPlatform(0, 0, 0, 12, 12, 0);
}

function manageEndlessClouds(playerZ) {
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
