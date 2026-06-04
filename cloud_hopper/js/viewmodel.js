// Global container for the weapon viewmodel
let viewmodel = new THREE.Group();

// Attach the empty container to the camera immediately so it tracks head movement
camera.add(viewmodel);

// Initialize the Texture Loader to read 2D images
const textureLoader = new THREE.TextureLoader();

textureLoader.load(
    'assets/cs16_knife.png', // Path to your transparent PNG
    function (texture) {
        // ENLARGED BY 50%: Boosted size parameters from 0.45 to 0.675
        const knifeGeo = new THREE.PlaneGeometry(0.675, 0.675);

        const knifeMat = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true, // Enables the PNG transparency
            depthTest: false,  // Forces the weapon to always draw ON TOP of clouds
            depthWrite: false
        });

        const knifeSprite = new THREE.Mesh(knifeGeo, knifeMat);

        // --- NEW CENTERED POSITIONING ---
        // X: Set to 0.0 to lock it perfectly in the horizontal center of the screen
        // Y: Dropped to -0.22 so the bottom of the larger image rests cleanly at the screen edge
        // Z: Kept at -0.4 for consistent depth focus
        knifeSprite.position.set(0.0, -0.22, -0.4); 

        // Add the flat mesh to our animated viewmodel group
        viewmodel.add(knifeSprite);
    },
    undefined,
    function (error) {
        console.error('Error loading the knife image sprite:', error);
    }
);