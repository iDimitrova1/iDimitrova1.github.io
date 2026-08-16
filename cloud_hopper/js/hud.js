// hud.js
var HudManager = {
  runs: [],
  initialized: false,
  timeEl: null,
  timeLabelEl: null,
  listEl: null,
  nicknameEl: null,
  bestEl: null,
  statusEl: null,
  comboEl: null,
  toastEl: null,
  qualityEl: null,
  refreshTimer: null,
  toastTimer: null,

  init: function() {
    if (this.initialized) return;

    if (typeof LeaderboardService !== "undefined") {
      LeaderboardService.init();
    }

    this.timeEl = document.getElementById("time-of-day");
    this.timeLabelEl = document.getElementById("time-of-day-label");
    this.listEl = document.getElementById("top-runs-list");
    this.nicknameEl = document.getElementById("nickname-display");
    this.bestEl = document.getElementById("best-score");
    this.statusEl = document.getElementById("leaderboard-status");
    this.comboEl = document.getElementById("combo-count");
    this.toastEl = document.getElementById("toast-message");
    this.qualityEl = document.getElementById("quality-display");

    this.runs = this.getLocalRuns();
    this.renderRuns();
    this.syncBestScore();
    this.updateLeaderboardStatus();
    this.updateCombo(typeof comboCount !== "undefined" ? comboCount : 0);

    if (typeof QualityManager !== "undefined" && QualityManager.getPreset) {
      this.updateQuality(QualityManager.getPreset().label);
    }

    this.initialized = true;

    this.refreshRuns();

    if (!this.refreshTimer) {
      this.refreshTimer = setInterval(() => this.refreshRuns(), 30000);
    }
  },

  getLocalRuns: function() {
    if (typeof LeaderboardService !== "undefined" && LeaderboardService.loadLocalTop) {
      return LeaderboardService.loadLocalTop();
    }

    return [];
  },

  updateLeaderboardStatus: function(label) {
    if (!this.statusEl) return;

    const status = label ||
      (typeof LeaderboardService !== "undefined" && LeaderboardService.getStatusLabel
        ? LeaderboardService.getStatusLabel()
        : "LOCAL");

    this.statusEl.textContent = status;
    this.statusEl.className = "leaderboard-status " +
      (status.indexOf("GLOBAL") >= 0 ? "leaderboard-global" : "leaderboard-local");
  },

  setRuns: function(runs) {
    this.runs = Array.isArray(runs) ? runs : [];
    this.renderRuns();
    this.syncBestScore();
    this.updateLeaderboardStatus();
  },

  refreshRuns: function() {
    if (typeof LeaderboardService === "undefined" || !LeaderboardService.fetchTopRuns) {
      this.setRuns(this.getLocalRuns());
      return;
    }

    LeaderboardService.fetchTopRuns()
      .then((runs) => this.setRuns(runs))
      .catch((error) => {
        console.warn("Could not refresh leaderboard:", error);
        this.runs = this.getLocalRuns();
        this.renderRuns();
        this.syncBestScore();
        this.updateLeaderboardStatus("LOCAL FALLBACK");
      });
  },

  setNickname: function(nickname) {
    if (!this.initialized) this.init();

    if (this.nicknameEl) {
      this.nicknameEl.textContent = nickname || "---";
    }
  },

  updateTime: function(timeText, labelText) {
    if (!this.initialized) this.init();

    if (this.timeEl) {
      this.timeEl.textContent = timeText || "--:--";
    }

    if (this.timeLabelEl) {
      this.timeLabelEl.textContent = labelText || "Unknown";
    }
  },

  updateQuality: function(label) {
    if (!this.qualityEl) {
      this.qualityEl = document.getElementById("quality-display");
    }

    if (this.qualityEl) {
      this.qualityEl.textContent = label || "Custom";
    }
  },

  updateCombo: function(combo) {
    if (!this.comboEl) {
      this.comboEl = document.getElementById("combo-count");
    }

    const value = Math.max(0, Math.floor(Number(combo) || 0));

    if (this.comboEl) {
      this.comboEl.textContent = `${value}x`;
    }
  },

  showToast: function(message) {
    if (!this.toastEl) {
      this.toastEl = document.getElementById("toast-message");
    }

    if (!this.toastEl || !message) return;

    this.toastEl.textContent = message;
    this.toastEl.classList.add("visible");

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      if (this.toastEl) {
        this.toastEl.classList.remove("visible");
      }
    }, 1500);
  },

  recordRun: function(score) {
    if (!this.initialized) this.init();

    const runScore = Math.floor(Number(score) || 0);
    if (runScore <= 0) return;

    const nickname =
      typeof ProfileManager !== "undefined" && ProfileManager.getNickname
        ? ProfileManager.getNickname()
        : "Player";

    const timeInfo =
      typeof EnvironmentManager !== "undefined" && EnvironmentManager.getTimeInfo
        ? EnvironmentManager.getTimeInfo()
        : { time: "--:--" };

    const run = {
      name: nickname || "Player",
      score: runScore,
      date: Date.now(),
      time: timeInfo.time || "--:--"
    };

    if (typeof LeaderboardService === "undefined") {
      this.runs.push(run);
      this.runs.sort((a, b) => b.score - a.score || a.date - b.date);
      this.runs = this.runs.slice(0, 10);
      this.renderRuns();
      this.syncBestScore();
      return;
    }

    const localRuns = LeaderboardService.recordLocal(run);
    this.setRuns(localRuns);

    LeaderboardService.submitRun(run)
      .then((runs) => this.setRuns(runs))
      .catch((error) => {
        console.warn("Could not submit leaderboard run:", error);
        this.setRuns(localRuns);
        this.updateLeaderboardStatus("LOCAL SAVED");
      });
  },

  getBestScore: function() {
    if (typeof LeaderboardService !== "undefined" && LeaderboardService.getLocalBest) {
      return LeaderboardService.getLocalBest();
    }

    return this.runs.length ? this.runs[0].score : 0;
  },

  syncBestScore: function() {
    const best = this.getBestScore ? this.getBestScore() : 0;

    if (!this.bestEl) {
      this.bestEl = document.getElementById("best-score");
    }

    if (this.bestEl) {
      this.bestEl.textContent = String(best);
    }
  },

  renderRuns: function() {
    if (!this.listEl) return;

    this.listEl.innerHTML = "";

    if (!this.runs.length) {
      const empty = document.createElement("li");
      empty.className = "empty-run";
      empty.textContent = "No runs yet";
      this.listEl.appendChild(empty);
      return;
    }

    for (const run of this.runs) {
      const item = document.createElement("li");
      const name = document.createElement("span");
      const score = document.createElement("span");

      name.className = "run-name";
      name.textContent = run.name;

      score.className = "run-score";
      score.textContent = String(run.score);

      item.title = `${run.name} — ${run.score} at ${run.time || "--:--"}`;
      item.appendChild(name);
      item.appendChild(score);
      this.listEl.appendChild(item);
    }
  }
};

var ProfileManager = {
  STORAGE_KEY: "cloud_hopper_nickname",
  ready: false,
  nickname: "",
  modal: null,
  input: null,
  submitButton: null,
  errorEl: null,
  menuStartText: null,

  init: function() {
    this.modal = document.getElementById("nickname-modal");
    this.input = document.getElementById("nickname-input");
    this.submitButton = document.getElementById("nickname-submit");
    this.errorEl = document.getElementById("nickname-error");
    this.menuStartText = document.getElementById("menu-start-text");

    const savedNickname = this.getSavedNickname();

    if (savedNickname && this.input) {
      this.input.value = savedNickname;
    }

    if (this.submitButton) {
      this.submitButton.addEventListener("click", () => this.trySubmit());
    }

    if (this.input) {
      this.input.addEventListener("keydown", (event) => {
        event.stopPropagation();

        if (event.code === "Enter") {
          this.trySubmit();
        }
      });

      setTimeout(() => this.input.focus(), 0);
    }

    if (typeof HudManager !== "undefined") {
      HudManager.init();
      HudManager.setNickname("---");
    }
  },

  getSavedNickname: function() {
    try {
      return localStorage.getItem(this.STORAGE_KEY) || "";
    } catch (error) {
      return "";
    }
  },

  saveNickname: function(nickname) {
    try {
      localStorage.setItem(this.STORAGE_KEY, nickname);
    } catch (error) {
      console.warn("Could not save nickname:", error);
    }
  },

  cleanNickname: function(value) {
    return String(value || "")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 16);
  },

  trySubmit: function() {
    const cleaned = this.cleanNickname(this.input ? this.input.value : "");

    if (!cleaned) {
      if (this.errorEl) {
        this.errorEl.textContent = "Enter a nickname first.";
      }

      if (this.input) {
        this.input.focus();
      }

      return false;
    }

    this.nickname = cleaned;
    this.ready = true;
    this.saveNickname(cleaned);

    if (this.errorEl) {
      this.errorEl.textContent = "";
    }

    if (this.modal) {
      this.modal.classList.add("hidden");
    }

    if (this.menuStartText) {
      this.menuStartText.textContent = "Click anywhere to start jumping";
    }

    if (typeof HudManager !== "undefined") {
      HudManager.setNickname(cleaned);
      HudManager.showToast(`Player: ${cleaned}`);
    }

    return true;
  },

  isReady: function() {
    return this.ready;
  },

  getNickname: function() {
    return this.nickname || "Player";
  },

  focus: function() {
    if (this.modal) {
      this.modal.classList.remove("hidden");
    }

    if (this.input) {
      this.input.focus();
    }
  }
};
