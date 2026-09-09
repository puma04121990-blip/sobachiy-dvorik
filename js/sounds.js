/**
 * CC0 dog-yard samples, with Web Audio synth fallback.
 * Mute flag persisted in localStorage (`dog-yard-mute`).
 */
(function (global) {
  'use strict';
  if (global.Sounds && typeof global.Sounds.setBgm === 'function') return;

  const MUTE_KEY = 'dog-yard-mute';
  const AUDIO_BASE = 'assets/audio/';
  const SFX = {
    pet: 'sfx-pet.mp3',
    ui: 'sfx-ui.mp3',
    buy: 'sfx-buy.mp3',
    purchase: 'sfx-purchase.mp3',
    offline: 'sfx-offline.mp3',
    combo: 'sfx-combo.mp3',
    prestige: 'sfx-prestige.mp3',
    reward: 'sfx-reward.mp3',
    error: 'sfx-error.mp3',
  };
  const BGM = {
    yard: 'bg-yard.mp3',
  };
  const SFX_VOL = {
    pet: 0.22,
    ui: 0.16,
    buy: 0.22,
    purchase: 0.24,
    offline: 0.22,
    combo: 0.18,
    prestige: 0.26,
    reward: 0.24,
    error: 0.18,
  };
  const BGM_VOL = 0.16;

  let ctx = null;
  let unlocked = false;
  let muted = false;
  let bgmEl = null;
  let bgmKey = '';
  let wantedBgm = 'yard';
  let bgmStarting = false;
  let energy01 = 1;
  let nextBreathAt = 0;
  let breathPumpId = 0;
  let noiseBuf = null;

  try {
    if (typeof localStorage !== "undefined") {
      muted = localStorage.getItem(MUTE_KEY) === '1';
    }
  } catch (_) {}

  function getCtx() {
    if (muted) return null;
    if (ctx) return ctx;
    try {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      return ctx;
    } catch (_) {
      return null;
    }
  }

  function unlock() {
    if (unlocked) return;
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') {
      c.resume().catch(function () {});
    }
    unlocked = true;
    startBreathPump();
  }

  function tone(freq, dur, type, gainVal, when, slideTo) {
    const c = getCtx();
    if (!c || muted) return;
    try {
      if (c.state === 'suspended') c.resume().catch(function () {});
      const t0 = (when != null ? when : 0) + c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo != null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
      }
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gainVal, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (_) {}
  }

  function noiseBurst(dur, gainVal, when) {
    const c = getCtx();
    if (!c || muted) return;
    try {
      if (c.state === 'suspended') c.resume().catch(function () {});
      const t0 = (when != null ? when : 0) + c.currentTime;
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 900;
      filter.Q.value = 0.8;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gainVal, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(c.destination);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
    } catch (_) {}
  }


  function getPinkBuffer(c) {
    if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
    const len = Math.max(1, Math.floor(c.sampleRate * 1.2));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      d[i] = (b0 + b1 + b2 + w * 0.18) * 0.32;
    }
    noiseBuf = buf;
    return buf;
  }

  function tiredness() {
    const empty = 1 - Math.max(0, Math.min(1, energy01));
    if (empty < 0.18) return 0;
    return Math.pow((empty - 0.18) / 0.82, 1.4);
  }

  function emitPant(c, t0, tired) {
    const buf = getPinkBuffer(c);
    const cycle = 1.75 - tired * 1.38;
    const inhaleDur = Math.max(0.07, cycle * 0.34);
    const exhaleDur = Math.max(0.1, cycle * 0.5);
    const vol = 0.03 + tired * 0.26;
    const rasp = tired;

    function whoosh(start, dur, freq, q, gainVal, oscHz) {
      const src = c.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(freq, start);
      bp.frequency.exponentialRampToValueAtTime(Math.max(80, freq * (0.65 + rasp * 0.15)), start + dur);
      bp.Q.value = q;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainVal), start + dur * 0.28);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      src.connect(bp);
      bp.connect(g);
      g.connect(c.destination);
      src.start(start);
      src.stop(start + dur + 0.02);
      if (oscHz) {
        const osc = c.createOscillator();
        const og = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(oscHz, start);
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, oscHz * 0.72), start + dur);
        og.gain.setValueAtTime(0.0001, start);
        og.gain.exponentialRampToValueAtTime(gainVal * 0.22, start + dur * 0.3);
        og.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(og);
        og.connect(c.destination);
        osc.start(start);
        osc.stop(start + dur + 0.02);
      }
    }

    const inFreq = 980 + rasp * 420;
    const outFreq = 420 - rasp * 140;
    whoosh(t0, inhaleDur, inFreq, 1.1 - rasp * 0.4, vol * (0.55 + rasp * 0.35), 0);
    whoosh(t0 + inhaleDur * 0.72, exhaleDur, outFreq, 0.85, vol, 92 + rasp * 40);
  }

  function pumpBreath() {
    breathPumpId = 0;
    if (muted || !unlocked) return;
    if (typeof document !== 'undefined' && document.hidden) {
      breathPumpId = requestAnimationFrame(pumpBreath);
      return;
    }
    const c = getCtx();
    if (!c) {
      breathPumpId = requestAnimationFrame(pumpBreath);
      return;
    }
    try {
      if (c.state === 'suspended') c.resume().catch(function () {});
      const now = c.currentTime;
      if (!nextBreathAt || nextBreathAt < now - 0.6) nextBreathAt = now + 0.05;
      let n = 0;
      while (nextBreathAt < now + 0.22 && n++ < 4) {
        const tired = tiredness();
        const cycle = tired <= 0 ? 1.7 : (1.75 - tired * 1.38);
        if (tired > 0.01) emitPant(c, nextBreathAt, tired);
        const jitter = tired > 0.82 ? (Math.random() * 0.08 - 0.02) : 0;
        nextBreathAt += Math.max(0.22, cycle + jitter);
      }
    } catch (_) {}
    breathPumpId = requestAnimationFrame(pumpBreath);
  }

  function startBreathPump() {
    if (!breathPumpId) breathPumpId = requestAnimationFrame(pumpBreath);
  }

  function setEnergy(ratio) {
    const r = Number(ratio);
    energy01 = isFinite(r) ? Math.max(0, Math.min(1, r)) : 1;
    if (unlocked && !muted) startBreathPump();
  }

  function playSample(key, fallback) {
    unlock();
    if (muted) return;
    const file = SFX[key];
    if (!file || typeof Audio === 'undefined') {
      if (fallback) fallback();
      return;
    }
    try {
      const a = new Audio(AUDIO_BASE + file);
      a.volume = SFX_VOL[key] != null ? SFX_VOL[key] : 0.4;
      const p = a.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () { if (fallback) fallback(); });
      }
    } catch (_) {
      if (fallback) fallback();
    }
  }

  function stopOtherAudio(keep) {
    try {
      const list = document.querySelectorAll('audio');
      for (let i = 0; i < list.length; i++) {
        if (list[i] !== keep) {
          try { list[i].pause(); } catch (_) {}
        }
      }
    } catch (_) {}
  }

  function ensureBgmEl() {
    if (bgmEl) return bgmEl;
    bgmEl = new Audio();
    bgmEl.loop = true;
    bgmEl.preload = 'auto';
    bgmEl.volume = BGM_VOL;
    bgmEl.setAttribute('playsinline', 'true');
    return bgmEl;
  }

  function applyBgmState() {
    const el = ensureBgmEl();
    if (muted || !unlocked) {
      bgmStarting = false;
      try { el.pause(); } catch (_) {}
      return;
    }
    el.loop = true;
    el.volume = BGM_VOL;
    if (!el.paused && !el.ended && el.currentTime > 0) return;
    if (bgmStarting) return;
    bgmStarting = true;
    stopOtherAudio(el);
    const p = el.play();
    if (p && typeof p.then === 'function') {
      p.then(function () { bgmStarting = false; }).catch(function () { bgmStarting = false; });
    } else {
      bgmStarting = false;
    }
  }

  function setBgm(key) {
    const next = BGM[key] ? key : 'yard';
    wantedBgm = next;
    if (muted) return;
    const el = ensureBgmEl();
    const src = AUDIO_BASE + BGM[next];
    const same = bgmKey === next && el.src && el.src.indexOf(BGM[next]) !== -1;
    if (same) {
      applyBgmState();
      return;
    }
    bgmKey = next;
    try {
      el.pause();
      el.loop = true;
      el.src = src;
      el.volume = BGM_VOL;
      applyBgmState();
    } catch (_) {
      bgmStarting = false;
    }
  }

  function playPet() {
    playSample('pet', function () {
      tone(180, 0.09, 'triangle', 0.12, 0, 110);
      tone(320, 0.07, 'sine', 0.08, 0.04, 220);
      noiseBurst(0.05, 0.035, 0.01);
    });
  }

  function playUi() {
    playSample('ui', function () {
      tone(640, 0.04, 'sine', 0.045, 0);
      tone(820, 0.035, 'triangle', 0.03, 0.025);
    });
  }

  function playBuy() {
    playSample('buy', function () {
      tone(523.25, 0.12, 'sine', 0.1, 0);
      tone(659.25, 0.14, 'sine', 0.09, 0.08);
      tone(783.99, 0.22, 'triangle', 0.08, 0.16);
    });
  }

  function playPurchase() {
    playSample('purchase', function () {
      tone(392, 0.1, 'triangle', 0.09, 0);
      tone(523.25, 0.12, 'sine', 0.1, 0.1);
      tone(659.25, 0.14, 'sine', 0.1, 0.2);
      tone(783.99, 0.18, 'triangle', 0.09, 0.32);
      tone(1046.5, 0.28, 'sine', 0.08, 0.46);
    });
  }

  function playOffline() {
    playSample('offline', function () {
      tone(392, 0.16, 'triangle', 0.09, 0);
      tone(493.88, 0.16, 'triangle', 0.09, 0.12);
      tone(587.33, 0.18, 'sine', 0.1, 0.24);
      tone(784, 0.28, 'sine', 0.11, 0.38);
    });
  }

  function playCombo() {
    playSample('combo', function () {
      tone(880, 0.06, 'sine', 0.07, 0);
      tone(1174.66, 0.08, 'triangle', 0.06, 0.05);
      tone(1396.91, 0.1, 'sine', 0.05, 0.1);
    });
  }

  function playPrestige() {
    playSample('prestige', function () {
      tone(523.25, 0.14, 'triangle', 0.1, 0);
      tone(659.25, 0.14, 'triangle', 0.1, 0.12);
      tone(783.99, 0.16, 'sine', 0.11, 0.24);
      tone(1046.5, 0.32, 'sine', 0.12, 0.4);
      tone(1318.5, 0.22, 'triangle', 0.07, 0.55);
    });
  }

  function playReward() {
    playSample('reward', function () {
      tone(523.25, 0.1, 'sine', 0.09, 0);
      tone(659.25, 0.12, 'triangle', 0.1, 0.1);
      tone(880, 0.16, 'sine', 0.11, 0.22);
      tone(1174.66, 0.22, 'sine', 0.08, 0.36);
    });
  }

  function playError() {
    playSample('error', function () {
      tone(180, 0.1, 'sawtooth', 0.06, 0, 90);
      tone(140, 0.14, 'square', 0.045, 0.08, 70);
      noiseBurst(0.06, 0.025, 0.02);
    });
  }

  function playWalkStart() {}
  function playWalkDone() {}

  function isMuted() { return muted; }

  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (_) {}
    if (muted) {
      bgmStarting = false;
      if (ctx && ctx.state === 'running') {
        try { ctx.suspend().catch(function () {}); } catch (_) {}
      }
      if (bgmEl) {
        try { bgmEl.pause(); } catch (_) {}
      }
      stopOtherAudio(null);
    } else {
      unlock();
      if (ctx && ctx.state === 'suspended') {
        try { ctx.resume().catch(function () {}); } catch (_) {}
      }
      setBgm(wantedBgm || 'yard');
      startBreathPump();
    }
    return muted;
  }

  function toggleMute() { return setMuted(!muted); }

  function bindUnlock() {
    const once = function () {
      unlock();
      if (!muted) setBgm(wantedBgm || 'yard');
      global.removeEventListener('pointerdown', once, true);
      global.removeEventListener('touchstart', once, true);
      global.removeEventListener('keydown', once, true);
    };
    global.addEventListener('pointerdown', once, true);
    global.addEventListener('touchstart', once, true);
    global.addEventListener('keydown', once, true);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bindUnlock);
    } else {
      bindUnlock();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (bgmEl) try { bgmEl.pause(); } catch (_) {}
        bgmStarting = false;
      } else if (!muted && unlocked) {
        applyBgmState();
      }
    });
  }

  global.Sounds = {
    playPet: playPet,
    playUi: playUi,
    playBuy: playBuy,
    playPurchase: playPurchase,
    playOffline: playOffline,
    playCombo: playCombo,
    playPrestige: playPrestige,
    playReward: playReward,
    playError: playError,
    playWalkStart: playWalkStart,
    playWalkDone: playWalkDone,
    setBgm: setBgm,
    setEnergy: setEnergy,
    unlock: unlock,
    isMuted: isMuted,
    setMuted: setMuted,
    toggleMute: toggleMute,
  };
  if (typeof module === 'object' && module.exports) module.exports = global.Sounds;
})(typeof window !== 'undefined' ? window : globalThis);
