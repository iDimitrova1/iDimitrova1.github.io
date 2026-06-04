// Global container for the weapon viewmodel
let viewmodel = new THREE.Group();

// Attach the empty container to the camera immediately so it tracks head movement
camera.add(viewmodel);

// 1. Initialize the Texture Loader to read 2D images
const textureLoader = new THREE.TextureLoader();

textureLoader.load(
    'assets/cs16_knife.png', // Path to your transparent PNG
    function (texture) {
        // 2. Create a flat 2D plane geometry
        // (Width = 0.4, Height = 0.4. Adjust these to match your image's proportions!)
        const knifeGeo = new THREE.PlaneGeometry(0.45, 0.45);

        // 3. Create a material using basic shading so it stays bright and retro
        const knifeMat = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true, // Enables the PNG transparency
            depthTest: false,  // CRITICAL: Forces the weapon to always draw ON TOP of clouds
            depthWrite: false
        });

        // 4. Combine shape and image into a mesh
        const knifeSprite = new THREE.Mesh(knifeGeo, knifeMat);

        // 5. Calibration Positioning
        // X: push to the right, Y: pull down, Z: place slightly in front of lens
        knifeSprite.position.set(0.8, 0.8, -0.4); 

        // Add the flat mesh to our animated viewmodel group
        viewmodel.add(knifeSprite);
    },
    undefined,
    function (error) {
        console.error('Error loading the knife image sprite:', error);
    }
);
