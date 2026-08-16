// difficulty.js
// Route and difficulty progression for endless cloud generation.
var DifficultyManager = {
  clamp: function(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  getLevel: function(distance) {
    const d = Math.max(0, Number(distance) || 0);

    return {
      distance: d,
      t: this.clamp(d / 3800, 0, 1),
      tier: d < 500 ? 0 : d < 1500 ? 1 : d < 3000 ? 2 : 3
    };
  },

  choosePattern: function(distance) {
    const level = this.getLevel(distance);
    const r = Math.random();

    if (level.tier === 0) {
      return r < 0.58 ? "straight" : r < 0.82 ? "gentle-zigzag" : "recovery";
    }

    if (level.tier === 1) {
      return r < 0.32 ? "gentle-zigzag" : r < 0.56 ? "climb" : r < 0.78 ? "wide" : "recovery";
    }

    if (level.tier === 2) {
      return r < 0.26 ? "wide" : r < 0.48 ? "climb" : r < 0.66 ? "boost-chain" : r < 0.84 ? "wind-line" : "recovery";
    }

    return r < 0.24 ? "wide" : r < 0.44 ? "boost-chain" : r < 0.64 ? "wind-line" : r < 0.82 ? "crumble-gap" : "climb";
  },

  createState: function(distance) {
    const pattern = this.choosePattern(distance);
    const length = pattern === "recovery" ? 4 + Math.floor(Math.random() * 3) : 5 + Math.floor(Math.random() * 5);

    return {
      pattern: pattern,
      remaining: length,
      direction: Math.random() < 0.5 ? -1 : 1,
      step: 0
    };
  },

  nextStep: function(distance, state) {
    const level = this.getLevel(distance);
    let route = state;

    if (!route || route.remaining <= 0) {
      route = this.createState(distance);
    }

    const t = level.t;
    const baseGap = 34 + t * 16 + Math.random() * (10 + t * 8);
    let gap = baseGap;
    let xDelta = (Math.random() - 0.5) * (17 + t * 22);
    let yDelta = (Math.random() - 0.36) * (2.7 + t * 2.8);
    let width = 17.5 - t * 4.2 + Math.random() * 7.2;
    let depth = 16.5 - t * 3.6 + Math.random() * 7.0;
    let typeHint = "normal";

    if (route.pattern === "straight") {
      xDelta *= 0.35;
      yDelta *= 0.45;
      width += 2.5;
      depth += 2.0;
    } else if (route.pattern === "gentle-zigzag") {
      xDelta = route.direction * (12 + Math.random() * (13 + t * 8));
      if (route.step % 2 === 1) xDelta *= -1;
      yDelta *= 0.8;
    } else if (route.pattern === "wide") {
      gap += 7 + t * 12;
      xDelta = route.direction * (20 + Math.random() * (20 + t * 18));
      if (route.step % 2 === 1) route.direction *= -1;
      width += 1.0;
    } else if (route.pattern === "climb") {
      gap += 2 + t * 7;
      yDelta = 1.2 + Math.random() * (2.4 + t * 2.2);
      xDelta *= 0.65;
      depth += 1.2;
    } else if (route.pattern === "boost-chain") {
      gap += 8 + t * 16;
      xDelta = route.direction * (10 + Math.random() * (24 + t * 18));
      yDelta = 0.5 + Math.random() * (2.5 + t * 1.8);
      typeHint = route.step % 2 === 0 ? "boost" : "normal";
      width += 1.5;
      depth += 1.5;
    } else if (route.pattern === "wind-line") {
      gap += 4 + t * 8;
      xDelta = route.direction * (14 + Math.random() * (18 + t * 20));
      typeHint = route.step % 2 === 0 ? "wind" : "normal";
    } else if (route.pattern === "crumble-gap") {
      gap += 7 + t * 12;
      xDelta = route.direction * (12 + Math.random() * (24 + t * 18));
      typeHint = route.step % 3 === 1 ? "crumble" : "normal";
      width -= 1.2;
      depth -= 0.8;
    } else if (route.pattern === "recovery") {
      gap -= 4;
      xDelta *= 0.45;
      yDelta *= 0.35;
      width += 4.5;
      depth += 3.5;
      typeHint = Math.random() < 0.22 ? "golden" : "normal";
    }

    route.remaining--;
    route.step++;

    return {
      state: route,
      gap: this.clamp(gap, 28, 78),
      xDelta: this.clamp(xDelta, -48, 48),
      yDelta: this.clamp(yDelta, -3.6, 6.4),
      width: this.clamp(width, 11.5, 29),
      depth: this.clamp(depth, 11.5, 29),
      typeHint: typeHint,
      pattern: route.pattern,
      level: level
    };
  }
};
