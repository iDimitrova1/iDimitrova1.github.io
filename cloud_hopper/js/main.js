// main.js - MAIN GAME ENGINE CONTROLLER
const clock = new THREE.Clock();
const speedo = document.getElementById("speedo");

let bobTimer = 0;
let gameTime = 0;

let mountainsInitialized = false;
let oceanInitialized = false;
let environmentInitialized = false;
let rayTracingInitialized = false;
let performanceInitialized = false;

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const cappedDelta = Math.min(delta, 0.1);

  gameTime += cappedDelta;

  if (
    !mountainsInitialized &&
    typeof scene !== "undefined" &&
    typeof MountainManager !== "undefined"
  ) {
    const startZ =
      typeof yawObject !== "undefined" && yawObject ? yawObject.position.z : 0;

    MountainManager.init(scene, startZ);
    mountainsInitialized = true;
  }

  if (
    !oceanInitialized &&
    typeof scene !== "undefined" &&
    typeof OceanManager !== "undefined"
  ) {
    OceanManager.init(scene);
    oceanInitialized = true;
  }

  if (
    !environmentInitialized &&
    typeof EnvironmentManager !== "undefined" &&
    typeof scene !== "undefined" &&
    typeof renderer !== "undefined" &&
    typeof camera !== "undefined"
  ) {
    EnvironmentManager.init(scene, renderer, camera, {
      ambientLight: typeof ambientLight !== "undefined" ? ambientLight : null,
      hemiLight: typeof hemiLight !== "undefined" ? hemiLight : null,
      sunLight: typeof dirLight !== "undefined" ? dirLight : null,
      moonLight: typeof moonLight !== "undefined" ? moonLight : null,
      ocean: typeof ocean !== "undefined" ? ocean : null
    });
    environmentInitialized = true;
  }

  if (
    !rayTracingInitialized &&
    typeof RayTracingManager !== "undefined" &&
    typeof scene !== "undefined" &&
    typeof camera !== "undefined" &&
    typeof yawObject !== "undefined"
  ) {
    RayTracingManager.init(scene, camera, yawObject);
    rayTracingInitialized = true;
  }

  if (
    !performanceInitialized &&
    typeof PerformanceMonitor !== "undefined" &&
    typeof renderer !== "undefined" &&
    typeof scene !== "undefined"
  ) {
    PerformanceMonitor.init(renderer, scene);
    performanceInitialized = true;
  }

  if (gameStarted) {
    updatePhysics(cappedDelta);

    if (
      typeof yawObject !== "undefined" &&
      typeof CloudManager !== "undefined" &&
      CloudManager.update
    ) {
      CloudManager.update(cappedDelta, yawObject.position.z);
    } else if (
      typeof yawObject !== "undefined" &&
      typeof manageEndlessClouds === "function"
    ) {
      manageEndlessClouds(yawObject.position.z, cappedDelta);
    }

    if (typeof velocity !== "undefined") {
      const horizSpeed = Math.sqrt(
        velocity.x * velocity.x + velocity.z * velocity.z
      );

      if (speedo) {
        speedo.innerText = Math.round(horizSpeed * 1000);
      }

      if (typeof yawObject !== "undefined") {
        updateScore(yawObject.position.z);
      }

      animateViewmodel(horizSpeed, cappedDelta);

      if (typeof AudioManager !== "undefined" && AudioManager.update) {
        AudioManager.update(cappedDelta, horizSpeed, velocity.y, !isGrounded && velocity.y < 0);
      }
    }
  }

  if (environmentInitialized && typeof yawObject !== "undefined") {
    EnvironmentManager.update(cappedDelta, yawObject.position);

    if (typeof HudManager !== "undefined" && EnvironmentManager.getTimeInfo) {
      const timeInfo = EnvironmentManager.getTimeInfo();
      HudManager.updateTime(timeInfo.time, timeInfo.label);
    }
  }

  if (rayTracingInitialized) {
    RayTracingManager.update(cappedDelta);
  }

  if (oceanInitialized && typeof yawObject !== "undefined" && yawObject) {
    OceanManager.update(gameTime, yawObject.position.z);
  }

  if (mountainsInitialized && typeof yawObject !== "undefined" && yawObject) {
    MountainManager.manage(yawObject.position.z, scene);
  }

  if (
    typeof renderer !== "undefined" &&
    typeof scene !== "undefined" &&
    typeof camera !== "undefined"
  ) {
    renderer.render(scene, camera);
  }

  if (performanceInitialized && typeof PerformanceMonitor !== "undefined") {
    PerformanceMonitor.update(cappedDelta);
  }
}

function animateViewmodel(horizSpeed, delta) {
  if (!viewmodel) return;

  if (isGrounded && horizSpeed > 0.005) {
    bobTimer += horizSpeed * 20 * delta;
    viewmodel.position.y = Math.sin(bobTimer * 2) * 0.025;
    viewmodel.position.x = Math.cos(bobTimer) * 0.015;
  } else if (!isGrounded) {
    viewmodel.position.y = THREE.MathUtils.lerp(
      viewmodel.position.y,
      -0.04,
      10 * delta
    );

    viewmodel.position.x = THREE.MathUtils.lerp(
      viewmodel.position.x,
      0.01,
      10 * delta
    );
  } else {
    bobTimer += 1.5 * delta;
    viewmodel.position.y = Math.sin(bobTimer) * 0.004;
    viewmodel.position.x = THREE.MathUtils.lerp(
      viewmodel.position.x,
      0,
      10 * delta
    );
  }
}

let maxZ = 0;
let previousScore = 0;
let bestScore = 0;

const scoreEl = document.getElementById("score");
const prevScoreEl = document.getElementById("prev-score");
const bestScoreEl = document.getElementById("best-score");

if (typeof HudManager !== "undefined" && HudManager.init) {
  HudManager.init();
  bestScore = HudManager.getBestScore();

  if (bestScoreEl) {
    bestScoreEl.innerText = bestScore;
  }
}

function updateScore(zPos) {
  const bonus = typeof scoreBonus !== "undefined" ? scoreBonus : 0;
  const currentScore = Math.floor(Math.abs(zPos) + bonus);

  if (currentScore > maxZ) {
    maxZ = currentScore;

    if (scoreEl) {
      scoreEl.innerText = maxZ;
    }
  }
}

animate();
