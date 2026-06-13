// mountains.js
// Procedural scenery mountains. Mountains are visual scenery; ray features
// target lightweight cloud proxies instead.
const MountainManager = {
  mountains: [],
  leftLastZ: 0,
  rightLastZ: 0,
  rockMaterial: null,
  snowMaterial: null,
  trunkMaterial: null,
  foliageMaterial: null,
  trunkGeometry: null,
  foliageGeometry: null,
  spawnAhead: 3400,
  deleteBehind: 1200,
  oceanY: -13,

  getQuality: function() {
    return typeof QualityManager !== "undefined" && QualityManager.getPreset
      ? QualityManager.getPreset()
      : { mountainSpawnAhead: 3400, mountainDeleteBehind: 1200, mountainSegmentsScale: 1, treeDensity: 1, snowDetail: 1 };
  },

  applyQuality: function() {
    const quality = this.getQuality();
    this.spawnAhead = quality.mountainSpawnAhead || 3400;
    this.deleteBehind = quality.mountainDeleteBehind || 1200;
  },

  createMaterials: function() {
    if (!this.rockMaterial) {
      this.rockMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.98,
        metalness: 0.01,
        flatShading: false
      });
    }

    if (!this.snowMaterial) {
      this.snowMaterial = new THREE.MeshStandardMaterial({
        color: 0xeaf3ff,
        roughness: 0.92,
        metalness: 0.0,
        flatShading: false,
        polygonOffset: true,
        polygonOffsetFactor: -1.0,
        polygonOffsetUnits: -1.0
      });
    }

    if (!this.trunkMaterial) {
      this.trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a2416,
        roughness: 0.95,
        metalness: 0.0,
        flatShading: true
      });
    }

    if (!this.foliageMaterial) {
      this.foliageMaterial = new THREE.MeshStandardMaterial({
        color: 0x15351f,
        roughness: 1.0,
        metalness: 0.0,
        flatShading: true
      });
    }

    if (!this.trunkGeometry) {
      this.trunkGeometry = new THREE.CylinderGeometry(0.22, 0.34, 1, 5, 1);
    }

    if (!this.foliageGeometry) {
      this.foliageGeometry = new THREE.ConeGeometry(1, 1, 7, 2);
    }
  },

  init: function(scene, playerZ = 0) {
    this.applyQuality();
    this.clear(scene);
    this.leftLastZ = playerZ;
    this.rightLastZ = playerZ;
    this.createMaterials();
    this.manage(playerZ, scene);
    console.log("MountainManager: spawned grounded mountain ranges with trees and snow.");
  },

  reset: function(scene, playerZ = 0) {
    this.init(scene, playerZ);
  },

  manage: function(playerZ, scene) {
    this.applyQuality();
    if (!scene) return;
    if (!this.rockMaterial) this.createMaterials();

    while (this.leftLastZ > playerZ - this.spawnAhead) {
      const gap = 90 + Math.random() * 115;
      this.leftLastZ -= gap;
      this.spawnRange("left", this.leftLastZ, scene);
    }

    while (this.rightLastZ > playerZ - this.spawnAhead) {
      const gap = 90 + Math.random() * 115;
      this.rightLastZ -= gap;
      this.spawnRange("right", this.rightLastZ, scene);
    }

    for (let i = this.mountains.length - 1; i >= 0; i--) {
      const group = this.mountains[i];

      if (group.position.z > playerZ + this.deleteBehind) {
        scene.remove(group);
        this.disposeRangeGroup(group);
        this.mountains.splice(i, 1);
      }
    }

    this.updateLOD(playerZ);
  },

  updateLOD: function(playerZ) {
    const treeDistance = this.spawnAhead * 0.48;
    const snowDistance = this.spawnAhead * 0.82;

    for (let group of this.mountains) {
      const distance = Math.abs((group.position.z || 0) - playerZ);
      const showTrees = distance < treeDistance;
      const showSnow = distance < snowDistance;

      group.traverse((child) => {
        if (!child.userData) return;

        if (child.userData.type === "mountain-tree-trunks" || child.userData.type === "mountain-tree-foliage") {
          child.visible = showTrees;
        } else if (child.userData.type === "snow-cap") {
          child.visible = showSnow;
        }
      });
    }
  },

  spawnRange: function(side, z, scene) {
    const sign = side === "left" ? -1 : 1;
    const group = new THREE.Group();
    group.name = `${side}-forested-mountain-range`;
    group.position.z = z;
    group.frustumCulled = false;
    group.layers.set(0);
    group.userData.rayTraceIgnore = true;

    const treeSpecs = [];
    const quality = this.getQuality();
    const segmentScale = Math.max(0.45, quality.mountainSegmentsScale || 1);
    const treeDensityScale = Math.max(0, quality.treeDensity || 1);
    const snowDetail = Math.max(0.5, quality.snowDetail || 1);
    const layerCount = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < layerCount; i++) {
      const distance = 235 + i * 86 + Math.random() * 80;
      const localX = sign * distance;
      const localZ = (Math.random() - 0.5) * 125;
      const height = Math.max(120, 180 + Math.random() * 95 - i * 20);
      const radius = 155 + Math.random() * 112 + i * 28;
      const segments = Math.max(12, Math.floor((20 + Math.floor(Math.random() * 8)) * segmentScale));
      const rings = Math.max(8, Math.floor((12 + Math.floor(Math.random() * 5)) * segmentScale));
      const baseY = this.oceanY - 64 - Math.random() * 34;
      const pointierTop = Math.random() < 0.42;
      const topRadiusFactor = pointierTop
        ? 0.052 + Math.random() * 0.04
        : 0.10 + Math.random() * 0.055;
      const snowLine = pointierTop
        ? 0.70 + Math.random() * 0.045
        : 0.74 + Math.random() * 0.055;
      const rotationY = Math.random() * Math.PI * 2;

      const options = {
        pointierTop: pointierTop,
        topRadiusFactor: topRadiusFactor,
        snowLine: snowLine
      };

      const geometry = this.createMountainGeometry(radius, height, segments, rings, options);
      const mesh = new THREE.Mesh(geometry, this.rockMaterial);

      // Geometry starts at y=0. This value is the true base and is kept under water.
      mesh.position.set(localX, baseY, localZ);
      mesh.rotation.y = rotationY;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      mesh.layers.set(0);
      mesh.userData.type = "mountain";
      group.add(mesh);

      const snowGeometry = this.createSnowCapGeometry(radius, height, segments, options);
      const snowCap = new THREE.Mesh(snowGeometry, this.snowMaterial);
      snowCap.position.copy(mesh.position);
      snowCap.rotation.y = rotationY;
      snowCap.castShadow = true;
      snowCap.receiveShadow = true;
      snowCap.frustumCulled = false;
      snowCap.layers.set(0);
      snowCap.userData.type = "snow-cap";
      group.add(snowCap);

      this.queueTreesForPeak(treeSpecs, {
        sign: sign,
        x: localX,
        z: localZ,
        baseY: baseY,
        height: height,
        radius: radius,
        rotationY: rotationY,
        topRadiusFactor: topRadiusFactor,
        density: Math.max(2, Math.floor((7 + Math.random() * 8 - i * 1.4) * treeDensityScale))
      });

      // Add shoulders to create connected massifs instead of isolated cones.
      if (Math.random() > 0.32) {
        const shoulderHeight = height * (0.50 + Math.random() * 0.23);
        const shoulderRadius = radius * (0.58 + Math.random() * 0.26);
        const shoulderTop = 0.11 + Math.random() * 0.055;
        const shoulderBaseY = baseY - Math.random() * 7;
        const shoulderX = localX + sign * (radius * (0.34 + Math.random() * 0.35));
        const shoulderZ = localZ + (Math.random() - 0.5) * radius * 0.68;
        const shoulderRotation = Math.random() * Math.PI * 2;
        const shoulderOptions = {
          pointierTop: Math.random() < 0.16,
          topRadiusFactor: shoulderTop,
          snowLine: 0.80 + Math.random() * 0.08
        };
        const shoulderGeometry = this.createMountainGeometry(
          shoulderRadius,
          shoulderHeight,
          Math.max(18, segments - 4),
          Math.max(10, rings - 3),
          shoulderOptions
        );
        const shoulder = new THREE.Mesh(shoulderGeometry, this.rockMaterial);
        shoulder.position.set(shoulderX, shoulderBaseY, shoulderZ);
        shoulder.rotation.y = shoulderRotation;
        shoulder.castShadow = true;
        shoulder.receiveShadow = true;
        shoulder.frustumCulled = false;
        shoulder.layers.set(0);
        shoulder.userData.type = "mountain-shoulder";
        group.add(shoulder);

        if (Math.random() > 0.35) {
          const shoulderSnow = new THREE.Mesh(
            this.createSnowCapGeometry(
              shoulderRadius,
              shoulderHeight,
              Math.max(12, Math.floor((segments - 4) * snowDetail)),
              shoulderOptions
            ),
            this.snowMaterial
          );
          shoulderSnow.position.copy(shoulder.position);
          shoulderSnow.rotation.y = shoulderRotation;
          shoulderSnow.castShadow = true;
          shoulderSnow.receiveShadow = true;
          shoulderSnow.frustumCulled = false;
          shoulderSnow.layers.set(0);
          shoulderSnow.userData.type = "snow-cap";
          group.add(shoulderSnow);
        }

        this.queueTreesForPeak(treeSpecs, {
          sign: sign,
          x: shoulderX,
          z: shoulderZ,
          baseY: shoulderBaseY,
          height: shoulderHeight,
          radius: shoulderRadius,
          rotationY: shoulderRotation,
          topRadiusFactor: shoulderTop,
          density: Math.max(1, Math.floor((3 + Math.floor(Math.random() * 5)) * treeDensityScale))
        });
      }
    }

    this.addTrees(group, treeSpecs);
    scene.add(group);
    this.mountains.push(group);
  },

  mountainProfile: function(t, topRadiusFactor) {
    const baseProfile = Math.pow(1 - t, 0.76);
    const shoulderProfile = 1 - THREE.MathUtils.smoothstep(t, 0.42, 1.0) * 0.12;
    return topRadiusFactor + (1 - topRadiusFactor) * baseProfile * shoulderProfile;
  },

  createMountainGeometry: function(radius, height, radialSegments, heightSegments, options = {}) {
    const vertices = [];
    const colors = [];
    const indices = [];
    const color = new THREE.Color();
    const ridgeOffsets = [];
    const ridgePhases = [];
    const topRadiusFactor = options.topRadiusFactor || 0.11;
    const pointierTop = Boolean(options.pointierTop);
    const snowLine = options.snowLine || 0.74;

    for (let s = 0; s < radialSegments; s++) {
      ridgeOffsets.push(0.84 + Math.random() * 0.32);
      ridgePhases.push(Math.random() * Math.PI * 2);
    }

    for (let yIndex = 0; yIndex <= heightSegments; yIndex++) {
      const t = yIndex / heightSegments;
      const profile = this.mountainProfile(t, topRadiusFactor);
      const ringRadius = radius * profile;
      const topRound = Math.pow(THREE.MathUtils.smoothstep(t, 0.78, 1.0), 2);
      const pointLift = pointierTop ? Math.pow(t, 5) * height * 0.025 : 0;
      const y = t * height - topRound * height * (pointierTop ? 0.018 : 0.04) + pointLift;

      for (let s = 0; s < radialSegments; s++) {
        const angle = (s / radialSegments) * Math.PI * 2;
        const next = ridgeOffsets[(s + 1) % radialSegments];
        const ridge = THREE.MathUtils.lerp(ridgeOffsets[s], next, 0.5);
        const fold = 1 + Math.sin(angle * 2.5 + t * 5.4 + ridgePhases[s]) * 0.075;
        const erosion = 1 + Math.sin(t * Math.PI * 7.2 + ridgePhases[s]) * 0.032;
        const lowerBulge = 1 + (1 - t) * Math.sin(angle * 1.3 + ridgePhases[s]) * 0.06;
        const snowSoftening = t > snowLine ? 1 - (t - snowLine) * 0.08 : 1;
        const detail = 1 + (Math.random() - 0.5) * 0.052 * (1 - topRound * 0.55);
        const minTopRadius = radius * topRadiusFactor * (pointierTop ? 0.55 : 0.76);
        const r = Math.max(
          minTopRadius,
          ringRadius * ridge * fold * erosion * lowerBulge * detail * snowSoftening
        );

        vertices.push(Math.cos(angle) * r, y, Math.sin(angle) * r);

        // Vertex colors: dark forested low slopes, grey rock, brighter snowy tops.
        if (t > snowLine) {
          const k = (t - snowLine) / Math.max(0.001, 1 - snowLine);
          color.setRGB(
            0.62 + k * 0.30,
            0.66 + k * 0.27,
            0.70 + k * 0.25
          );
        } else if (t > 0.46) {
          const k = (t - 0.46) / Math.max(0.001, snowLine - 0.46);
          color.setRGB(
            0.31 + k * 0.22,
            0.32 + k * 0.22,
            0.31 + k * 0.24
          );
        } else {
          const k = t / 0.46;
          color.setRGB(
            0.14 + k * 0.16,
            0.22 + k * 0.12,
            0.13 + k * 0.11
          );
        }

        const shade = 0.84 + Math.random() * 0.2;
        colors.push(color.r * shade, color.g * shade, color.b * shade);
      }
    }

    for (let yIndex = 0; yIndex < heightSegments; yIndex++) {
      for (let s = 0; s < radialSegments; s++) {
        const a = yIndex * radialSegments + s;
        const b = yIndex * radialSegments + ((s + 1) % radialSegments);
        const c = (yIndex + 1) * radialSegments + s;
        const d = (yIndex + 1) * radialSegments + ((s + 1) % radialSegments);

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    // Top cap. A minority of peaks get a small crag, but it stays broad enough
    // to avoid the needle-like cone look.
    const topCenterIndex = vertices.length / 3;
    const topY = height * (pointierTop ? 1.012 + Math.random() * 0.018 : 0.965);
    vertices.push(0, topY, 0);
    colors.push(0.88, 0.92, 0.95);

    const topStart = heightSegments * radialSegments;
    for (let s = 0; s < radialSegments; s++) {
      const a = topStart + s;
      const b = topStart + ((s + 1) % radialSegments);
      indices.push(a, topCenterIndex, b);
    }

    // Underwater bottom cap, so the range looks like land rising from the ocean.
    const bottomCenterIndex = vertices.length / 3;
    vertices.push(0, -8, 0);
    colors.push(0.08, 0.13, 0.09);

    for (let s = 0; s < radialSegments; s++) {
      const a = s;
      const b = (s + 1) % radialSegments;
      indices.push(bottomCenterIndex, a, b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
  },

  createSnowCapGeometry: function(radius, height, radialSegments, options = {}) {
    const vertices = [];
    const indices = [];
    const topRadiusFactor = options.topRadiusFactor || 0.11;
    const pointierTop = Boolean(options.pointierTop);
    const snowLine = Math.max(0.62, Math.min(0.86, options.snowLine || 0.74));
    const rings = 4;

    for (let rIndex = 0; rIndex <= rings; rIndex++) {
      const t = snowLine + (1 - snowLine) * (rIndex / rings);
      const profile = this.mountainProfile(t, topRadiusFactor);
      const ringRadius = radius * profile * (1.012 + rIndex * 0.004);
      const pointLift = pointierTop ? Math.pow(t, 5) * height * 0.03 : 0;
      const topRound = Math.pow(THREE.MathUtils.smoothstep(t, 0.78, 1.0), 2);
      const y = t * height - topRound * height * (pointierTop ? 0.012 : 0.035) + pointLift + 1.1;

      for (let s = 0; s < radialSegments; s++) {
        const angle = (s / radialSegments) * Math.PI * 2;
        const waviness = 1 + Math.sin(angle * 3.0 + rIndex * 0.9) * 0.035;
        vertices.push(Math.cos(angle) * ringRadius * waviness, y, Math.sin(angle) * ringRadius * waviness);
      }
    }

    for (let rIndex = 0; rIndex < rings; rIndex++) {
      for (let s = 0; s < radialSegments; s++) {
        const a = rIndex * radialSegments + s;
        const b = rIndex * radialSegments + ((s + 1) % radialSegments);
        const c = (rIndex + 1) * radialSegments + s;
        const d = (rIndex + 1) * radialSegments + ((s + 1) % radialSegments);
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const topCenterIndex = vertices.length / 3;
    const topY = height * (pointierTop ? 1.02 : 0.972) + 1.3;
    vertices.push(0, topY, 0);
    const topStart = rings * radialSegments;

    for (let s = 0; s < radialSegments; s++) {
      const a = topStart + s;
      const b = topStart + ((s + 1) % radialSegments);
      indices.push(a, topCenterIndex, b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
  },

  queueTreesForPeak: function(treeSpecs, peak) {
    const waterT = (this.oceanY + 7 - peak.baseY) / peak.height;
    const minT = Math.max(0.26, waterT + 0.035);
    const maxT = Math.min(0.52, minT + 0.20);

    if (minT >= maxT) return;

    const visibleAngle = peak.sign < 0 ? 0 : Math.PI;
    const treeCount = Math.max(0, peak.density || 0);
    const rotationAxis = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < treeCount; i++) {
      if (Math.random() < 0.08) continue;

      const t = minT + Math.random() * (maxT - minT);
      const slopeProfile = this.mountainProfile(t, peak.topRadiusFactor);
      const angle = visibleAngle + (Math.random() - 0.5) * 1.55;
      const surfaceRadius = peak.radius * slopeProfile * (0.72 + Math.random() * 0.18);
      const radial = new THREE.Vector3(
        Math.cos(angle) * surfaceRadius,
        0,
        Math.sin(angle) * surfaceRadius
      );
      radial.applyAxisAngle(rotationAxis, peak.rotationY || 0);

      const treeHeight = 8 + Math.random() * 8;
      const y = Math.max(this.oceanY + 3, peak.baseY + t * peak.height);

      treeSpecs.push({
        x: peak.x + radial.x,
        y: y,
        z: peak.z + radial.z,
        height: treeHeight,
        width: 0.82 + Math.random() * 0.42,
        rotation: Math.random() * Math.PI * 2
      });
    }
  },

  addTrees: function(group, treeSpecs) {
    if (!treeSpecs.length) return;

    const trunks = new THREE.InstancedMesh(this.trunkGeometry, this.trunkMaterial, treeSpecs.length);
    const foliage = new THREE.InstancedMesh(this.foliageGeometry, this.foliageMaterial, treeSpecs.length);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const rotation = new THREE.Euler();

    trunks.castShadow = true;
    trunks.receiveShadow = true;
    trunks.frustumCulled = false;
    trunks.layers.set(0);
    trunks.userData.type = "mountain-tree-trunks";
    trunks.userData.sharedGeometry = true;

    foliage.castShadow = true;
    foliage.receiveShadow = true;
    foliage.frustumCulled = false;
    foliage.layers.set(0);
    foliage.userData.type = "mountain-tree-foliage";
    foliage.userData.sharedGeometry = true;

    for (let i = 0; i < treeSpecs.length; i++) {
      const tree = treeSpecs[i];
      const trunkHeight = tree.height * 0.44;
      const leafHeight = tree.height * 0.72;
      const trunkWidth = tree.width * 0.45;
      const leafWidth = tree.width * 3.25;

      rotation.set(0, tree.rotation, 0);
      quaternion.setFromEuler(rotation);

      position.set(tree.x, tree.y + trunkHeight * 0.5, tree.z);
      scale.set(trunkWidth, trunkHeight, trunkWidth);
      matrix.compose(position, quaternion, scale);
      trunks.setMatrixAt(i, matrix);

      position.set(tree.x, tree.y + trunkHeight + leafHeight * 0.43, tree.z);
      scale.set(leafWidth, leafHeight, leafWidth);
      matrix.compose(position, quaternion, scale);
      foliage.setMatrixAt(i, matrix);
    }

    trunks.instanceMatrix.needsUpdate = true;
    foliage.instanceMatrix.needsUpdate = true;
    group.add(trunks);
    group.add(foliage);
  },

  getTreeInstanceCount: function() {
    let total = 0;

    for (let group of this.mountains) {
      group.traverse((child) => {
        if (child.isInstancedMesh && child.userData &&
            (child.userData.type === "mountain-tree-trunks" || child.userData.type === "mountain-tree-foliage")) {
          total += child.count || 0;
        }
      });
    }

    return total;
  },

  disposeRangeGroup: function(group) {
    group.traverse((child) => {
      if (child.isMesh && child.geometry && !child.userData.sharedGeometry) {
        child.geometry.dispose();
      }
    });
  },

  clear: function(scene) {
    this.mountains.forEach((group) => {
      scene.remove(group);
      this.disposeRangeGroup(group);
    });

    this.mountains = [];

    if (this.rockMaterial) {
      this.rockMaterial.dispose();
      this.rockMaterial = null;
    }

    if (this.snowMaterial) {
      this.snowMaterial.dispose();
      this.snowMaterial = null;
    }

    if (this.trunkMaterial) {
      this.trunkMaterial.dispose();
      this.trunkMaterial = null;
    }

    if (this.foliageMaterial) {
      this.foliageMaterial.dispose();
      this.foliageMaterial = null;
    }

    if (this.trunkGeometry) {
      this.trunkGeometry.dispose();
      this.trunkGeometry = null;
    }

    if (this.foliageGeometry) {
      this.foliageGeometry.dispose();
      this.foliageGeometry = null;
    }
  }
};


if (typeof QualityManager !== "undefined" && QualityManager.onChange) {
  QualityManager.onChange(() => MountainManager.applyQuality());
}
