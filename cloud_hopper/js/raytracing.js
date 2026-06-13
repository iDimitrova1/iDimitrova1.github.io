// raytracing.js
// Lightweight raycasting foundation for future gameplay features.
// This intentionally ignores the knife/viewmodel layer.

const RayTracingManager = {
  WORLD_LAYER: 0,
  VIEWMODEL_LAYER: 1,
  CAMERA_CAST_INTERVAL: 1 / 20,
  DOWN_CAST_INTERVAL: 1 / 12,
  raycaster: null,
  scene: null,
  camera: null,
  playerObject: null,
  targets: [],
  targetsDirty: true,
  cameraCastTimer: 0,
  downCastTimer: 0,
  lastCameraHit: null,
  lastDownHit: null,

  init: function(scene, camera, playerObject) {
    this.applyQuality();
    this.scene = scene;
    this.camera = camera;
    this.playerObject = playerObject;
    this.raycaster = new THREE.Raycaster();

    this.raycaster.layers.set(this.WORLD_LAYER);

    if (this.camera && this.camera.layers) {
      this.camera.layers.enable(this.WORLD_LAYER);
      this.camera.layers.enable(this.VIEWMODEL_LAYER);
    }

    this.markDirty();
  },

  applyQuality: function() {
    const preset =
      typeof QualityManager !== "undefined" && QualityManager.getPreset
        ? QualityManager.getPreset()
        : { raycastHz: 20 };

    const hz = Math.max(4, Math.min(30, Number(preset.raycastHz) || 20));
    this.CAMERA_CAST_INTERVAL = 1 / hz;
    this.DOWN_CAST_INTERVAL = 1 / Math.max(4, Math.floor(hz * 0.65));
  },

  markDirty: function() {
    this.targetsDirty = true;
  },

  isIgnoredObject: function(object) {
    let current = object;

    while (current) {
      if (
        current.userData &&
        (current.userData.rayTraceIgnore || current.userData.viewModel)
      ) {
        return true;
      }

      current = current.parent;
    }

    return false;
  },

  collectTargets: function(force = false) {
    if (!this.scene || !this.raycaster) return this.targets;

    if (!force && !this.targetsDirty && this.targets.length) {
      return this.targets;
    }

    this.targets.length = 0;

    this.scene.traverse((object) => {
      if (!object.isMesh || !object.userData || !object.userData.rayTraceTarget) {
        return;
      }

      if (this.isIgnoredObject(object)) {
        return;
      }

      if (object.layers && !object.layers.test(this.raycaster.layers)) {
        return;
      }

      this.targets.push(object);
    });

    this.targetsDirty = false;
    return this.targets;
  },

  castFromCamera: function(maxDistance = 450, forceRefresh = false) {
    if (!this.raycaster || !this.camera) return null;

    this.raycaster.layers.set(this.WORLD_LAYER);
    this.collectTargets(forceRefresh);
    this.raycaster.near = 0.05;
    this.raycaster.far = maxDistance;
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    const hits = this.raycaster.intersectObjects(this.targets, true);
    this.lastCameraHit = hits.length ? hits[0] : null;

    return this.lastCameraHit;
  },

  castFromPlayer: function(direction, maxDistance = 450, forceRefresh = false) {
    if (!this.raycaster || !this.playerObject || !direction) return null;

    const origin = this.playerObject.position.clone();
    const normalized = direction.clone().normalize();

    this.raycaster.layers.set(this.WORLD_LAYER);
    this.collectTargets(forceRefresh);
    this.raycaster.near = 0.05;
    this.raycaster.far = maxDistance;
    this.raycaster.set(origin, normalized);

    const hits = this.raycaster.intersectObjects(this.targets, true);
    return hits.length ? hits[0] : null;
  },

  castDown: function(maxDistance = 80, forceRefresh = false) {
    if (!this.playerObject) return null;

    this.lastDownHit = this.castFromPlayer(
      new THREE.Vector3(0, -1, 0),
      maxDistance,
      forceRefresh
    );

    return this.lastDownHit;
  },

  update: function(delta = 0) {
    const dt = Number.isFinite(delta) ? delta : 0;
    const forceRefresh = this.targetsDirty;

    this.cameraCastTimer += dt;
    this.downCastTimer += dt;

    if (forceRefresh || this.cameraCastTimer >= this.CAMERA_CAST_INTERVAL) {
      this.castFromCamera(450, forceRefresh);
      this.cameraCastTimer = 0;
    }

    if (forceRefresh || this.downCastTimer >= this.DOWN_CAST_INTERVAL) {
      this.castDown(80, false);
      this.downCastTimer = 0;
    }
  }
};


if (typeof QualityManager !== "undefined" && QualityManager.onChange) {
  QualityManager.onChange(() => RayTracingManager.applyQuality());
}
