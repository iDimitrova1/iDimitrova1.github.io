// audio.js
// Lightweight generated audio. No asset files required.
var AudioManager = {
  context: null,
  masterGain: null,
  windGain: null,
  windSource: null,
  enabled: true,
  unlocked: false,

  init: function() {
    if (this.context || !this.enabled) return;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;

    this.context = new AudioContextCtor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.38;
    this.masterGain.connect(this.context.destination);

    this.createWindLoop();
  },

  unlock: function() {
    this.init();

    if (!this.context) return;

    if (this.context.state === "suspended") {
      this.context.resume().catch(() => {});
    }

    this.unlocked = true;
  },

  createWindLoop: function() {
    if (!this.context || this.windSource) return;

    const sampleRate = this.context.sampleRate;
    const length = sampleRate * 2;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.92 + white * 0.08;
      data[i] = last * 0.75;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    source.buffer = buffer;
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = 720;
    gain.gain.value = 0.0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    this.windSource = source;
    this.windGain = gain;
  },

  playTone: function(freq, duration, type, volume, slideTo) {
    if (!this.context || !this.unlocked) return;

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = type || "sine";
    oscillator.frequency.setValueAtTime(freq, now);

    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume || 0.08), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(this.masterGain);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  },

  playJump: function() {
    this.playTone(220, 0.12, "triangle", 0.05, 330);
  },

  playLand: function(strength) {
    const volume = Math.min(0.12, 0.035 + Math.abs(strength || 0) * 0.08);
    this.playTone(130, 0.09, "sine", volume, 80);
  },

  playBoost: function() {
    this.playTone(240, 0.18, "square", 0.06, 760);
    setTimeout(() => this.playTone(460, 0.12, "triangle", 0.05, 920), 55);
  },

  playBonus: function() {
    this.playTone(520, 0.11, "triangle", 0.05, 760);
    setTimeout(() => this.playTone(780, 0.11, "triangle", 0.045, 1040), 80);
  },

  playBreak: function() {
    this.playTone(110, 0.18, "sawtooth", 0.055, 55);
  },

  update: function(delta, horizSpeed, verticalSpeed, isFalling) {
    if (!this.context || !this.windGain) return;

    const speed = Math.max(0, Number(horizSpeed) || 0);
    const fall = isFalling ? Math.abs(Number(verticalSpeed) || 0) : 0;
    const target = Math.min(0.16, speed * 0.18 + fall * 0.11);
    const now = this.context.currentTime;

    this.windGain.gain.setTargetAtTime(target, now, 0.25);
  }
};
