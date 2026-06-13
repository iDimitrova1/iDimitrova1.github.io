// ocean.js
const OceanManager = {
  mesh: null,
  originalZ: null,
  normalFrame: 0,
  normalInterval: 3,

  getQuality: function() {
    return typeof QualityManager !== "undefined" && QualityManager.getPreset
      ? QualityManager.getPreset()
      : { oceanNormalInterval: 3 };
  },

  applyQuality: function() {
    const quality = this.getQuality();
    this.normalInterval = Math.max(1, Math.floor(quality.oceanNormalInterval || 3));
  },

  init: function(scene) {
    this.applyQuality();

    const existingOcean =
      typeof ocean !== "undefined" && ocean && ocean.isMesh ? ocean : null;

    if (existingOcean) {
      this.mesh = existingOcean;
      this.mesh.scale.set(2.5, 2.5, 1);
    } else {
      const quality = this.getQuality();
      const segments = quality.oceanSegments || 64;
      const oceanGeo = new THREE.PlaneGeometry(5000, 5000, segments, segments);
      const oceanMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        roughness: 0.28,
        metalness: 0.08,
        flatShading: true,
        side: THREE.DoubleSide
      });

      this.mesh = new THREE.Mesh(oceanGeo, oceanMat);
      scene.add(this.mesh);
    }

    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = -13;
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = true;

    const oceanGeo = this.mesh.geometry;
    const posAttr = oceanGeo.attributes.position;
    posAttr.usage = THREE.DynamicDrawUsage;

    const mat = this.mesh.material;
    if (mat) {
      mat.color.set(0x1d4ed8);
      mat.roughness = 0.28;
      mat.metalness = 0.08;
      mat.flatShading = true;
      mat.side = THREE.DoubleSide;
      mat.needsUpdate = true;
    }

    this.originalZ = new Float32Array(posAttr.count);
    for (let i = 0; i < posAttr.count; i++) {
      this.originalZ[i] = posAttr.getZ(i);
    }
  },

  update: function(time, playerZ) {
    if (!this.mesh || !this.originalZ) return;

    const geometry = this.mesh.geometry;
    const posAttr = geometry.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const depth = posAttr.getY(i);

      const wave =
        Math.sin(x * 0.025 + time * 1.6) * 1.45 +
        Math.cos(depth * 0.022 + time * 1.15) * 1.05 +
        Math.sin((x + depth) * 0.014 + time * 2.1) * 0.55;

      posAttr.setZ(i, this.originalZ[i] + wave);
    }

    posAttr.needsUpdate = true;

    this.normalFrame = (this.normalFrame + 1) % this.normalInterval;
    if (this.normalFrame === 0) {
      geometry.computeVertexNormals();
    }

    this.mesh.position.z = Number.isFinite(playerZ) ? playerZ : 0;
  }
};

if (typeof QualityManager !== "undefined" && QualityManager.onChange) {
  QualityManager.onChange(() => OceanManager.applyQuality());
}
