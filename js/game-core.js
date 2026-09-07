(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GameCore = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

function finiteOr(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function softcapValue(value, softcap, power) {
  const v = finiteOr(value, 0);
  const soft = Math.max(0, finiteOr(softcap, 0));
  const p = Math.max(0, finiteOr(power, 1));
  if (v <= soft) return Math.max(0, v);
  return soft + Math.pow(v - soft, p);
}

function geometricCost(base, multiplier, level) {
  const b = Math.max(0, finiteOr(base, 0));
  const m = Math.max(1, finiteOr(multiplier, 1));
  const l = Math.max(0, Math.floor(finiteOr(level, 0)));
  return Math.floor(b * Math.pow(m, l));
}

function offlineGain(rate, efficiency, elapsedSeconds, capSeconds) {
  const r = Math.max(0, finiteOr(rate, 0));
  const e = Math.min(1, Math.max(0, finiteOr(efficiency, 0)));
  const elapsed = Math.min(Math.max(0, finiteOr(elapsedSeconds, 0)), Math.max(0, finiteOr(capSeconds, 0)));
  return r * e * elapsed;
}

function clampProgress(progress, target) {
  const t = Math.max(1, finiteOr(target, 1));
  return Math.min(t, Math.max(0, finiteOr(progress, 0)));
}

function normalizeSave(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = {};
  Object.keys(value).forEach(function (key) {
    if (key !== "__proto__" && key !== "constructor" && key !== "prototype") result[key] = value[key];
  });
  return result;
}

function walkProgress(startedAt, endsAt, now) {
  const start = finiteOr(startedAt, 0);
  const end = finiteOr(endsAt, 0);
  const t = finiteOr(now, Date.now());
  const total = Math.max(1, end - start);
  return Math.max(0, Math.min(1, (t - start) / total));
}

function applyTrackedProgress(items, type, amount) {
  let changed = false;
  let becameReady = false;
  if (!Array.isArray(items)) return { changed: false, becameReady: false };
  const add = finiteOr(amount, 0);
  if (add <= 0) return { changed: false, becameReady: false };
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || item.claimed || item.type !== type) continue;
    const target = Math.max(0, finiteOr(item.target, 0));
    const prev = Math.max(0, finiteOr(item.progress, 0));
    if (prev >= target) continue;
    const next = Math.min(target, prev + add);
    if (next === prev) continue;
    item.progress = next;
    changed = true;
    if (next >= target) becameReady = true;
  }
  return { changed: changed, becameReady: becameReady };
}

  return { finiteOr, softcapValue, geometricCost, offlineGain, clampProgress, normalizeSave, walkProgress, applyTrackedProgress };
});
