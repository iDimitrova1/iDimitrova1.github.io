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

// --- REALISTIC MATHEMATICAL LOW-POLY OCEAN ---
const oceanGeo = new THREE.PlaneGeometry(2000, 2000, 64, 64); // Segments enable vertex deformation
const oceanMat = new THREE.MeshStandardMaterial({ 
    color: 0x1d4ed8, 
    roughness: 0.25, 
    metalness: 0.15,
    flatShading: true // Gives waves a clean, geometric, shaded definition
});
const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -13;
scene.add(ocean);

// Store original coordinate baselines for displacement tracking
const posAttr = oceanGeo.attributes.position;
const originalZ = new Float32Array(posAttr.count);
for (let i = 0; i < posAttr.count; i++) {
    originalZ[i] = posAttr.getZ(i);
}

// Globally accessible wave animation calculation
function updateOceanWaves(time) {
    const posAttr = oceanGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i); 

        // Overlaying multiple wave sine frequencies for organic rhythm
        const wave1 = Math.sin(x * 0.02 + time * 1.0) * 1.3;
        const wave2 = Math.cos(y * 0.03 + time * 0.8) * 1.1;
        const wave3 = Math.sin((x + y) * 0.01 + time * 1.4) * 0.4;

        posAttr.setZ(i, originalZ[i] + wave1 + wave2 + wave3);
    }
    posAttr.needsUpdate = true;
    oceanGeo.computeVertexNormals(); // Recalculate lighting shading reflections dynamically
}

// --- PROCEDURAL DIVERSE CLOUD GENERATOR ---
const platforms = [];

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

        // Shape morphing properties based on structural layout types
        if (varianceType === 1) {       // Towering Cumulus (Tall, bubbly)
            scaleY = 1.5 + Math.random() * 0.6;
        } else if (varianceType === 2) { // Long Stratus (Flat, widespread layers)
            scaleY = 0.4 + Math.random() * 0.3;
            radius += 0.4;
        }

        const geo = new THREE.SphereGeometry(radius, 8, 8);
        const mesh = new THREE.Mesh(geo, cloudMat);
        mesh.scale.set(1.0, scaleY, 1.0);

        const offsetX = (Math.random() - 0.5) * (width - 1.0);
        const offsetZ = (Math.random() - 0.5) * (depth - 1.0);
        
        // Dynamic centering logic: pulls middle puffs up to create natural mounds
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
        minX: x - width/2 - 0.4, maxX: x + width/2 + 0.4, 
        minZ: z - depth/2 - 0.4, maxZ: z + depth/2 + 0.4, 
        topY: y + 0.25
    });
}

// --- COMFORTABLE MEDIUM LINEAR LAYOUT ---
// Params: X, Y, Z, Width, Depth, VarianceType (0=Standard, 1=Tall/Puffy, 2=Flat/Wide)
addCloudPlatform(0, 0, 0, 11, 11, 0);          // Welcoming starting area
addCloudPlatform(0, 0.5, -16, 9, 9, 1);        // Tall, towering cloud platform
addCloudPlatform(2, 1.5, -33, 14, 7, 2);       // Long, horizontal shelf-cloud lane
addCloudPlatform(-2, 2.5, -50, 8, 12, 0);      // Elongated, deep channel cloud
addCloudPlatform(0, 4.0, -68, 11, 11, 1);      // Giant puffy cumulus cluster
addCloudPlatform(1, 5.0, -87, 12, 12, 0);      // Grand Final destination base
