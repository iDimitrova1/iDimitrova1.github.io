if (window.camera) {

    // 1. Create the Parent Container (Handles the walking bobbing animations)
    window.viewmodel = new THREE.Group();
    window.camera.add(window.viewmodel);

    // 2. Set up the Texture Loader to pull from your assets folder
    const textureLoader = new THREE.TextureLoader();
    
    // 📁 CHANGE 'knife.png' to your exact filename if it is different!
    const knifeTexture = textureLoader.load('assets/cs1.6_knife.png', 
        function(texture) {
            console.log("Knife image loaded perfectly from assets!");
        },
        undefined,
        function(err) {
            console.error("Could not find your knife image. Check your assets folder filename!");
        }
    );

    // Keeps the pixels crisp and sharp if it's a low-res retro image
    knifeTexture.magFilter = THREE.NearestFilter;
    knifeTexture.minFilter = THREE.LinearFilter;

    // 3. Create a flat plane (quad) to project your 2D image onto
    // Adjust these two numbers to make the weapon wider or taller on screen
    const spriteWidth = 0.35;
    const spriteHeight = 0.35;
    const knifeGeo = new THREE.PlaneGeometry(spriteWidth, spriteHeight);

    // 4. Map the texture with transparency enabled
    const knifeMat = new THREE.MeshBasicMaterial({
        map: knifeTexture,
        transparent: true,   // Crucial! Makes the invisible background of your PNG see-through
        depthWrite: false,   // Prevents the image's invisible corners from clipping through clouds
        depthTest: true
    });

    const knifeMesh = new THREE.Mesh(knifeGeo, knifeMat);

    // 5. POSITIONING GRID (Dead-Center & Bottom-Up)
    // x = 0.0   -> Perfect horizontal center alignment
    // y = -0.18 -> Sunk just enough so the bottom edge of the image hides below the screen
    // z = -0.4  -> Kept close to your eyes so it stays in clear view
    knifeMesh.position.set(0.0, -0.18, -0.4);

    // Add the flat image mesh into our animated viewmodel group
    window.viewmodel.add(knifeMesh);
}
