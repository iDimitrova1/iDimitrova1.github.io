// input.js
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  space: false
};

let gameStarted = false;

const menu = document.getElementById("menu");

if (typeof ProfileManager !== "undefined") {
  ProfileManager.init();
}

function canStartGame() {
  return (
    typeof ProfileManager === "undefined" ||
    !ProfileManager.isReady ||
    ProfileManager.isReady()
  );
}

function requestGameStart() {
  if (!canStartGame()) {
    ProfileManager.focus();
    return;
  }

  if (typeof AudioManager !== "undefined" && AudioManager.unlock) {
    AudioManager.unlock();
  }

  if (document.body.requestPointerLock) {
    document.body.requestPointerLock();
  }
}

if (menu) {
  menu.addEventListener("click", requestGameStart);
}

document.addEventListener("pointerlockchange", () => {
  gameStarted = document.pointerLockElement === document.body;

  if (menu) {
    menu.style.display = gameStarted ? "none" : "flex";
  }
});

function isTypingTarget(event) {
  const tag = event.target && event.target.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "BUTTON" || tag === "TEXTAREA";
}

document.addEventListener("keydown", (event) => {
  if (isTypingTarget(event)) return;

  if (event.code === "KeyW") keys.w = true;
  if (event.code === "KeyA") keys.a = true;
  if (event.code === "KeyS") keys.s = true;
  if (event.code === "KeyD") keys.d = true;
  if (event.code === "Space") keys.space = true;
});

document.addEventListener("keyup", (event) => {
  if (isTypingTarget(event)) return;

  if (event.code === "KeyW") keys.w = false;
  if (event.code === "KeyA") keys.a = false;
  if (event.code === "KeyS") keys.s = false;
  if (event.code === "KeyD") keys.d = false;
  if (event.code === "Space") keys.space = false;
});
