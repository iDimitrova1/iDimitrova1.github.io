// leaderboard.js
// Local + optional Firebase Realtime Database leaderboard service.
// The game remains playable with no backend. When leaderboard-config.js is
// filled in and enabled, scores are also submitted/fetched globally.
var LeaderboardService = {
  LOCAL_KEY: "cloud_hopper_top_runs_v3",
  initialized: false,
  status: "LOCAL",
  config: {
    enabled: false,
    provider: "firebase-rtdb",
    firebaseDatabaseUrl: "",
    path: "cloud_hopper/leaderboard/runs",
    maxEntries: 10,
    requestTimeoutMs: 4500
  },

  init: function() {
    if (this.initialized) return;

    const externalConfig = window.GLOBAL_LEADERBOARD_CONFIG || {};
    this.config = Object.assign({}, this.config, externalConfig);
    this.config.maxEntries = Math.max(1, Math.min(50, Number(this.config.maxEntries) || 10));
    this.config.requestTimeoutMs = Math.max(1500, Number(this.config.requestTimeoutMs) || 4500);
    this.config.path = this.normalizePath(this.config.path);
    this.config.firebaseDatabaseUrl = this.normalizeDatabaseUrl(this.config.firebaseDatabaseUrl);

    this.status = this.isGlobalEnabled() ? "GLOBAL" : "LOCAL";
    this.initialized = true;
  },

  isGlobalEnabled: function() {
    return Boolean(
      this.config.enabled &&
      this.config.provider === "firebase-rtdb" &&
      this.config.firebaseDatabaseUrl
    );
  },

  getStatusLabel: function() {
    if (!this.initialized) this.init();
    return this.status;
  },

  normalizeDatabaseUrl: function(url) {
    const cleaned = String(url || "").trim().replace(/\/+$/, "");
    if (!cleaned || !/^https:\/\//i.test(cleaned)) return "";
    return cleaned;
  },

  normalizePath: function(path) {
    return String(path || "cloud_hopper/leaderboard/runs")
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean)
      .join("/");
  },

  makeFirebaseUrl: function(query) {
    const encodedPath = this.config.path
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");

    return `${this.config.firebaseDatabaseUrl}/${encodedPath}.json${query || ""}`;
  },

  cleanRun: function(run) {
    const score = Math.max(0, Math.floor(Number(run && run.score) || 0));
    const name = String((run && run.name) || "Player")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 16) || "Player";

    return {
      name: name,
      score: score,
      date: Number(run && run.date) || Date.now(),
      time: String((run && run.time) || "--:--").slice(0, 8)
    };
  },

  sortTop: function(runs) {
    const maxEntries = this.config.maxEntries || 10;

    return (Array.isArray(runs) ? runs : [])
      .map((run) => this.cleanRun(run))
      .filter((run) => run.score > 0)
      .sort((a, b) => b.score - a.score || a.date - b.date)
      .slice(0, maxEntries);
  },

  loadLocalTop: function() {
    if (!this.initialized) this.init();

    try {
      const raw = localStorage.getItem(this.LOCAL_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return this.sortTop(parsed);
    } catch (error) {
      console.warn("Could not load local leaderboard:", error);
      return [];
    }
  },

  saveLocalTop: function(runs) {
    try {
      localStorage.setItem(this.LOCAL_KEY, JSON.stringify(this.sortTop(runs)));
    } catch (error) {
      console.warn("Could not save local leaderboard:", error);
    }
  },

  recordLocal: function(run) {
    const localRuns = this.loadLocalTop();
    localRuns.push(this.cleanRun(run));
    const topRuns = this.sortTop(localRuns);
    this.saveLocalTop(topRuns);
    return topRuns;
  },

  getLocalBest: function() {
    const localTop = this.loadLocalTop();
    return localTop.length ? localTop[0].score : 0;
  },

  fetchTopRuns: async function() {
    if (!this.initialized) this.init();

    if (!this.isGlobalEnabled()) {
      this.status = "LOCAL";
      return this.loadLocalTop();
    }

    try {
      const topRuns = await this.fetchFirebaseTop();
      this.status = "GLOBAL";
      return topRuns.length ? topRuns : this.loadLocalTop();
    } catch (error) {
      console.warn("Global leaderboard fetch failed:", error);
      this.status = "LOCAL FALLBACK";
      return this.loadLocalTop();
    }
  },

  submitRun: async function(run) {
    if (!this.initialized) this.init();

    if (!this.isGlobalEnabled()) {
      this.status = "LOCAL";
      return this.loadLocalTop();
    }

    try {
      await this.postFirebaseRun(run);
      const topRuns = await this.fetchFirebaseTop();
      this.status = "GLOBAL";
      return topRuns;
    } catch (error) {
      console.warn("Global leaderboard submit failed:", error);
      this.status = "LOCAL SAVED";
      return this.loadLocalTop();
    }
  },

  fetchFirebaseTop: async function() {
    const limit = Math.max(this.config.maxEntries * 3, this.config.maxEntries);
    const query = `?orderBy=%22score%22&limitToLast=${encodeURIComponent(String(limit))}`;
    const response = await this.fetchWithTimeout(this.makeFirebaseUrl(query), {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Firebase GET failed with ${response.status}`);
    }

    const data = await response.json();
    const values = data && typeof data === "object" ? Object.values(data) : [];
    return this.sortTop(values);
  },

  postFirebaseRun: async function(run) {
    const payload = this.cleanRun(run);
    if (payload.score <= 0) return;

    const response = await this.fetchWithTimeout(this.makeFirebaseUrl(""), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Firebase POST failed with ${response.status}`);
    }
  },

  fetchWithTimeout: function(url, options) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeout = setTimeout(() => {
      if (controller) controller.abort();
    }, this.config.requestTimeoutMs);

    const fetchOptions = Object.assign({}, options || {});
    if (controller) fetchOptions.signal = controller.signal;

    return fetch(url, fetchOptions).finally(() => clearTimeout(timeout));
  }
};
