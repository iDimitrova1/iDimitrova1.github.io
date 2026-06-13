// settings.js
// Shared quality settings. Loaded before world.js so renderer setup can use it.
var QualityManager = {
  STORAGE_KEY: "cloud_hopper_quality",
  DEFAULT_QUALITY: "high",
  currentName: "high",
  initialized: false,
  selectEl: null,
  labelEl: null,
  listeners: [],

  presets: {
    low: {
      label: "Low",
      pixelRatio: 1.0,
      antialias: false,
      shadows: false,
      shadowMapSize: 512,
      cameraFar: 3200,
      cloudDensity: 0.52,
      cloudSpawnAhead: 145,
      cloudDeleteBehind: 80,
      cloudPoolLimit: 24,
      mountainSpawnAhead: 2200,
      mountainDeleteBehind: 900,
      mountainSegmentsScale: 0.58,
      treeDensity: 0.24,
      snowDetail: 0.65,
      starCount: 420,
      oceanSegments: 48,
      oceanNormalInterval: 7,
      raycastHz: 8,
      perfRefreshSeconds: 0.75,
      postFx: false
    },
    medium: {
      label: "Medium",
      pixelRatio: 1.35,
      antialias: true,
      shadows: true,
      shadowMapSize: 1024,
      cameraFar: 3900,
      cloudDensity: 0.72,
      cloudSpawnAhead: 175,
      cloudDeleteBehind: 95,
      cloudPoolLimit: 32,
      mountainSpawnAhead: 2900,
      mountainDeleteBehind: 1050,
      mountainSegmentsScale: 0.78,
      treeDensity: 0.55,
      snowDetail: 0.85,
      starCount: 800,
      oceanSegments: 64,
      oceanNormalInterval: 5,
      raycastHz: 12,
      perfRefreshSeconds: 0.6,
      postFx: false
    },
    high: {
      label: "High",
      pixelRatio: 1.75,
      antialias: true,
      shadows: true,
      shadowMapSize: 1536,
      cameraFar: 4500,
      cloudDensity: 0.94,
      cloudSpawnAhead: 205,
      cloudDeleteBehind: 115,
      cloudPoolLimit: 40,
      mountainSpawnAhead: 3400,
      mountainDeleteBehind: 1200,
      mountainSegmentsScale: 1.0,
      treeDensity: 0.9,
      snowDetail: 1.0,
      starCount: 1350,
      oceanSegments: 64,
      oceanNormalInterval: 3,
      raycastHz: 20,
      perfRefreshSeconds: 0.5,
      postFx: false
    },
    ultra: {
      label: "Ultra",
      pixelRatio: 2.0,
      antialias: true,
      shadows: true,
      shadowMapSize: 2048,
      cameraFar: 5200,
      cloudDensity: 1.1,
      cloudSpawnAhead: 245,
      cloudDeleteBehind: 145,
      cloudPoolLimit: 52,
      mountainSpawnAhead: 4200,
      mountainDeleteBehind: 1450,
      mountainSegmentsScale: 1.15,
      treeDensity: 1.15,
      snowDetail: 1.1,
      starCount: 2000,
      oceanSegments: 96,
      oceanNormalInterval: 2,
      raycastHz: 24,
      perfRefreshSeconds: 0.45,
      postFx: false
    }
  },

  init: function() {
    if (this.initialized) return;

    const saved = this.readSavedQuality();
    this.currentName = this.presets[saved] ? saved : this.DEFAULT_QUALITY;

    this.selectEl = document.getElementById("quality-select");
    this.labelEl = document.getElementById("quality-display");

    if (this.selectEl) {
      this.selectEl.value = this.currentName;
      this.selectEl.addEventListener("click", (event) => event.stopPropagation());
      this.selectEl.addEventListener("mousedown", (event) => event.stopPropagation());
      this.selectEl.addEventListener("change", () => this.setQuality(this.selectEl.value));
    }

    this.updateLabels();
    this.initialized = true;
  },

  readSavedQuality: function() {
    try {
      return localStorage.getItem(this.STORAGE_KEY) || this.DEFAULT_QUALITY;
    } catch (error) {
      return this.DEFAULT_QUALITY;
    }
  },

  saveQuality: function(name) {
    try {
      localStorage.setItem(this.STORAGE_KEY, name);
    } catch (error) {
      console.warn("Could not save quality setting:", error);
    }
  },

  getPresetName: function() {
    if (!this.initialized) this.init();
    return this.currentName;
  },

  getPreset: function() {
    if (!this.initialized) this.init();
    return this.presets[this.currentName] || this.presets[this.DEFAULT_QUALITY];
  },

  setQuality: function(name) {
    const nextName = this.presets[name] ? name : this.DEFAULT_QUALITY;
    const changed = nextName !== this.currentName;

    this.currentName = nextName;
    this.saveQuality(nextName);
    this.updateLabels();

    if (changed) {
      const preset = this.getPreset();
      this.listeners.forEach((listener) => {
        try {
          listener(preset, nextName);
        } catch (error) {
          console.warn("Quality listener failed:", error);
        }
      });

      if (typeof HudManager !== "undefined" && HudManager.showToast) {
        HudManager.showToast(`Quality: ${preset.label}`);
      }
    }
  },

  updateLabels: function() {
    const preset = this.presets[this.currentName] || this.presets[this.DEFAULT_QUALITY];

    if (this.selectEl && this.selectEl.value !== this.currentName) {
      this.selectEl.value = this.currentName;
    }

    if (this.labelEl) {
      this.labelEl.textContent = preset.label;
    }

    if (typeof HudManager !== "undefined" && HudManager.updateQuality) {
      HudManager.updateQuality(preset.label);
    }
  },

  onChange: function(listener) {
    if (typeof listener !== "function") return;
    this.listeners.push(listener);
  },

  applyRenderer: function(renderer, camera, sunLight) {
    const preset = this.getPreset();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, preset.pixelRatio);

    if (renderer) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = Boolean(preset.shadows);

      if (renderer.shadowMap.enabled) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
    }

    if (camera) {
      camera.far = preset.cameraFar;
      camera.updateProjectionMatrix();
    }

    if (sunLight && sunLight.shadow && sunLight.shadow.mapSize) {
      sunLight.castShadow = Boolean(preset.shadows);
      sunLight.shadow.mapSize.width = preset.shadowMapSize;
      sunLight.shadow.mapSize.height = preset.shadowMapSize;

      if (sunLight.shadow.map) {
        sunLight.shadow.map.dispose();
        sunLight.shadow.map = null;
      }
    }
  }
};

QualityManager.init();
