// performance.js
// Developer performance overlay. Toggle with F3.
var PerformanceMonitor = {
  initialized: false,
  visible: false,
  renderer: null,
  scene: null,
  el: null,
  elapsed: 0,
  frames: 0,
  fps: 0,

  init: function(renderer, scene) {
    if (this.initialized) return;

    this.renderer = renderer || null;
    this.scene = scene || null;
    this.el = document.getElementById("performance-overlay");

    if (!this.el) {
      this.el = document.createElement("div");
      this.el.id = "performance-overlay";
      document.body.appendChild(this.el);
    }

    this.el.classList.add("hidden");

    document.addEventListener("keydown", (event) => {
      if (event.code !== "F3") return;
      event.preventDefault();
      this.toggle();
    });

    this.initialized = true;
  },

  toggle: function() {
    this.visible = !this.visible;

    if (this.el) {
      this.el.classList.toggle("hidden", !this.visible);
    }
  },

  countTreeInstances: function() {
    if (typeof MountainManager !== "undefined" && MountainManager.getTreeInstanceCount) {
      return MountainManager.getTreeInstanceCount();
    }

    return 0;
  },

  countRayTargets: function() {
    if (typeof RayTracingManager !== "undefined" && RayTracingManager.targets) {
      return RayTracingManager.targets.length;
    }

    return 0;
  },

  update: function(delta) {
    if (!this.initialized || !this.visible || !this.el) return;

    const preset =
      typeof QualityManager !== "undefined" && QualityManager.getPreset
        ? QualityManager.getPreset()
        : { label: "Custom", perfRefreshSeconds: 0.5 };

    this.elapsed += Number.isFinite(delta) ? delta : 0;
    this.frames++;

    const refreshSeconds = preset.perfRefreshSeconds || 0.5;
    if (this.elapsed < refreshSeconds) return;

    this.fps = Math.round(this.frames / Math.max(0.001, this.elapsed));
    this.elapsed = 0;
    this.frames = 0;

    const info = this.renderer && this.renderer.info ? this.renderer.info : null;
    const render = info ? info.render : { calls: 0, triangles: 0 };
    const memory = info ? info.memory : { geometries: 0, textures: 0 };
    const clouds = typeof CloudManager !== "undefined" ? CloudManager.platforms.length : 0;
    const pool = typeof CloudManager !== "undefined" && CloudManager.pool ? CloudManager.pool.length : 0;
    const mountains = typeof MountainManager !== "undefined" ? MountainManager.mountains.length : 0;
    const nearby = typeof CloudManager !== "undefined" && CloudManager.nearbyCache ? CloudManager.nearbyCache.length : 0;

    this.el.innerHTML = [
      `<b>F3 DEBUG</b>`,
      `Quality: ${preset.label || "Custom"}`,
      `FPS: ${this.fps}`,
      `Draw calls: ${render.calls}`,
      `Triangles: ${render.triangles}`,
      `Geometries: ${memory.geometries}`,
      `Textures: ${memory.textures}`,
      `Clouds: ${clouds} / pool ${pool}`,
      `Collision clouds: ${nearby}`,
      `Mountain chunks: ${mountains}`,
      `Tree instances: ${this.countTreeInstances()}`,
      `Ray targets: ${this.countRayTargets()}`
    ].join("<br>");
  }
};
