// 3D Rendering Elements Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff); 
scene.fog = new THREE.FogExp2(0xaaccff, 0.015);

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

// Cloud Geometry Generation
const platforms = [];

function addCloudPlatform(x, y, z, width, depth) {
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({ 
        color: 0xffffff, 
        roughness: 0.9,
        flatShading: true 
    });

    const sphereCount = Math.floor((width * depth) / 3) + 5;
    
    for (let i = 0; i < sphereCount; i++) {
        const radius = 1.0 + Math.random() * 1.2;
        const geo = new THREE.SphereGeometry(radius, 8, 8);
        const mesh = new THREE.Mesh(geo, cloudMat);

        const offsetX = (Math.random() - 0.5) * (width - 1.5);
        const offsetZ = (Math.random() - 0.5) * (depth - 1.5);
        const offsetY = (Math.random() - 0.6) * 0.5;

        mesh.position.set(offsetX, offsetY, offsetZ);
        cloudGroup.add(mesh);
    }

    cloudGroup.position.set(x, y, z);
    scene.add(cloudGroup);

    platforms.push({ 
        minX: x - width/2, maxX: x + width/2, 
        minZ: z - depth/2, maxZ: z + depth/2, 
        topY: y + 0.4 
    });
}

// Map Layout Setup
addCloudPlatform(0, 0, 0, 15, 15);         
addCloudPlatform(0, 0.5, -16, 12, 12);     
addCloudPlatform(12, 1.5, -28, 10, 10);    
addCloudPlatform(26, 2.0, -28, 11, 11);    
addCloudPlatform(26, 3.0, -12, 10, 10);    
addCloudPlatform(10, 4.0, -4, 12, 12);     
addCloudPlatform(-4, 5.0, -4, 14, 14);
