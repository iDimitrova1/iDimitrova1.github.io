// 3D Rendering Elements Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff); 
scene.fog = new THREE.FogExp2(0xaaccff, 0.008); // Distant fog over the sea

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting Rig
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(40, 80, 40);
scene.add(dirLight);

// Camera View Rigging Hierarchy
const playerHeight = 1.8;
const pitchObject = new THREE.Object3D();
pitchObject.add(camera);
const yawObject = new THREE.Object3D();
yawObject.position.set(0, playerHeight, 0);
yawObject.add(pitchObject);
scene.add(yawObject);

// Look Rotations
document.addEventListener('mousemove', (e) => {
    if (!gameStarted) return;
    yawObject.rotation.y -= (e.movementX || 0) * 0.002;
    pitchObject.rotation.x -= (e.movementY || 0) * 0.002;
    pitchObject.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitchObject.rotation.x));
});

// Window Responsive Engine
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- NEW: ENDLESS OCEAN PLANE ---
const oceanGeo = new THREE.PlaneGeometry(3000, 3000);
const oceanMat = new THREE.MeshLambertMaterial({ 
    color: 0x1d4ed8, // Deep blue sea color
    flatShading: true
});
const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI / 2; // Flat horizontal layout orientation
ocean.position.y = -16;          // Safe distance beneath clouds
scene.add(ocean);

// Cloud Geometry Generation (Smaller Cloud Puffs)
const platforms = [];

function addCloudPlatform(x, y, z, width, depth) {
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({ 
        color: 0xffffff, 
        roughness: 0.9,
        flatShading: true 
    });

    // Tighter calculations for smaller, dense cloud groupings
    const sphereCount = Math.floor((width * depth) / 1.2) + 3;
    
    for (let i = 0; i < sphereCount; i++) {
        const radius = 0.4 + Math.random() * 0.6; // Smaller puff radius parameters
        const geo = new THREE.SphereGeometry(radius, 6, 6);
        const mesh = new THREE.Mesh(geo, cloudMat);

        const offsetX = (Math.random() - 0.5) * (width - 0.5);
        const offsetZ = (Math.random() - 0.5) * (depth - 0.5);
        const offsetY = (Math.random() - 0.6) * 0.3;

        mesh.position.set(offsetX, offsetY, offsetZ);
        cloudGroup.add(mesh);
    }

    cloudGroup.position.set(x, y, z);
    scene.add(cloudGroup);

    platforms.push({ 
        minX: x - width/2 - 0.2, maxX: x + width/2 + 0.2, 
        minZ: z - depth/2 - 0.2, maxZ: z + depth/2 + 0.2, 
        topY: y + 0.2 
    });
}

// Map Layout Setup - Linear path traveling along negative Z axis corridor
addCloudPlatform(0, 0, 0, 8, 8);         // Shrunk starting base
addCloudPlatform(0, 0.5, -12, 4, 4);     // Cloud 1 (Linear -Z step)
addCloudPlatform(1, 1.5, -24, 4, 4);     // Cloud 2
addCloudPlatform(-1, 2.0, -36, 4, 4);    // Cloud 3
addCloudPlatform(0, 3.5, -48, 3.5, 3.5); // Cloud 4 (Smaller target)
addCloudPlatform(2, 4.0, -64, 4, 4);     // Cloud 5 (Far gap - requires momentum sprint!)
addCloudPlatform(0, 5.0, -78, 5, 5);     // Victory Platform Cloud
