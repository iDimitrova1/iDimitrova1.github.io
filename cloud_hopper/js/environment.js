// environment.js
const EnvironmentManager = {
  CYCLE_SECONDS: 12 * 60,
  timeOfDay: 0,
  initialized: false,
  scene: null,
  renderer: null,
  camera: null,
  ambientLight: null,
  hemiLight: null,
  sunLight: null,
  moonLight: null,
  ocean: null,
  starField: null,
  starCount: 0,
  sunDisc: null,
  moonDisc: null,
  playerX: 0,
  playerZ: 0,
  skyColors: {
    night: new THREE.Color(0x07111f),
    dawn: new THREE.Color(0xf59b6a),
    day: new THREE.Color(0xaaccff),
    dusk: new THREE.Color(0xc77986)
  },
  fogColors: {
    night: new THREE.Color(0x0a1424),
    dawn: new THREE.Color(0xf0a36e),
    day: new THREE.Color(0xaaccff),
    dusk: new THREE.Color(0xb7798c)
  },

  getQuality: function() {
    return typeof QualityManager !== "undefined" && QualityManager.getPreset
      ? QualityManager.getPreset()
      : { starCount: 1350 };
  },

  applyQuality: function(rebuild = true) {
    const quality = this.getQuality();
    const nextStarCount = Math.max(120, Math.floor(quality.starCount || 1350));

    if (this.initialized && rebuild && this.scene && this.starCount !== nextStarCount) {
      this.removeStarField();
      this.starCount = nextStarCount;
      this.createStarField();
    } else {
      this.starCount = nextStarCount;
    }
  },

  init: function(scene, renderer, camera, refs = {}) {
    if (this.initialized) return;

    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.ambientLight = refs.ambientLight || null;
    this.hemiLight = refs.hemiLight || null;
    this.sunLight = refs.sunLight || null;
    this.moonLight = refs.moonLight || null;
    this.ocean = refs.ocean || null;

    this.applyQuality(false);
    this.createSkyObjects();
    this.randomizeTime();
    this.initialized = true;
  },

  randomizeTime: function() {
    this.timeOfDay = Math.random();
    this.applyLighting(0);

    if (typeof HudManager !== "undefined" && HudManager.updateTime) {
      const timeInfo = this.getTimeInfo();
      HudManager.updateTime(timeInfo.time, timeInfo.label);
    }
  },

  getTimeInfo: function() {
    // timeOfDay = 0 is sunrise. Offset by 6 hours so the HUD reads 06:00.
    const hourFloat = (this.timeOfDay * 24 + 6) % 24;
    const hour = Math.floor(hourFloat);
    const minute = Math.floor((hourFloat - hour) * 60);

    let label = "Night";

    if (hour >= 5 && hour < 7) {
      label = "Dawn";
    } else if (hour >= 7 && hour < 17) {
      label = "Day";
    } else if (hour >= 17 && hour < 20) {
      label = "Dusk";
    }

    return {
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      label: label,
      hour: hour,
      minute: minute
    };
  },

  update: function(delta, playerPosition) {
    if (!this.initialized) return;

    if (playerPosition) {
      this.playerX = playerPosition.x || 0;
      this.playerZ = playerPosition.z || 0;

      if (this.starField) {
        this.starField.position.set(this.playerX, 0, this.playerZ);
      }
    }

    this.timeOfDay = (this.timeOfDay + delta / this.CYCLE_SECONDS) % 1;
    this.applyLighting(delta);
  },

  removeStarField: function() {
    if (!this.starField) return;

    if (this.scene) {
      this.scene.remove(this.starField);
    }

    if (this.starField.geometry) {
      this.starField.geometry.dispose();
    }

    if (this.starField.material) {
      this.starField.material.dispose();
    }

    this.starField = null;
  },

  createStarField: function() {
    if (!this.scene) return;

    const starGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    const starCount = this.starCount || 1350;

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(1));
      const radius = 2050 + Math.random() * 950;
      const y = Math.abs(Math.cos(phi)) * radius + 260;

      starPositions.push(
        Math.cos(theta) * Math.sin(phi) * radius,
        y,
        Math.sin(theta) * Math.sin(phi) * radius
      );
    }

    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 3.2,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.starField = new THREE.Points(starGeometry, starMaterial);
    this.starField.name = "night-star-field";
    this.starField.userData.rayTraceIgnore = true;
    this.starField.position.set(this.playerX, 0, this.playerZ);
    this.scene.add(this.starField);
  },

  createSkyObjects: function() {
    this.createStarField();

    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xfff1a8,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });

    this.sunDisc = new THREE.Mesh(new THREE.SphereGeometry(36, 24, 16), sunMaterial);
    this.sunDisc.name = "sun-disc";
    this.sunDisc.userData.rayTraceIgnore = true;
    this.scene.add(this.sunDisc);

    const moonMaterial = new THREE.MeshBasicMaterial({
      color: 0xdde9ff,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });

    this.moonDisc = new THREE.Mesh(new THREE.SphereGeometry(25, 20, 12), moonMaterial);
    this.moonDisc.name = "moon-disc";
    this.moonDisc.userData.rayTraceIgnore = true;
    this.scene.add(this.moonDisc);
  },

  applyLighting: function() {
    const angle = this.timeOfDay * Math.PI * 2;
    const sunY = Math.sin(angle);
    const sunX = Math.cos(angle) * 0.82;
    const sunZ = -0.42;
    const sunDirection = new THREE.Vector3(sunX, sunY, sunZ).normalize();
    const moonDirection = sunDirection.clone().multiplyScalar(-1);

    const dayAmount = THREE.MathUtils.smoothstep(sunY, -0.08, 0.45);
    const nightAmount = 1 - THREE.MathUtils.smoothstep(sunY, -0.35, 0.12);
    const horizonAmount = Math.pow(Math.max(0, 1 - Math.abs(sunY) * 2.5), 2);
    const dawnAmount = horizonAmount * (sunX > 0 ? 1 : 0.35);
    const duskAmount = horizonAmount * (sunX <= 0 ? 1 : 0.35);

    const sky = new THREE.Color().lerpColors(
      this.skyColors.night,
      this.skyColors.day,
      dayAmount
    );
    sky.lerp(this.skyColors.dawn, dawnAmount * 0.55);
    sky.lerp(this.skyColors.dusk, duskAmount * 0.4);

    const fog = new THREE.Color().lerpColors(
      this.fogColors.night,
      this.fogColors.day,
      dayAmount
    );
    fog.lerp(this.fogColors.dawn, dawnAmount * 0.5);
    fog.lerp(this.fogColors.dusk, duskAmount * 0.35);

    this.scene.background = sky;

    if (this.scene.fog) {
      this.scene.fog.color.copy(fog);
      this.scene.fog.density = THREE.MathUtils.lerp(0.0010, 0.00055, dayAmount);
    }

    if (this.sunLight) {
      this.sunLight.position.copy(sunDirection).multiplyScalar(360);
      this.sunLight.position.x += this.playerX;
      this.sunLight.position.z += this.playerZ;

      if (this.sunLight.target) {
        this.sunLight.target.position.set(this.playerX, 0, this.playerZ);
        this.sunLight.target.updateMatrixWorld();
      }

      this.sunLight.intensity = Math.max(0, dayAmount * 1.35 + horizonAmount * 0.25);
      this.sunLight.color.set(0xffffff).lerp(new THREE.Color(0xffb26a), horizonAmount * 0.55);
    }

    if (this.moonLight) {
      this.moonLight.position.copy(moonDirection).multiplyScalar(300);
      this.moonLight.position.x += this.playerX;
      this.moonLight.position.z += this.playerZ;

      if (this.moonLight.target) {
        this.moonLight.target.position.set(this.playerX, 0, this.playerZ);
        this.moonLight.target.updateMatrixWorld();
      }

      this.moonLight.intensity = nightAmount * 0.48;
      this.moonLight.color.set(0xacc6ff);
    }

    if (this.ambientLight) {
      this.ambientLight.intensity = 0.12 + dayAmount * 0.32 + horizonAmount * 0.07;
      this.ambientLight.color.set(0xffffff).lerp(new THREE.Color(0x889ec8), nightAmount * 0.75);
    }

    if (this.hemiLight) {
      this.hemiLight.intensity = 0.22 + dayAmount * 0.66 + horizonAmount * 0.1;
      this.hemiLight.color.copy(sky).lerp(new THREE.Color(0xffffff), dayAmount * 0.4);
      this.hemiLight.groundColor.set(0x273648).lerp(new THREE.Color(0x6a7d60), dayAmount * 0.45);
    }

    if (this.ocean && this.ocean.material) {
      const oceanDay = new THREE.Color(0x1d4ed8);
      const oceanNight = new THREE.Color(0x071c3f);
      const oceanDawn = new THREE.Color(0x295e9d);
      const oceanColor = new THREE.Color().lerpColors(oceanNight, oceanDay, dayAmount);
      oceanColor.lerp(oceanDawn, horizonAmount * 0.35);
      this.ocean.material.color.copy(oceanColor);
      this.ocean.material.roughness = THREE.MathUtils.lerp(0.46, 0.28, dayAmount);
      this.ocean.material.metalness = THREE.MathUtils.lerp(0.04, 0.12, dayAmount);
    }

    if (this.renderer) {
      this.renderer.toneMappingExposure = 0.66 + dayAmount * 0.48 + horizonAmount * 0.15;
    }

    if (typeof cloudResources !== "undefined" && cloudResources.applyLighting) {
      cloudResources.applyLighting(dayAmount, nightAmount, horizonAmount);
    }

    if (this.starField) {
      const twinkle = 0.9 + Math.sin(angle * 37.0) * 0.05 + Math.cos(angle * 19.0) * 0.04;

      this.starField.position.set(this.playerX, 0, this.playerZ);
      this.starField.rotation.y = -angle * 0.22;
      this.starField.rotation.x = Math.sin(angle * 0.7) * 0.06;
      this.starField.rotation.z = angle * 0.04;
      this.starField.material.opacity = Math.max(
        0,
        (nightAmount * 0.98 - horizonAmount * 0.32) * twinkle
      );
      this.starField.material.size = THREE.MathUtils.lerp(2.4, 3.4, nightAmount);
    }

    if (this.sunDisc) {
      this.sunDisc.position.copy(sunDirection).multiplyScalar(1800);
      this.sunDisc.position.x += this.playerX;
      this.sunDisc.position.z += this.playerZ;
      this.sunDisc.material.opacity = Math.max(0, dayAmount * 0.9 + horizonAmount * 0.55);
      this.sunDisc.visible = this.sunDisc.material.opacity > 0.02;
    }

    if (this.moonDisc) {
      this.moonDisc.position.copy(moonDirection).multiplyScalar(1750);
      this.moonDisc.position.x += this.playerX;
      this.moonDisc.position.z += this.playerZ;
      this.moonDisc.material.opacity = Math.max(0, nightAmount * 0.72 - horizonAmount * 0.15);
      this.moonDisc.visible = this.moonDisc.material.opacity > 0.02;
    }
  }
};

if (typeof QualityManager !== "undefined" && QualityManager.onChange) {
  QualityManager.onChange(() => EnvironmentManager.applyQuality(true));
}
