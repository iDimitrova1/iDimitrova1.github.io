// world.js
// Core scene, renderer, camera, player rig, lights, and ocean base mesh.
// Cloud generation lives in clouds.js.

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff);
scene.fog = new THREE.FogExp2(0xaaccff, 0.00075);

const initialQuality =
  typeof QualityManager !== "undefined" && QualityManager.getPreset
    ? QualityManager.getPreset()
    : { pixelRatio: 1.75, shadows: true, shadowMapSize: 1536, cameraFar: 4500, antialias: true };

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  initialQuality.cameraFar || 4500
);

// Layer 0 is world geometry. Layer 1 is reserved for first-person weapon art.
camera.layers.enable(1);

const renderer = new THREE.WebGLRenderer({
  antialias: Boolean(initialQuality.antialias),
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = Boolean(initialQuality.shadows);
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

if (THREE.sRGBEncoding !== undefined) {
  renderer.outputEncoding = THREE.sRGBEncoding;
}

document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x42556a, 0.65);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(120, 250, -90);
dirLight.castShadow = Boolean(initialQuality.shadows);
dirLight.shadow.mapSize.width = initialQuality.shadowMapSize || 1536;
dirLight.shadow.mapSize.height = initialQuality.shadowMapSize || 1536;
dirLight.shadow.camera.near = 10;
dirLight.shadow.camera.far = 900;
dirLight.shadow.camera.left = -350;
dirLight.shadow.camera.right = 350;
dirLight.shadow.camera.top = 350;
dirLight.shadow.camera.bottom = -350;
dirLight.shadow.bias = -0.00025;
scene.add(dirLight);
scene.add(dirLight.target);

const moonLight = new THREE.DirectionalLight(0x9dbdff, 0.15);
moonLight.position.set(-120, 180, 90);
moonLight.castShadow = false;
scene.add(moonLight);
scene.add(moonLight.target);

if (typeof QualityManager !== "undefined" && QualityManager.applyRenderer) {
  QualityManager.applyRenderer(renderer, camera, dirLight);
  QualityManager.onChange(() => {
    QualityManager.applyRenderer(renderer, camera, dirLight);

    if (typeof EnvironmentManager !== "undefined" && EnvironmentManager.applyQuality) {
      EnvironmentManager.applyQuality();
    }

    if (typeof CloudManager !== "undefined" && CloudManager.applyQuality) {
      CloudManager.applyQuality();
    }

    if (typeof MountainManager !== "undefined" && MountainManager.applyQuality) {
      MountainManager.applyQuality();
    }

    if (typeof OceanManager !== "undefined" && OceanManager.applyQuality) {
      OceanManager.applyQuality();
    }

    if (typeof RayTracingManager !== "undefined" && RayTracingManager.applyQuality) {
      RayTracingManager.applyQuality();
    }
  });
}

const playerHeight = 1.8;
const pitchObject = new THREE.Object3D();
pitchObject.add(camera);

const yawObject = new THREE.Object3D();
yawObject.position.set(0, playerHeight + 1.1, 0);
yawObject.add(pitchObject);
scene.add(yawObject);

document.addEventListener("mousemove", (event) => {
  if (typeof gameStarted === "undefined" || !gameStarted) return;

  yawObject.rotation.y -= (event.movementX || 0) * 0.002;
  pitchObject.rotation.x -= (event.movementY || 0) * 0.002;
  pitchObject.rotation.x = Math.max(
    -Math.PI / 2,
    Math.min(Math.PI / 2, pitchObject.rotation.x)
  );
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  if (typeof QualityManager !== "undefined" && QualityManager.applyRenderer) {
    QualityManager.applyRenderer(renderer, camera, dirLight);
  } else {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

// --- OCEAN BASE MESH ---
// OceanManager in ocean.js reuses this mesh and owns the wave animation.
const oceanSegments =
  typeof QualityManager !== "undefined" && QualityManager.getPreset
    ? QualityManager.getPreset().oceanSegments || 64
    : 64;

const oceanGeo = new THREE.PlaneGeometry(2000, 2000, oceanSegments, oceanSegments);
const oceanMat = new THREE.MeshStandardMaterial({
  color: 0x1d4ed8,
  roughness: 0.32,
  metalness: 0.12,
  flatShading: true,
  side: THREE.DoubleSide
});

const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -13;
ocean.receiveShadow = Boolean(initialQuality.shadows);
ocean.frustumCulled = false;
scene.add(ocean);
