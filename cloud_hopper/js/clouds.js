// clouds.js
// Endless fluffy cloud platforms, route progression, special platform types,
// and collision bounds. Cloud puffs are instanced per platform to reduce draw calls.

const CloudManager = {
  platforms: [],
  pool: [],
  nearbyCache: [],
  lastSpawnZ: 0,
  nextSpawnY: 0,
  lastSpawnX: 0,
  startPlatform: null,
  routeState: null,
  spawnAhead: 205,
  deleteBehind: 115,
  poolLimit: 40,
  startWidth: 31,
  startDepth: 31,
  surfaceOffset: 0.96,
  platformIdCounter: 1,
  qualityName: "high",

  TYPE_NORMAL: "normal",
  TYPE_GOLDEN: "golden",
  TYPE_BOOST: "boost",
  TYPE_CRUMBLE: "crumble",
  TYPE_WIND: "wind",

  resources: {
    mainPuffGeometry: null,
    softPuffGeometry: null,
    rayTargetGeometry: null,
    markerRingGeometry: null,
    markerConeGeometry: null,
    topMaterial: null,
    brightMaterial: null,
    undersideMaterial: null,
    wispMaterial: null,
    rayTargetMaterial: null,
    markerMaterials: null,

    applyLighting: function(dayAmount, nightAmount, horizonAmount) {
      if (!this.topMaterial) return;

      const dayTop = new THREE.Color(0xf8fbff);
      const nightTop = new THREE.Color(0x9bbaf0);
      const horizonTop = new THREE.Color(0xffd0a8);

      const dayBright = new THREE.Color(0xffffff);
      const nightBright = new THREE.Color(0xc1d7ff);
      const horizonBright = new THREE.Color(0xffe0c2);

      const dayUnder = new THREE.Color(0xc8d4e2);
      const nightUnder = new THREE.Color(0x526d98);
      const horizonUnder = new THREE.Color(0xa9827a);

      const dayWisp = new THREE.Color(0xf4f8ff);
      const nightWisp = new THREE.Color(0xaec8fb);
      const horizonWisp = new THREE.Color(0xffdec8);

      this.topMaterial.color.copy(nightTop).lerp(dayTop, dayAmount);
      this.topMaterial.color.lerp(horizonTop, horizonAmount * 0.35);
      this.topMaterial.emissive.set(0x45648f);
      this.topMaterial.emissiveIntensity = nightAmount * 0.18 + horizonAmount * 0.04;

      this.brightMaterial.color.copy(nightBright).lerp(dayBright, dayAmount);
      this.brightMaterial.color.lerp(horizonBright, horizonAmount * 0.45);
      this.brightMaterial.emissive.set(0x6888c8);
      this.brightMaterial.emissiveIntensity = nightAmount * 0.23 + horizonAmount * 0.05;

      this.undersideMaterial.color.copy(nightUnder).lerp(dayUnder, dayAmount);
      this.undersideMaterial.color.lerp(horizonUnder, horizonAmount * 0.22);
      this.undersideMaterial.emissive.set(0x1d304f);
      this.undersideMaterial.emissiveIntensity = nightAmount * 0.15;
      this.undersideMaterial.opacity = 0.72 + dayAmount * 0.14 + nightAmount * 0.05;

      this.wispMaterial.color.copy(nightWisp).lerp(dayWisp, dayAmount);
      this.wispMaterial.color.lerp(horizonWisp, horizonAmount * 0.42);
      this.wispMaterial.emissive.set(0x5f7fb8);
      this.wispMaterial.emissiveIntensity = nightAmount * 0.2 + horizonAmount * 0.04;
      this.wispMaterial.opacity = 0.46 + dayAmount * 0.12 + nightAmount * 0.07;

      if (this.markerMaterials) {
        const markerOpacity = 0.44 + nightAmount * 0.22;
        Object.keys(this.markerMaterials).forEach((key) => {
          const mat = this.markerMaterials[key];
          mat.opacity = markerOpacity;
        });
      }
    },

    init: function() {
      if (this.mainPuffGeometry) return;

      this.mainPuffGeometry = new THREE.SphereGeometry(1, 14, 10);
      this.softPuffGeometry = new THREE.SphereGeometry(1, 10, 8);
      this.rayTargetGeometry = new THREE.BoxGeometry(1, 1, 1);
      this.markerRingGeometry = new THREE.TorusGeometry(1, 0.055, 8, 36);
      this.markerConeGeometry = new THREE.ConeGeometry(0.65, 1.2, 10, 1);

      this.topMaterial = new THREE.MeshStandardMaterial({
        color: 0xf8fbff,
        roughness: 1.0,
        metalness: 0.0,
        flatShading: false
      });

      this.brightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 1.0,
        metalness: 0.0,
        flatShading: false
      });

      this.undersideMaterial = new THREE.MeshStandardMaterial({
        color: 0xc8d4e2,
        roughness: 1.0,
        metalness: 0.0,
        transparent: true,
        opacity: 0.86,
        depthWrite: true,
        flatShading: false
      });

      this.wispMaterial = new THREE.MeshStandardMaterial({
        color: 0xf4f8ff,
        roughness: 1.0,
        metalness: 0.0,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
        flatShading: false
      });

      this.rayTargetMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.0,
        depthWrite: false
      });

      this.markerMaterials = {
        golden: new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.55, depthWrite: false }),
        boost: new THREE.MeshBasicMaterial({ color: 0x64a8ff, transparent: true, opacity: 0.58, depthWrite: false }),
        crumble: new THREE.MeshBasicMaterial({ color: 0x7b8190, transparent: true, opacity: 0.48, depthWrite: false }),
        wind: new THREE.MeshBasicMaterial({ color: 0x72f2ff, transparent: true, opacity: 0.52, depthWrite: false })
      };
    }
  },

  getQuality: function() {
    return typeof QualityManager !== "undefined" && QualityManager.getPreset
      ? QualityManager.getPreset()
      : { cloudDensity: 1, cloudSpawnAhead: 205, cloudDeleteBehind: 115, cloudPoolLimit: 40 };
  },

  applyQuality: function() {
    const quality = this.getQuality();
    this.spawnAhead = quality.cloudSpawnAhead || 205;
    this.deleteBehind = quality.cloudDeleteBehind || 115;
    this.poolLimit = quality.cloudPoolLimit || 40;
    this.qualityName = typeof QualityManager !== "undefined" ? QualityManager.getPresetName() : "high";
  },

  clearGroup: function(group) {
    if (!group) return;

    while (group.children && group.children.length) {
      group.remove(group.children[0]);
    }
  },

  getPlatformGroup: function() {
    const group = this.pool.pop() || new THREE.Group();
    this.clearGroup(group);
    group.name = "fluffy-cloud-platform";
    group.userData = { rayTraceIgnore: false };
    group.visible = true;
    group.scale.set(1, 1, 1);
    group.rotation.set(0, 0, 0);
    group.layers.set(0);
    return group;
  },

  randomPointInEllipse: function(width, depth, edgeBias) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.pow(Math.random(), edgeBias);

    return {
      x: Math.cos(angle) * width * 0.5 * radius,
      z: Math.sin(angle) * depth * 0.5 * radius,
      radius: radius,
      angle: angle
    };
  },

  randomPointOnEllipseEdge: function(width, depth) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.78 + Math.random() * 0.26;

    return {
      x: Math.cos(angle) * width * 0.5 * radius,
      z: Math.sin(angle) * depth * 0.5 * radius,
      radius: radius,
      angle: angle
    };
  },

  pushPuffSpec: function(list, x, y, z, scaleX, scaleY, scaleZ) {
    list.push({
      x: x,
      y: y,
      z: z,
      sx: scaleX,
      sy: scaleY,
      sz: scaleZ,
      rx: (Math.random() - 0.5) * 0.18,
      ry: Math.random() * Math.PI * 2,
      rz: (Math.random() - 0.5) * 0.18
    });
  },

  createInstancedPuffs: function(geometry, material, specs, name) {
    if (!specs.length) return null;

    const mesh = new THREE.InstancedMesh(geometry, material, specs.length);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const rotation = new THREE.Euler();

    for (let i = 0; i < specs.length; i++) {
      const p = specs[i];
      position.set(p.x, p.y, p.z);
      rotation.set(p.rx, p.ry, p.rz);
      quaternion.setFromEuler(rotation);
      scale.set(p.sx, p.sy, p.sz);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.name = name;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.layers.set(0);
    mesh.userData.sharedGeometry = true;
    return mesh;
  },

  addBillowLayer: function(cloudGroup, width, depth, varianceType, platformType) {
    const quality = this.getQuality();
    const density = Math.max(0.35, quality.cloudDensity || 1.0);
    const densityBoost = varianceType === 1 ? 1.12 : varianceType === 2 ? 0.9 : 1.0;
    const specialBoost = platformType === this.TYPE_GOLDEN || platformType === this.TYPE_BOOST ? 1.08 : 1.0;

    const mainCount = Math.max(10, Math.floor((32 + Math.random() * 12) * densityBoost * density * specialBoost));
    const crownCount = Math.max(4, Math.floor((9 + Math.random() * 7) * densityBoost * density * specialBoost));
    const edgeCount = Math.max(6, Math.floor((16 + Math.random() * 10) * densityBoost * density));
    const undersideCount = Math.max(5, Math.floor((12 + Math.random() * 7) * density));

    const mainSpecs = [];
    const brightSpecs = [];
    const undersideSpecs = [];
    const wispSpecs = [];

    for (let i = 0; i < mainCount; i++) {
      const p = this.randomPointInEllipse(width * 0.9, depth * 0.9, 0.58);
      const centerWeight = 1.0 - p.radius * 0.28;
      const size = (1.85 + Math.random() * 2.1) * centerWeight;

      this.pushPuffSpec(
        mainSpecs,
        p.x,
        0.08 + Math.random() * 0.72,
        p.z,
        size * (1.05 + Math.random() * 0.58),
        0.50 + Math.random() * 0.50,
        size * (0.95 + Math.random() * 0.56)
      );
    }

    for (let i = 0; i < crownCount; i++) {
      const p = this.randomPointInEllipse(width * 0.68, depth * 0.68, 0.42);
      const size = 1.9 + Math.random() * 2.6;

      this.pushPuffSpec(
        brightSpecs,
        p.x,
        0.65 + Math.random() * 0.88,
        p.z,
        size * (0.9 + Math.random() * 0.5),
        0.64 + Math.random() * 0.62,
        size * (0.85 + Math.random() * 0.5)
      );
    }

    for (let i = 0; i < edgeCount; i++) {
      const p = this.randomPointOnEllipseEdge(width * 1.02, depth * 1.02);
      const size = 1.05 + Math.random() * 1.9;

      this.pushPuffSpec(
        i % 3 === 0 ? wispSpecs : mainSpecs,
        p.x,
        -0.05 + Math.random() * 0.72,
        p.z,
        size * (1.0 + Math.random() * 0.65),
        0.30 + Math.random() * 0.38,
        size * (0.9 + Math.random() * 0.65)
      );
    }

    for (let i = 0; i < undersideCount; i++) {
      const p = this.randomPointInEllipse(width * 0.86, depth * 0.86, 0.68);
      const size = 1.45 + Math.random() * 2.5;

      this.pushPuffSpec(
        undersideSpecs,
        p.x,
        -0.55 + Math.random() * 0.26,
        p.z,
        size * (1.12 + Math.random() * 0.62),
        0.20 + Math.random() * 0.24,
        size * (0.96 + Math.random() * 0.6)
      );
    }

    const main = this.createInstancedPuffs(this.resources.mainPuffGeometry, this.resources.topMaterial, mainSpecs, "cloud-main-puffs");
    const bright = this.createInstancedPuffs(this.resources.mainPuffGeometry, this.resources.brightMaterial, brightSpecs, "cloud-bright-puffs");
    const underside = this.createInstancedPuffs(this.resources.softPuffGeometry, this.resources.undersideMaterial, undersideSpecs, "cloud-underside-puffs");
    const wisps = this.createInstancedPuffs(this.resources.softPuffGeometry, this.resources.wispMaterial, wispSpecs, "cloud-wisp-puffs");

    if (main) cloudGroup.add(main);
    if (bright) cloudGroup.add(bright);
    if (underside) cloudGroup.add(underside);
    if (wisps) cloudGroup.add(wisps);
  },

  addSpecialMarker: function(cloudGroup, width, depth, type) {
    if (type === this.TYPE_NORMAL) return null;

    const material = this.resources.markerMaterials[type] || this.resources.markerMaterials.golden;
    const marker = new THREE.Group();
    marker.name = `cloud-marker-${type}`;
    marker.userData.rayTraceIgnore = true;
    marker.layers.set(0);

    const radius = Math.max(width, depth) * 0.23;
    const ring = new THREE.Mesh(this.resources.markerRingGeometry, material);
    ring.position.y = 1.34;
    ring.rotation.x = Math.PI / 2;
    ring.scale.set(radius, radius, radius);
    ring.renderOrder = 5;
    marker.add(ring);

    if (type === this.TYPE_BOOST) {
      const cone = new THREE.Mesh(this.resources.markerConeGeometry, material);
      cone.position.y = 2.0;
      cone.scale.set(0.9, 0.9, 0.9);
      marker.add(cone);
    } else if (type === this.TYPE_WIND) {
      for (let i = 0; i < 2; i++) {
        const smallRing = new THREE.Mesh(this.resources.markerRingGeometry, material);
        smallRing.position.set((i - 0.5) * radius * 1.35, 1.55 + i * 0.12, 0);
        smallRing.rotation.x = Math.PI / 2;
        smallRing.scale.set(radius * 0.55, radius * 0.55, radius * 0.55);
        marker.add(smallRing);
      }
    } else if (type === this.TYPE_CRUMBLE) {
      ring.scale.y *= 0.72;
      ring.rotation.z = Math.PI / 4;
    }

    cloudGroup.add(marker);
    return marker;
  },

  addPlatform: function(x, y, z, width, depth, varianceType = 0, platformType = this.TYPE_NORMAL) {
    this.resources.init();
    this.applyQuality();

    const cloudGroup = this.getPlatformGroup();
    this.addBillowLayer(cloudGroup, width, depth, varianceType, platformType);

    const rayTarget = new THREE.Mesh(
      this.resources.rayTargetGeometry,
      this.resources.rayTargetMaterial
    );
    rayTarget.name = "cloud-platform-ray-target";
    rayTarget.position.set(0, 0.24, 0);
    rayTarget.scale.set(width, 1.3, depth);
    rayTarget.userData.rayTraceTarget = true;
    rayTarget.userData.type = "cloud-platform";
    rayTarget.userData.platformGroup = cloudGroup;
    rayTarget.renderOrder = -1;
    rayTarget.layers.set(0);
    cloudGroup.add(rayTarget);

    const marker = this.addSpecialMarker(cloudGroup, width, depth, platformType);

    cloudGroup.position.set(x, y, z);
    scene.add(cloudGroup);

    const platform = {
      id: this.platformIdCounter++,
      mesh: cloudGroup,
      marker: marker,
      centerZ: z,
      centerX: x,
      baseY: y,
      minX: x - width / 2 - 0.95,
      maxX: x + width / 2 + 0.95,
      minZ: z - depth / 2 - 0.95,
      maxZ: z + depth / 2 + 0.95,
      topY: y + this.surfaceOffset,
      width: width,
      depth: depth,
      type: platformType,
      visited: false,
      crumbleTimer: 0,
      crumbleDuration: platformType === this.TYPE_CRUMBLE ? 1.25 : 0,
      windX: platformType === this.TYPE_WIND ? (Math.random() < 0.5 ? -0.018 : 0.018) : 0,
      routePattern: this.routeState ? this.routeState.pattern : "start"
    };

    rayTarget.userData.platform = platform;
    this.platforms.push(platform);

    if (z === 0 && Math.abs(x) < 0.001) {
      this.startPlatform = platform;
    }

    this.markRayTargetsDirty();
    return platform;
  },

  buildInitialTrack: function() {
    this.applyQuality();
    this.lastSpawnZ = 0;
    this.nextSpawnY = 0;
    this.lastSpawnX = 0;
    this.routeState = null;
    this.startPlatform = this.addPlatform(0, 0, 0, this.startWidth, this.startDepth, 1, this.TYPE_NORMAL);
  },

  getSafeSpawnPosition: function() {
    if (!this.startPlatform) {
      this.buildInitialTrack();
    }

    const height = typeof playerHeight !== "undefined" ? playerHeight : 1.8;

    return {
      x: 0,
      y: this.startPlatform.topY + height + 0.08,
      z: 0
    };
  },

  placePlayerOnStartPlatform: function() {
    if (typeof yawObject === "undefined" || !yawObject) return;

    const spawn = this.getSafeSpawnPosition();
    yawObject.position.set(spawn.x, spawn.y, spawn.z);
  },

  selectPlatformType: function(distance, typeHint) {
    if (typeHint && typeHint !== this.TYPE_NORMAL) return typeHint;
    if (distance < 260) return this.TYPE_NORMAL;

    const level = typeof DifficultyManager !== "undefined" ? DifficultyManager.getLevel(distance) : { t: 0, tier: 0 };
    const r = Math.random();
    const specialChance = Math.min(0.34, 0.08 + level.t * 0.24);

    if (r > specialChance) return this.TYPE_NORMAL;

    const pick = Math.random();
    if (pick < 0.26) return this.TYPE_GOLDEN;
    if (pick < 0.52) return this.TYPE_BOOST;
    if (pick < 0.76) return this.TYPE_WIND;
    return this.TYPE_CRUMBLE;
  },

  spawnNextPlatform: function() {
    const distance = Math.abs(this.lastSpawnZ);
    const step =
      typeof DifficultyManager !== "undefined" && DifficultyManager.nextStep
        ? DifficultyManager.nextStep(distance, this.routeState)
        : null;

    if (step) {
      this.routeState = step.state;
      this.lastSpawnZ -= step.gap;
      this.lastSpawnX += step.xDelta;
      this.nextSpawnY += step.yDelta;
    } else {
      this.lastSpawnZ -= 38 + Math.random() * 16;
      this.lastSpawnX += (Math.random() - 0.5) * 19;
      this.nextSpawnY += (Math.random() - 0.32) * 3.2;
    }

    this.lastSpawnX = Math.max(-50, Math.min(50, this.lastSpawnX));
    this.nextSpawnY = Math.max(-2.2, Math.min(17.5, this.nextSpawnY));

    const width = step ? step.width : 16 + Math.random() * 8;
    const depth = step ? step.depth : 15 + Math.random() * 8;
    const randomStyle = Math.floor(Math.random() * 3);
    const platformType = this.selectPlatformType(Math.abs(this.lastSpawnZ), step ? step.typeHint : this.TYPE_NORMAL);

    this.addPlatform(this.lastSpawnX, this.nextSpawnY, this.lastSpawnZ, width, depth, randomStyle, platformType);
  },

  manage: function(playerZ) {
    this.applyQuality();

    while (this.lastSpawnZ > playerZ - this.spawnAhead) {
      this.spawnNextPlatform();
    }

    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const platform = this.platforms[i];

      if (platform.centerZ > playerZ + this.deleteBehind) {
        this.removePlatform(platform, i);
      }
    }
  },

  update: function(delta, playerZ) {
    this.manage(playerZ);

    const dt = Number.isFinite(delta) ? delta : 0;

    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const platform = this.platforms[i];

      if (platform.crumbleTimer > 0) {
        platform.crumbleTimer -= dt;

        if (platform.mesh) {
          const shake = Math.sin(platform.crumbleTimer * 55) * 0.035;
          platform.mesh.position.y = platform.baseY + shake - (1 - platform.crumbleTimer / platform.crumbleDuration) * 0.18;
        }

        if (platform.crumbleTimer <= 0) {
          this.removePlatform(platform, i);
        }
      }
    }
  },

  removePlatform: function(platform, index) {
    if (!platform || !platform.mesh) return;

    if (platform.mesh.parent) {
      platform.mesh.parent.remove(platform.mesh);
    } else if (typeof scene !== "undefined") {
      scene.remove(platform.mesh);
    }

    this.clearGroup(platform.mesh);
    platform.mesh.userData = {};

    if (this.pool.length < this.poolLimit) {
      this.pool.push(platform.mesh);
    }

    platform.mesh = null;

    const removeIndex = Number.isInteger(index) ? index : this.platforms.indexOf(platform);
    if (removeIndex >= 0) {
      this.platforms.splice(removeIndex, 1);
    }

    if (platform === this.startPlatform) {
      this.startPlatform = null;
    }

    this.markRayTargetsDirty();
  },

  clearAll: function() {
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      this.removePlatform(this.platforms[i], i);
    }

    this.platforms.length = 0;
    this.nearbyCache.length = 0;
    this.startPlatform = null;
    this.routeState = null;
    this.markRayTargetsDirty();
  },

  getNearbyPlatforms: function(playerZ, behind = 45, ahead = 90) {
    this.nearbyCache.length = 0;

    const minZ = playerZ - ahead;
    const maxZ = playerZ + behind;

    for (let i = 0; i < this.platforms.length; i++) {
      const platform = this.platforms[i];
      if (platform.maxZ >= minZ && platform.minZ <= maxZ) {
        this.nearbyCache.push(platform);
      }
    }

    return this.nearbyCache;
  },

  triggerCrumble: function(platform) {
    if (!platform || platform.type !== this.TYPE_CRUMBLE || platform.crumbleTimer > 0) return;

    platform.crumbleTimer = platform.crumbleDuration || 1.25;

    if (platform.marker) {
      platform.marker.visible = false;
    }
  },

  markVisited: function(platform) {
    if (!platform || platform.visited) return false;

    platform.visited = true;

    if (platform.marker && platform.type !== this.TYPE_CRUMBLE) {
      platform.marker.visible = false;
    }

    return true;
  },

  markRayTargetsDirty: function() {
    if (typeof RayTracingManager !== "undefined" && RayTracingManager.markDirty) {
      RayTracingManager.markDirty();
    }
  }
};

if (typeof QualityManager !== "undefined" && QualityManager.onChange) {
  QualityManager.onChange(() => CloudManager.applyQuality());
}

// Compatibility globals used by physics.js, main.js, and environment.js.
var platforms = CloudManager.platforms;
var cloudResources = CloudManager.resources;

function addCloudPlatform(x, y, z, width, depth, varianceType, platformType) {
  return CloudManager.addPlatform(x, y, z, width, depth, varianceType, platformType);
}

function buildInitialTrack() {
  CloudManager.buildInitialTrack();
}

function manageEndlessClouds(playerZ, delta) {
  CloudManager.update(delta || 0, playerZ);
}

function clearAllClouds() {
  CloudManager.clearAll();
}

function getSafeSpawnPosition() {
  return CloudManager.getSafeSpawnPosition();
}

function placePlayerOnStartPlatform() {
  CloudManager.placePlayerOnStartPlatform();
}

CloudManager.applyQuality();
buildInitialTrack();
placePlayerOnStartPlatform();
