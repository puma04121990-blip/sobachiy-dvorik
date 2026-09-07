const assert = require('node:assert/strict');
const Game = require('../js/content.js');

assert.equal(Game.UPGRADE_ORDER.length, Object.keys(Game.UPGRADES).length);
assert.equal(Game.SHOP_CATS.join(','), 'paws,tails,cozy');
{
  const shopIds = [];
  Game.SHOP_CATS.forEach(function (cat) {
    const ids = Game.SHOP_CAT_IDS[cat];
    assert.ok(ids && ids.length, cat + ' shelf');
    ids.forEach(function (id) {
      assert.ok(Game.UPGRADES[id], id + ' on ' + cat);
      assert.ok(shopIds.indexOf(id) === -1, id + ' unique');
      shopIds.push(id);
    });
  });
  assert.equal(shopIds.length, Game.UPGRADE_ORDER.length);
}
assert.equal(Game.defaultLevels().pickaxe, 0);
assert.equal(Game.TRAINING_ORDER.length, Game.TRAINING.length);
assert.equal(Game.defaultTrainingLevels().sit, 0);
Game.TRAINING.forEach(function (t) {
  assert.ok(t.id && t.baseCost > 0, t.id + ' training');
});
assert.equal(Game.SKILL_CARDS.length, 18);
assert.equal(Game.CARD_CATS.join(','), 'crew,district,special');
assert.equal(Game.defaultCardLevels().neighbor, 0);
assert.equal(Game.SKILL_CARD_IDS.length, Game.SKILL_CARDS.length);
Game.SKILL_CARDS.forEach(function (c) {
  assert.ok(Game.CARD_CATS.indexOf(c.cat) !== -1, c.id + ' cat');
  assert.ok(c.orePerSec > 0, c.id + ' income');
  assert.equal(c.maxLevel, 20, c.id + ' max');
  const need = Array.isArray(c.unlock && c.unlock.need) ? c.unlock.need : (c.unlock ? [c.unlock] : []);
  need.forEach(function (n) {
    if (n.cardId) assert.ok(Game.SKILL_CARDS_BY_ID[n.cardId], c.id + ' needs ' + n.cardId);
    if (n.upgradeId) assert.ok(Game.UPGRADES[n.upgradeId], c.id + ' needs upgrade ' + n.upgradeId);
  });
});
Game.CARD_CATS.forEach(function (cat) {
  const row = Game.SKILL_CARDS.filter(function (c) { return c.cat === cat; });
  for (let i = 1; i < row.length; i++) {
    assert.ok(row[i].orePerSec > row[i - 1].orePerSec, cat + ' income climbs');
    const pbPrev = row[i - 1].baseCost / row[i - 1].orePerSec;
    const pb = row[i].baseCost / row[i].orePerSec;
    assert.ok(pb < 25 * 60, row[i].id + ' first-buy payback');
    assert.ok(pb / pbPrev < 2.2, row[i].id + ' payback does not explode');
  }
});
assert.equal(Game.CARD_MAX_LEVEL, 20);
assert.equal(Game.IDLE_SOFTCAP, 0);
assert.equal(Game.BREED_COUNT, Object.keys(Game.BREEDS).length);
assert.equal(Game.BREEDS.lab.startUnlocked, true);
assert.equal(Game.WALK_TIERS.length, 3);
assert.equal(Game.YARD_STAGES[0].level, 1);
assert.equal(Game.fmtStatic(1500), '1.50K');
assert.equal(Game.fmtStatic(12), '12');
assert.ok(Game.BREEDS.lab.src.indexOf('assets/') === 0);
assert.equal(Game.EVENT_MIN_MS, 90 * 1000);
assert.equal(Game.SAVE_VERSION, 7);
assert.equal(Game.PACK_BRANCHES.length, 3);
assert.deepEqual(Game.defaultPackUnlocks(), { crew: false, district: false, special: false });
Game.PACK_BRANCHES.forEach(function (b) {
  const p = Game.GP_PRODUCTS.find(function (x) { return x.tag === b.tag; });
  assert.ok(p, b.tag + ' product');
  assert.equal(p.kind, 'permanent');
  assert.equal(p.packCat, b.id);
  const r = Game.packBranchReward(b.id);
  assert.equal(r.count, 6, b.id + ' cards');
  assert.ok(r.maxIdle > 2000, b.id + ' max idle visible');
});
assert.ok(Game.packBranchReward('special').maxIdle > Game.packBranchReward('district').maxIdle);
assert.ok(Game.packBranchReward('district').maxIdle > Game.packBranchReward('crew').maxIdle);

console.log('content tests: ok');
