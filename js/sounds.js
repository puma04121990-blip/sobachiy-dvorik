/**
 * Web Audio synthesizer — no external MP3.
 * Mute-safe if AudioContext is blocked.
 */
(function (global) {
  'use strict';

  let ctx = null;
  let unlocked = false;
  let muted = false;

  function getCtx() {
    if (muted) return null;
    if (ctx) return ctx;
    try {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      return ctx;
    } catch (_) {
      muted = true;
      return null;
    }
  }

  function unlock() {
    if (unlocked) return;
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') {
      c.resume().catch(function () { muted = true; });
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

  /** Soft woof / boop on pet click */
  function playPet() {
    unlock();
    tone(180, 0.09, 'triangle', 0.12, 0, 110);
    tone(320, 0.07, 'sine', 0.08, 0.04, 220);
    noiseBurst(0.05, 0.035, 0.01);
  }

  /** Pleasant chime on successful purchase */
  function playBuy() {
    unlock();
    tone(523.25, 0.12, 'sine', 0.1, 0);
    tone(659.25, 0.14, 'sine', 0.09, 0.08);
    tone(783.99, 0.22, 'triangle', 0.08, 0.16);
  }

  /** Soft fanfare for offline claim */
  function playOffline() {
    unlock();
    tone(392, 0.16, 'triangle', 0.09, 0);
    tone(493.88, 0.16, 'triangle', 0.09, 0.12);
    tone(587.33, 0.18, 'sine', 0.1, 0.24);
    tone(784, 0.28, 'sine', 0.11, 0.38);
  }

  /** Short sparkle for combo milestone */
  function playCombo() {
    unlock();
    tone(880, 0.06, 'sine', 0.07, 0);
    tone(1174.66, 0.08, 'triangle', 0.06, 0.05);
    tone(1396.91, 0.1, 'sine', 0.05, 0.1);
  }

  /** Prestige / exhibition fanfare */
  function playPrestige() {
    unlock();
    tone(523.25, 0.14, 'triangle', 0.1, 0);
    tone(659.25, 0.14, 'triangle', 0.1, 0.12);
    tone(783.99, 0.16, 'sine', 0.11, 0.24);
    tone(1046.5, 0.32, 'sine', 0.12, 0.4);
    tone(1318.5, 0.22, 'triangle', 0.07, 0.55);
  }

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
    playBuy: playBuy,
    playOffline: playOffline,
    playCombo: playCombo,
    playPrestige: playPrestige,
    unlock: unlock
  };
})(typeof window !== 'undefined' ? window : globalThis);
