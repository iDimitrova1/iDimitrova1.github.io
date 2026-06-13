// physics.js
// Kinematic player movement, robust swept landing, special cloud behavior, and run state.

let velocity = new THREE.Vector3();
let isGrounded = false;
var scoreBonus = 0;
var comboCount = 0;

let currentGroundPlatform = null;
let lastLandedPlatform = null;

// Tuned as 60 FPS units. updatePhysics scales them by delta for steadier feel.
const GROUND_ACCEL = 0.09;
const GROUND_FRICTION = 0.85;
const AIR_ACCEL = 0.02;
const BASE_JUMP_FORCE = 0.23;
const GRAVITY = 0.0105;
const AIR_SPEED_LIMIT = 0.2;
const MAX_FRAME_SCALE = 2.0;
const LANDING_ABOVE_SLOP = 0.35;
const LANDING_BELOW_SLOP = 1.15;

function clearMovementKeys() {
  if (typeof keys === "undefined") return;

  keys.w = false;
  keys.a = false;
  keys.s = false;
  keys.d = false;
  keys.space = false;
}

function getRespawnPosition() {
  if (typeof getSafeSpawnPosition === "function") {
    return getSafeSpawnPosition();
  }

  return {
    x: 0,
    y: playerHeight + 1.1,
    z: 0
  };
}

function resetRunState() {
  scoreBonus = 0;
  comboCount = 0;
  currentGroundPlatform = null;
  lastLandedPlatform = null;

  if (typeof HudManager !== "undefined") {
    if (HudManager.updateCombo) HudManager.updateCombo(comboCount);
    if (HudManager.showToast) HudManager.showToast("New run");
  }
}

function resetPlayer() {
  const finishedScore = maxZ;

  if (typeof HudManager !== "undefined" && HudManager.recordRun) {
    HudManager.recordRun(finishedScore);
  }

  if (
    typeof clearAllClouds === "function" &&
    typeof buildInitialTrack === "function"
  ) {
    clearAllClouds();
    buildInitialTrack();
  }

  const spawn = getRespawnPosition();

  yawObject.position.set(spawn.x, spawn.y, spawn.z);
  yawObject.rotation.set(0, 0, 0);
  pitchObject.rotation.set(0, 0, 0);

  velocity.set(0, 0, 0);
  isGrounded = true;
  clearMovementKeys();
  resetRunState();

  if (
    typeof MountainManager !== "undefined" &&
    typeof scene !== "undefined" &&
    MountainManager.reset
  ) {
    MountainManager.reset(scene, yawObject.position.z);
  }

  if (
    typeof EnvironmentManager !== "undefined" &&
    EnvironmentManager.randomizeTime
  ) {
    EnvironmentManager.randomizeTime();
  }

  if (typeof RayTracingManager !== "undefined" && RayTracingManager.markDirty) {
    RayTracingManager.markDirty();
  }

  previousScore = finishedScore;

  if (prevScoreEl) {
    prevScoreEl.innerText = previousScore;
  }

  const storedBest =
    typeof HudManager !== "undefined" && HudManager.getBestScore
      ? HudManager.getBestScore()
      : 0;

  if (finishedScore > bestScore || storedBest > bestScore) {
    bestScore = Math.max(finishedScore, storedBest);

    if (bestScoreEl) {
      bestScoreEl.innerText = bestScore;
    }
  }

  maxZ = 0;

  if (scoreEl) {
    scoreEl.innerText = "0";
  }
}

function playerInsidePlatformXZ(platform, x, z) {
  return (
    x > platform.minX &&
    x < platform.maxX &&
    z > platform.minZ &&
    z < platform.maxZ
  );
}

function getCollisionPlatforms() {
  if (typeof CloudManager !== "undefined" && CloudManager.getNearbyPlatforms) {
    return CloudManager.getNearbyPlatforms(yawObject.position.z, 45, 95);
  }

  return typeof platforms !== "undefined" ? platforms : [];
}

function findLandingPlatform(previousFeetY, currentFeetY) {
  let bestPlatform = null;
  const collisionPlatforms = getCollisionPlatforms();

  for (let platform of collisionPlatforms) {
    if (!platform || !platform.mesh) continue;

    if (!playerInsidePlatformXZ(platform, yawObject.position.x, yawObject.position.z)) {
      continue;
    }

    const crossedSurface =
      previousFeetY >= platform.topY - 0.05 &&
      currentFeetY <= platform.topY + LANDING_ABOVE_SLOP;

    const closeToSurface =
      currentFeetY <= platform.topY + LANDING_ABOVE_SLOP &&
      currentFeetY >= platform.topY - LANDING_BELOW_SLOP;

    if (velocity.y <= 0 && (crossedSurface || closeToSurface)) {
      if (!bestPlatform || platform.topY > bestPlatform.topY) {
        bestPlatform = platform;
      }
    }
  }

  return bestPlatform;
}

function addScoreBonus(amount, label) {
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  if (value <= 0) return;

  scoreBonus += value;

  if (typeof HudManager !== "undefined" && HudManager.showToast) {
    HudManager.showToast(label ? `${label} +${value}` : `Bonus +${value}`);
  }
}

function handleNewPlatformLanding(platform, landingSpeed) {
  if (!platform || platform === lastLandedPlatform) return;

  lastLandedPlatform = platform;

  const isStart =
    typeof CloudManager !== "undefined" &&
    CloudManager.startPlatform &&
    platform === CloudManager.startPlatform;

  if (!isStart) {
    comboCount++;

    if (typeof HudManager !== "undefined" && HudManager.updateCombo) {
      HudManager.updateCombo(comboCount);
    }

    if (comboCount > 0 && comboCount % 5 === 0) {
      addScoreBonus(35 + comboCount * 4, `${comboCount}x combo`);
    }
  }

  const firstVisit =
    typeof CloudManager !== "undefined" && CloudManager.markVisited
      ? CloudManager.markVisited(platform)
      : !platform.visited;

  if (typeof AudioManager !== "undefined") {
    AudioManager.playLand(landingSpeed);
  }

  if (!firstVisit) return;

  if (typeof CloudManager !== "undefined") {
    if (platform.type === CloudManager.TYPE_GOLDEN) {
      addScoreBonus(90 + comboCount * 12, "Gold cloud");

      if (typeof AudioManager !== "undefined") {
        AudioManager.playBonus();
      }
    } else if (platform.type === CloudManager.TYPE_BOOST) {
      const horizSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
      velocity.y = Math.max(velocity.y, BASE_JUMP_FORCE * 1.85 + horizSpeed * 0.32);
      isGrounded = false;
      currentGroundPlatform = null;
      addScoreBonus(22 + comboCount * 3, "Boost");

      if (typeof AudioManager !== "undefined") {
        AudioManager.playBoost();
      }
    } else if (platform.type === CloudManager.TYPE_CRUMBLE) {
      CloudManager.triggerCrumble(platform);

      if (typeof HudManager !== "undefined" && HudManager.showToast) {
        HudManager.showToast("Crumbling cloud");
      }

      if (typeof AudioManager !== "undefined") {
        AudioManager.playBreak();
      }
    } else if (platform.type === CloudManager.TYPE_WIND) {
      if (typeof HudManager !== "undefined" && HudManager.showToast) {
        HudManager.showToast("Wind cloud");
      }
    }
  }
}

function resolvePlatformLanding(previousFeetY, currentFeetY, previousVelocityY) {
  const landingPlatform = findLandingPlatform(previousFeetY, currentFeetY);

  if (!landingPlatform) {
    if (!isGrounded) {
      currentGroundPlatform = null;
    }

    isGrounded = false;
    return;
  }

  velocity.y = 0;
  yawObject.position.y = landingPlatform.topY + playerHeight;
  isGrounded = true;
  currentGroundPlatform = landingPlatform;

  handleNewPlatformLanding(landingPlatform, previousVelocityY);
}

function updatePhysics(delta = 1 / 60) {
  const frameScale = Math.max(
    0.2,
    Math.min(MAX_FRAME_SCALE, (Number.isFinite(delta) ? delta : 1 / 60) * 60)
  );

  let wishDir = new THREE.Vector3();

  if (keys.w) wishDir.z -= 1;
  if (keys.s) wishDir.z += 1;
  if (keys.a) wishDir.x -= 1;
  if (keys.d) wishDir.x += 1;

  wishDir.normalize();
  wishDir.applyQuaternion(yawObject.quaternion);

  if (isGrounded) {
    const scaledFriction = Math.pow(GROUND_FRICTION, frameScale);
    velocity.x *= scaledFriction;
    velocity.z *= scaledFriction;

    if (wishDir.lengthSq() > 0) {
      velocity.x += wishDir.x * GROUND_ACCEL * frameScale;
      velocity.z += wishDir.z * GROUND_ACCEL * frameScale;
    }

    if (
      currentGroundPlatform &&
      typeof CloudManager !== "undefined" &&
      currentGroundPlatform.type === CloudManager.TYPE_WIND
    ) {
      velocity.x += currentGroundPlatform.windX * frameScale;
    }

    if (keys.space) {
      const horizSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
      const jumpBonus = horizSpeed * 0.35;

      velocity.y = BASE_JUMP_FORCE + jumpBonus;
      isGrounded = false;
      currentGroundPlatform = null;

      if (typeof AudioManager !== "undefined") {
        AudioManager.playJump();
      }
    }
  } else if (wishDir.lengthSq() > 0) {
    const currentSpdProj = velocity.x * wishDir.x + velocity.z * wishDir.z;

    if (currentSpdProj < AIR_SPEED_LIMIT) {
      velocity.x += wishDir.x * AIR_ACCEL * frameScale;
      velocity.z += wishDir.z * AIR_ACCEL * frameScale;
    }
  }

  const previousFeetY = yawObject.position.y - playerHeight;
  const previousVelocityY = velocity.y;

  velocity.y -= GRAVITY * frameScale;
  yawObject.position.addScaledVector(velocity, frameScale);

  const currentFeetY = yawObject.position.y - playerHeight;
  resolvePlatformLanding(previousFeetY, currentFeetY, previousVelocityY);

  if (yawObject.position.y < -18) {
    resetPlayer();
  }
}
