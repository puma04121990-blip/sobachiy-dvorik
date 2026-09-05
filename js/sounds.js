/**
 * Web Audio synthesizer — no external MP3.
 * Mute flag persisted in localStorage (`dog-yard-mute`).
 */
(function (global) {
  'use strict';

  const MUTE_KEY = 'dog-yard-mute';

  let ctx = null;
  let unlocked = false;
  let muted = false;

  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
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

  function playPet() {
    unlock();
    tone(180, 0.09, 'triangle', 0.12, 0, 110);
    tone(320, 0.07, 'sine', 0.08, 0.04, 220);
    noiseBurst(0.05, 0.035, 0.01);
  }

  function playUi() {
    unlock();
    tone(640, 0.04, 'sine', 0.045, 0);
    tone(820, 0.035, 'triangle', 0.03, 0.025);
  }

  function playBuy() {
    unlock();
    tone(523.25, 0.12, 'sine', 0.1, 0);
    tone(659.25, 0.14, 'sine', 0.09, 0.08);
    tone(783.99, 0.22, 'triangle', 0.08, 0.16);
  }

  function playPurchase() {
    unlock();
    tone(392, 0.1, 'triangle', 0.09, 0);
    tone(523.25, 0.12, 'sine', 0.1, 0.1);
    tone(659.25, 0.14, 'sine', 0.1, 0.2);
    tone(783.99, 0.18, 'triangle', 0.09, 0.32);
    tone(1046.5, 0.28, 'sine', 0.08, 0.46);
  }

  function playOffline() {
    unlock();
    tone(392, 0.16, 'triangle', 0.09, 0);
    tone(493.88, 0.16, 'triangle', 0.09, 0.12);
    tone(587.33, 0.18, 'sine', 0.1, 0.24);
    tone(784, 0.28, 'sine', 0.11, 0.38);
  }

  function playCombo() {
    unlock();
    tone(880, 0.06, 'sine', 0.07, 0);
    tone(1174.66, 0.08, 'triangle', 0.06, 0.05);
    tone(1396.91, 0.1, 'sine', 0.05, 0.1);
  }

  function playPrestige() {
    unlock();
    tone(523.25, 0.14, 'triangle', 0.1, 0);
    tone(659.25, 0.14, 'triangle', 0.1, 0.12);
    tone(783.99, 0.16, 'sine', 0.11, 0.24);
    tone(1046.5, 0.32, 'sine', 0.12, 0.4);
    tone(1318.5, 0.22, 'triangle', 0.07, 0.55);
  }

  function playReward() {
    unlock();
    tone(523.25, 0.1, 'sine', 0.09, 0);
    tone(659.25, 0.12, 'triangle', 0.1, 0.1);
    tone(880, 0.16, 'sine', 0.11, 0.22);
    tone(1174.66, 0.22, 'sine', 0.08, 0.36);
  }

  function playError() {
    unlock();
    tone(180, 0.1, 'sawtooth', 0.06, 0, 90);
    tone(140, 0.14, 'square', 0.045, 0.08, 70);
    noiseBurst(0.06, 0.025, 0.02);
  }

  function isMuted() { return muted; }

  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (_) {}
    if (muted) {
      if (ctx && ctx.state === 'running') {
        try { ctx.suspend().catch(function () {}); } catch (_) {}
      }
    } else {
      // Unmute: allow context creation again even if a prior AC() failed
      unlock();
      if (ctx && ctx.state === 'suspended') {
        try { ctx.resume().catch(function () {}); } catch (_) {}
      }
    }
    return muted;
  }

  function toggleMute() { return setMuted(!muted); }

  function bindUnlock() {
    const once = function () {
      unlock();
      global.removeEventListener('pointerdown', once, true);
      global.removeEventListener('touchstart', once, true);
      global.removeEventListener('keydown', once, true);
    };
    global.addEventListener('pointerdown', once, true);
    global.addEventListener('touchstart', once, true);
    global.addEventListener('keydown', once, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindUnlock);
  } else {
    bindUnlock();
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
    unlock: unlock,
    isMuted: isMuted,
    setMuted: setMuted,
    toggleMute: toggleMute,
  };
})(typeof window !== 'undefined' ? window : globalThis);
