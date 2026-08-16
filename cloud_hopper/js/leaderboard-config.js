// leaderboard-config.js
// Cross-device leaderboard configuration.
//
// By default the game keeps using local browser storage. To enable the
// all-player leaderboard, create a Firebase Realtime Database, paste its URL
// below, and change enabled to true.
//
// Example URL formats:
//   https://your-project-id-default-rtdb.firebaseio.com
//   https://your-project-id-default-rtdb.europe-west1.firebasedatabase.app
window.GLOBAL_LEADERBOARD_CONFIG = {
  enabled: false,
  provider: "firebase-rtdb",
  firebaseDatabaseUrl: "",
  path: "cloud_hopper/leaderboard/runs",
  maxEntries: 10,
  requestTimeoutMs: 4500
};
