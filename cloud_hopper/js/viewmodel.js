// viewmodel.js
// Layer 0 is the world. Layer 1 is reserved for first-person UI/weapon art.
const VIEWMODEL_LAYER = 1;

let viewmodel = new THREE.Group();
viewmodel.name = "first-person-viewmodel";
viewmodel.userData.viewModel = true;
viewmodel.userData.rayTraceIgnore = true;
viewmodel.layers.set(VIEWMODEL_LAYER);

if (camera && camera.layers) {
  camera.layers.enable(0);
  camera.layers.enable(VIEWMODEL_LAYER);
}

camera.add(viewmodel);

const textureLoader = new THREE.TextureLoader();

textureLoader.load(
  "assets/cs16_knife.png",
  function(texture) {
    if (THREE.sRGBEncoding !== undefined) {
      texture.encoding = THREE.sRGBEncoding;
    }

    const knifeGeo = new THREE.PlaneGeometry(0.4, 0.4);
    const knifeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      fog: false
    });

    // Keep the 2D knife art from being brightened/dimmed by day-night exposure.
    if (knifeMat.toneMapped !== undefined) {
      knifeMat.toneMapped = false;
    }

    const knifeSprite = new THREE.Mesh(knifeGeo, knifeMat);
    knifeSprite.name = "knife-viewmodel-sprite";
    knifeSprite.scale.set(1.4, 1.4, 1.4);
    knifeSprite.position.set(0.08, -0.05, -0.3);
    knifeSprite.renderOrder = 9999;
    knifeSprite.frustumCulled = false;
    knifeSprite.layers.set(VIEWMODEL_LAYER);
    knifeSprite.userData.viewModel = true;
    knifeSprite.userData.rayTraceIgnore = true;

    viewmodel.add(knifeSprite);
  },
  undefined,
  function(error) {
    console.error("Error loading the knife image sprite:", error);
  }
);
