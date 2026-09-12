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


function applyVersionMigrations(data, targetVersion, options) {
  options = options || {};
  const energyMax = Math.max(1, finiteOr(options.energyMaxBase, 100));
  const normalized = normalizeSave(data);
  if (!normalized) return null;
  const out = normalized;
  const ver = Number(out.v) || 1;
  const target = Math.max(1, Math.floor(finiteOr(targetVersion, ver)));

  if (ver < 2) {
    out.prestigeLevel = Number(out.prestigeLevel) || 0;
    out.medals = Number(out.medals) || 0;
    out.selectedBreed = out.selectedBreed || 'lab';
    out.unlockedBreeds = Array.isArray(out.unlockedBreeds) ? out.unlockedBreeds : ['lab'];
    if (out.unlockedBreeds.indexOf('lab') === -1) out.unlockedBreeds.unshift('lab');
    out.stats = out.stats || {};
    out.stats.totalClicks = Number(out.stats.totalClicks) || 0;
    out.stats.lifetimeBones = Number(out.stats.lifetimeBones) || Number(out.ore) || 0;
    out.stats.upgradesBought = Number(out.stats.upgradesBought) || 0;
    out.achievementsClaimed = out.achievementsClaimed || {};
    out.quests = Array.isArray(out.quests) ? out.quests : [];
    out.questDaySeed = out.questDaySeed || '';
    out.joyUntil = Number(out.joyUntil) || 0;
    out.joyReadyAt = Number(out.joyReadyAt) || 0;
  }
  if (ver < 3) {
    out.selectedYard = out.selectedYard || 'sunny';
    out.unlockedYards = Array.isArray(out.unlockedYards) ? out.unlockedYards : ['sunny'];
    if (out.unlockedYards.indexOf('sunny') === -1) out.unlockedYards.unshift('sunny');
    out.inventory = out.inventory || { boneBoost: 0 };
    if (out.inventory.boneBoost == null) out.inventory.boneBoost = 0;
    out.activeItem = out.activeItem || null;
    out.storyRead = out.storyRead || {};
    out.stats = out.stats || {};
    out.stats.eventsDone = Number(out.stats.eventsDone) || 0;
    out.nextEventAt = Number(out.nextEventAt) || 0;
    out.eventReadyType = out.eventReadyType || null;
  }
  if (ver < 4) {
    out.stickers = Array.isArray(out.stickers) ? out.stickers : [];
    out.stickerSetsClaimed = (out.stickerSetsClaimed && typeof out.stickerSetsClaimed === 'object' && !Array.isArray(out.stickerSetsClaimed)) ? out.stickerSetsClaimed : {};
    out.unlockedFriends = Array.isArray(out.unlockedFriends) ? out.unlockedFriends : [];
    out.activeFriend = out.activeFriend || null;
    const ac = Number(out.acorns);
    out.acorns = isFinite(ac) && ac > 0 ? ac : 0;
    out.seasonBoostUntil = Number(out.seasonBoostUntil) || 0;
    if (!isFinite(out.seasonBoostUntil)) out.seasonBoostUntil = 0;
    out.seasonPurchases = (out.seasonPurchases && typeof out.seasonPurchases === 'object' && !Array.isArray(out.seasonPurchases)) ? out.seasonPurchases : {};
    out.unlockedYards = Array.isArray(out.unlockedYards) ? out.unlockedYards : ['sunny'];
  }
  if (ver < 5) {
    out.medalUpgrades = (out.medalUpgrades && typeof out.medalUpgrades === 'object' && !Array.isArray(out.medalUpgrades)) ? out.medalUpgrades : {};
    out.energy = isFinite(Number(out.energy)) ? Number(out.energy) : energyMax;
    out.energyRestReadyAt = Number(out.energyRestReadyAt) || 0;
    out.activeWalk = out.activeWalk && typeof out.activeWalk === 'object' ? out.activeWalk : null;
    out.yardStage = Math.max(1, Number(out.yardStage) || 1);
    out.dailyGoals = Array.isArray(out.dailyGoals) ? out.dailyGoals : [];
    out.dailyDayKey = out.dailyDayKey || '';
    out.dailyStreak = Number(out.dailyStreak) || 0;
    out.dailyLastClearDay = out.dailyLastClearDay || '';
    out.questStreak = Number(out.questStreak) || 0;
    out.questLastClearDay = out.questLastClearDay || '';
    out.questClaimsToday = Number(out.questClaimsToday) || 0;
    out.stats = out.stats || {};
    out.stats.walksDone = Number(out.stats.walksDone) || 0;
  }
  // v6–v8: pack/training/card defaults are applied by the game layer; bump marker only.
  if (ver < 6) {
    out.packPaid = (out.packPaid && typeof out.packPaid === 'object' && !Array.isArray(out.packPaid)) ? out.packPaid : {};
    out.packUnlocked = (out.packUnlocked && typeof out.packUnlocked === 'object' && !Array.isArray(out.packUnlocked)) ? out.packUnlocked : {};
  }
  if (ver < 7) {
    out.levelsTraining = (out.levelsTraining && typeof out.levelsTraining === 'object' && !Array.isArray(out.levelsTraining)) ? out.levelsTraining : {};
  }
  if (ver < 8) {
    out.levelsCards = (out.levelsCards && typeof out.levelsCards === 'object' && !Array.isArray(out.levelsCards)) ? out.levelsCards : {};
    out.cardComboDay = out.cardComboDay || '';
    out.cardComboHits = (out.cardComboHits && typeof out.cardComboHits === 'object' && !Array.isArray(out.cardComboHits)) ? out.cardComboHits : {};
    out.cardComboClaimed = !!out.cardComboClaimed;
  }

  out.v = target;
  return out;
}

  return { finiteOr, softcapValue, geometricCost, offlineGain, clampProgress, normalizeSave, walkProgress, applyTrackedProgress, applyVersionMigrations };
});
