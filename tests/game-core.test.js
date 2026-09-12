const assert = require('node:assert/strict');
const core = require('../js/game-core.js');

assert.equal(core.softcapValue(100, 180, 0.5), 100);
assert.equal(core.softcapValue(280, 180, 0.5), 190);
assert.equal(core.softcapValue(-5, 180, 0.5), 0);
assert.equal(core.softcapValue("nope", 180, 0.5), 0);
assert.equal(core.geometricCost(100, 1.25, 0), 100);
assert.equal(core.geometricCost(100, 1.25, 2), 156);
assert.equal(core.geometricCost(100, 0.5, 2), 100);
assert.equal(core.geometricCost(18, 1.22, 1), 21);
assert.equal(core.offlineGain(10, 0.2, 3600, 28800), 7200);
assert.equal(core.offlineGain(10, 0.2, 999999, 28800), 57600);
assert.equal(core.offlineGain(10, 0.2, -1, 28800), 0);
assert.equal(core.offlineGain(10, 1.5, 10, 10), 100);
assert.equal(core.clampProgress(99, 10), 10);
assert.equal(core.clampProgress(-2, 10), 0);
assert.deepEqual(core.normalizeSave({ v: 4, ore: 12 }), { v: 4, ore: 12 });
assert.equal(core.normalizeSave(null), null);
assert.equal(core.normalizeSave([]), null);
const hostile = JSON.parse('{"ore":10,"__proto__":{"polluted":true}}');
const normalized = core.normalizeSave(hostile);
assert.equal(normalized.ore, 10);
assert.equal(Object.prototype.polluted, undefined);
assert.equal(core.walkProgress(0, 1000, 500), 0.5);
assert.equal(core.walkProgress(0, 1000, 2000), 1);
assert.equal(core.walkProgress(0, 1000, -50), 0);
assert.equal(core.finiteOr("x", 7), 7);
assert.equal(core.finiteOr(3, 7), 3);

const filling = [{ type: "earn", target: 100, progress: 90, claimed: false }];
const mid = core.applyTrackedProgress(filling, "earn", 5);
assert.equal(filling[0].progress, 95);
assert.equal(mid.changed, true);
assert.equal(mid.becameReady, false);
const done = core.applyTrackedProgress(filling, "earn", 10);
assert.equal(filling[0].progress, 100);
assert.equal(done.becameReady, true);
const stuck = core.applyTrackedProgress(filling, "earn", 50);
assert.equal(stuck.changed, false);
assert.equal(filling[0].progress, 100);
assert.equal(core.applyTrackedProgress(filling, "clicks", 10).changed, false);
assert.equal(core.applyTrackedProgress(null, "earn", 1).changed, false);

console.log('game-core tests: ok');


// --- save migrations ---
{
  const v1 = core.applyVersionMigrations({ v: 1, ore: 50 }, 8, { energyMaxBase: 100 });
  assert.equal(v1.v, 8);
  assert.equal(v1.selectedBreed, 'lab');
  assert.ok(Array.isArray(v1.unlockedBreeds) && v1.unlockedBreeds.indexOf('lab') !== -1);
  assert.equal(v1.selectedYard, 'sunny');
  assert.equal(v1.inventory.boneBoost, 0);
  assert.ok(Array.isArray(v1.stickers));
  assert.equal(v1.energy, 100);
  assert.equal(v1.yardStage, 1);
  assert.ok(v1.levelsCards && typeof v1.levelsCards === 'object');
  assert.ok(v1.levelsTraining && typeof v1.levelsTraining === 'object');
  assert.equal(v1.stats.lifetimeBones, 50);
}

{
  const v4 = core.applyVersionMigrations({ v: 4, ore: 10, energy: 40 }, 8, { energyMaxBase: 120 });
  assert.equal(v4.v, 8);
  assert.equal(v4.energy, 40);
  assert.equal(v4.yardStage, 1);
  assert.equal(v4.cardComboClaimed, false);
}

{
  const hostile = JSON.parse('{"v":1,"ore":3,"__proto__":{"x":1}}');
  const cleaned = core.applyVersionMigrations(hostile, 8, { energyMaxBase: 100 });
  assert.equal(cleaned.ore, 3);
  assert.equal(Object.prototype.x, undefined);
}

assert.equal(core.applyVersionMigrations(null, 8), null);
assert.equal(core.applyVersionMigrations([], 8), null);

console.log('game-core migration tests: ok');
