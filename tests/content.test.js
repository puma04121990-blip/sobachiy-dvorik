const assert = require('node:assert/strict');
const Game = require('../js/content.js');

assert.equal(Game.UPGRADE_ORDER.length, Object.keys(Game.UPGRADES).length);
assert.equal(Game.defaultLevels().pickaxe, 0);
assert.equal(Game.TRAINING_ORDER.length, Game.TRAINING.length);
assert.equal(Game.defaultTrainingLevels().sit, 0);
assert.equal(Game.BREED_COUNT, Object.keys(Game.BREEDS).length);
assert.equal(Game.BREEDS.lab.startUnlocked, true);
assert.equal(Game.WALK_TIERS.length, 3);
assert.equal(Game.YARD_STAGES[0].level, 1);
assert.equal(Game.fmtStatic(1500), '1.50K');
assert.equal(Game.fmtStatic(12), '12');
assert.ok(Game.BREEDS.lab.src.indexOf('assets/') === 0);
assert.equal(Game.EVENT_MIN_MS, 90 * 1000);
assert.equal(Game.SAVE_VERSION, 5);

console.log('content tests: ok');
