(function () {
  'use strict';
  const Game = typeof window !== 'undefined' ? window.GameContent : null;
  if (!Game) {
    console.error('[dvorik] GameContent missing — load js/content.js first');
    return;
  }

/**
 * Собачий дворик — idle/clicker (cute dogs theme) · content pack v5 (retention)
 *
 * ——— BALANCE CONSTANTS (документация) ———
 * Hamster-style cards: linear +X/sec per level, geometric cost, max 20.
 * Later cards in a tree pay more; first-buy payback stays ~3–12 min.
 * Shop is early click + small helpers; cards are the idle engine.
 * No idle softcap. Click softcap is a gentle curve @400 / 0.7.
 * Prestige 2e8 × 2.2^level. Medals +2%/medal + shop in Выставка.
 */
function startGame() {
  'use strict';
  const cleanups = [];
  let destroyed = false;
  let rafTick = 0;
  let rafShop = 0;
  let autosaveTimer = 0;
  let statusTimer = 0;
  let saveTimer = 0;
  let ready = false;
  let lastHudAt = 0;
  let lastShopSign = '';
  let hiddenAt = 0;

  const {
    AUTOSAVE_MS, OFFLINE_CAP_SEC, OFFLINE_BED_BONUS_SEC, OFFLINE_BASE_EFF,
    AD_BOOST_MULT, AD_BOOST_DURATION_MS, SAVE_KEY, LEGACY_SAVE_KEY, SAVE_VERSION,
    SEASON_FORCE, ACORN_PER_CLICK, ACORN_EVENT_BASE, SEASON_BOOST_MULT, SEASON_BOOST_MS,
    HIDE_TRIES, RACE_DURATION_MS, RACE_DECAY_PER_SEC, RACE_TAP_GAIN,
    COMBO_WINDOW_MS, COMBO_MAX, COMBO_STEP, COMBO_DECAY_PER_SEC, WHISTLE_COMBO_MS,
    JOY_MULT, JOY_DURATION_MS, JOY_COOLDOWN_MS,
    PRESTIGE_REQ_BASE, PRESTIGE_REQ_SCALE, PRESTIGE_MEDAL_INCOME, BASE_CLICK, VIP_INCOME_MULT,
    CLICK_SOFTCAP, IDLE_SOFTCAP, SOFTCAP_POWER, CARD_MAX_LEVEL,
    ENERGY_MAX_BASE, ENERGY_PER_CLICK, ENERGY_REGEN_PER_SEC, ENERGY_TIRED_MULT,
    ENERGY_REST_GAIN, ENERGY_REST_COOLDOWN_MS,
    EVENT_MIN_MS, EVENT_MAX_MS, TOY_DURATION_MS, TOY_REWARD_PER_TAP, EVENT_REWARD_MULT,
    UPGRADES, UPGRADE_ORDER, SHOP_CATS, SHOP_CAT_IDS, TRAINING, TRAINING_ORDER, BREEDS, BREED_COUNT,
    YARDS, FRIENDS, STICKERS, STICKER_SETS, SEASON_SHOP, GP_PRODUCTS, CONSUMABLES,
    ACHIEVEMENTS, STORY, QUEST_POOL, MEDAL_SHOP, WALK_TIERS, YARD_STAGES, DAILY_GOAL_POOL,
    CARD_CATS, SKILL_CARDS, SKILL_CARD_IDS, SKILL_CARDS_BY_ID,
    PACK_BRANCHES, PACK_BRANCH_BY_ID, packBranchReward, packStarterId, isPackStarterCard, defaultPackUnlocks,
    defaultLevels, defaultTrainingLevels, defaultCardLevels, fmtStatic,
  } = Game;

  const state = {
    ore: 0,
    levels: defaultLevels(),
    levelsTraining: defaultTrainingLevels(),
    levelsCards: defaultCardLevels(),
    packUnlocked: defaultPackUnlocks(),
    packPaid: defaultPackUnlocks(),
    lastSaveAt: Date.now(),
    adBoostUntil: 0,
    pendingClickMult: 1,
    prestigeLevel: 0,
    medals: 0,
    medalUpgrades: {},
    selectedBreed: 'lab',
    unlockedBreeds: ['lab'],
    selectedYard: 'sunny',
    unlockedYards: ['sunny'],
    stats: { totalClicks: 0, lifetimeBones: 0, upgradesBought: 0, eventsDone: 0, walksDone: 0 },
    achievementsClaimed: {},
    quests: [],
    questDaySeed: '',
    questStreak: 0,
    questLastClearDay: '',
    joyUntil: 0,
    joyReadyAt: 0,
    combo: 1,
    lastClickAt: 0,
    inventory: { boneBoost: 0 },
    activeItem: null,
    storyRead: {},
    nextEventAt: 0,
    eventReadyType: null,
    stickers: [],
    stickerSetsClaimed: {},
    unlockedFriends: [],
    activeFriend: null,
    acorns: 0,
    seasonBoostUntil: 0,
    seasonPurchases: {},
    noAds: false,
    vipTreats: false,
    energy: ENERGY_MAX_BASE,
    energyRestReadyAt: 0,
    activeWalk: null,
    yardStage: 1,
    dailyGoals: [],
    dailyDayKey: '',
    dailyStreak: 0,
    dailyLastClearDay: '',
    cardComboDay: '',
    cardComboHits: {},
    cardComboClaimed: false,
  };

  let lastTick = performance.now();
  let toastTimer = null;
  let activeTab = 'shop';
  let activeCardCat = 'crew';
  let activeShopCat = 'paws';
  let lastComboMilestone = 1;
  let toyActive = false;
  let toyTaps = 0;
  let toyEndsAt = 0;
  let toyRaf = null;
  let trainActive = false;
  let trainSeq = [];
  let trainIndex = 0;
  let trainShowing = false;
  let storyPlaying = null;
  let storyLineIndex = 0;
  let hideActive = false;
  let hideBoneIndex = 0;
  let hideTriesLeft = HIDE_TRIES;
  let hideCardCount = 4;
  let raceActive = false;
  let raceEndsAt = 0;
  let raceFill = 0;
  let raceRaf = null;
  let raceLastTap = 0;

  function getBreed() { return BREEDS[state.selectedBreed] || BREEDS.lab; }
  function getYard() { return YARDS[state.selectedYard] || YARDS.sunny; }
  function getFriend() { return state.activeFriend && FRIENDS[state.activeFriend] ? FRIENDS[state.activeFriend] : null; }
  function isSeasonActive() {
    if (SEASON_FORCE) return true;
    const m = new Date().getMonth(); // 0-based; Sep=8 Oct=9 Nov=10
    return m >= 8 && m <= 10;
  }
  function hasSticker(id) { return (state.stickers || []).indexOf(id) !== -1; }
  function grantSticker(id, silent) {
    if (!id || hasSticker(id)) return false;
    if (!STICKERS.some(function (x) { return x.id === id; })) return false;
    state.stickers.push(id);
    if (!silent) {
      const st = STICKERS.find(function (x) { return x.id === id; });
      showToast(tr('sticker_got', { icon: (st && st.icon) || '', name: locn(st) || id }));
      if (window.Sounds) window.Sounds.playBuy();
    }
    maybeGrantLeafSticker();
    if (activeTab === 'album') renderAlbum();
    return true;
  }
  function maybeGrantLeafSticker() {
    const ac = isFinite(state.acorns) ? state.acorns : 0;
    if (isSeasonActive() && ac >= 3) grantSticker('leaf', true);
  }
  function softcapValue(v, soft, power) {
    if (window.GameCore && window.GameCore.softcapValue) return window.GameCore.softcapValue(v, soft, power);
    if (!isFinite(v) || v <= soft) return Math.max(0, v || 0);
    return soft + Math.pow(v - soft, power);
  }
  function getMedalLevel(id) {
    const n = Number((state.medalUpgrades || {})[id]);
    return isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  function getMedalShopMult(key) {
    let m = 1;
    MEDAL_SHOP.forEach(function (item) {
      const lvl = getMedalLevel(item.id);
      if (!lvl) return;
      if (key === 'click' && item.clickMult) m += lvl * item.clickMult;
      if (key === 'idle' && item.idleMult) m += lvl * item.idleMult;
    });
    return m;
  }
  function getMedalOfflineBonus() {
    let b = 0;
    MEDAL_SHOP.forEach(function (item) {
      if (item.offlineBonus) b += getMedalLevel(item.id) * item.offlineBonus;
    });
    return b;
  }
  function getEnergyMax() {
    let max = ENERGY_MAX_BASE;
    MEDAL_SHOP.forEach(function (item) {
      if (item.energyMax) max += getMedalLevel(item.id) * item.energyMax;
    });
    return max;
  }
  function getEnergyRegen() {
    let r = ENERGY_REGEN_PER_SEC;
    MEDAL_SHOP.forEach(function (item) {
      if (item.energyRegen) r *= 1 + getMedalLevel(item.id) * item.energyRegen;
    });
    r *= 1 + getTrainingSum('energyRegen');
    return r;
  }
  function getYardStageMult() {
    const st = YARD_STAGES.find(function (x) { return x.level === (state.yardStage || 1); });
    return (st && st.incomeMult) || 1;
  }
  function getPrestigeRequirement() {
    const lvl = Math.max(0, Number(state.prestigeLevel) || 0);
    return Math.floor(PRESTIGE_REQ_BASE * Math.pow(PRESTIGE_REQ_SCALE, lvl));
  }
  function getPrestigeMult() {
    const m = Number(state.medals);
    return 1 + (isFinite(m) ? m : 0) * PRESTIGE_MEDAL_INCOME;
  }
  function getVipMult() { return state.vipTreats ? VIP_INCOME_MULT : 1; }
  function getWhistleBonus() { return (state.levels.whistle || 0) * WHISTLE_COMBO_MS; }
  function getTrainingSum(field) {
    let s = 0;
    for (let i = 0; i < TRAINING.length; i++) {
      const t = TRAINING[i];
      s += (state.levelsTraining[t.id] || 0) * (t[field] || 0);
    }
    return s;
  }
  function getTrainingAllIncomeMult() {
    return 1 + getTrainingSum('allIncome');
  }
  function isPackCatOwned(cat) {
    return !!(state.packUnlocked && state.packUnlocked[cat]);
  }
  function grantPackCat(cat) {
    if (!state.packUnlocked) state.packUnlocked = defaultPackUnlocks();
    if (!state.packPaid) state.packPaid = defaultPackUnlocks();
    if (CARD_CATS.indexOf(cat) === -1) return;
    state.packUnlocked[cat] = true;
    state.packPaid[cat] = true;
  }
  function packHasPaidProgress(cat, levels, paid) {
    if (paid && paid[cat]) return true;
    const src = levels || {};
    for (let i = 0; i < SKILL_CARDS.length; i++) {
      const c = SKILL_CARDS[i];
      if (c.cat !== cat || isPackStarterCard(c)) continue;
      if ((Number(src[c.id]) || 0) > 0) return true;
    }
    return false;
  }
  function grandfatherPackUnlocks() {
    if (!state.packUnlocked) state.packUnlocked = defaultPackUnlocks();
    if (!state.packPaid) state.packPaid = defaultPackUnlocks();
    CARD_CATS.forEach(function (cat) {
      state.packUnlocked[cat] = !!(state.packPaid[cat] || packHasPaidProgress(cat, state.levelsCards, state.packPaid));
    });
  }
  function packProductByCat(cat) {
    return GP_PRODUCTS.find(function (p) { return p.packCat === cat; }) || null;
  }
  let gpPriceByTag = {};
  function packPriceLabel(tag) {
    if (tag && gpPriceByTag[tag]) return '💎 ' + gpPriceByTag[tag];
    return tr('pack_buy');
  }
  function getCardSum(field) {
    let s = 0;
    for (let i = 0; i < SKILL_CARDS.length; i++) {
      const c = SKILL_CARDS[i];
      if (!isPackStarterCard(c) && !isPackCatOwned(c.cat)) continue;
      s += (state.levelsCards[c.id] || 0) * (c[field] || 0);
    }
    return s;
  }
  function getCardOrePerSec() {
    return getCardSum('orePerSec');
  }
  function getComboWindow() {
    return COMBO_WINDOW_MS + (getBreed().bonuses.comboWindowBonus || 0) + getWhistleBonus() + getTrainingSum('comboBonusMs');
  }
  function getItemMult() {
    if (state.activeItem && Date.now() < state.activeItem.until) {
      const c = CONSUMABLES[state.activeItem.id];
      return (c && c.mult) || 1;
    }
    return 1;
  }
  function getClickPctMult() {
    let m = 1;
    for (const u of Object.values(UPGRADES)) m += (state.levels[u.id] || 0) * (u.clickPct || 0);
    m += getTrainingSum('clickPct');
    m += getCardSum('clickPct');
    return m;
  }
  function getEnergyClickMult() {
    const e = isFinite(state.energy) ? state.energy : 0;
    if (e <= 0.05) return ENERGY_TIRED_MULT;
    if (e < 15) return ENERGY_TIRED_MULT + (1 - ENERGY_TIRED_MULT) * (e / 15);
    return 1;
  }
  function getClickPower() {
    let p = BASE_CLICK;
    for (const u of Object.values(UPGRADES)) p += (state.levels[u.id] || 0) * u.clickPower;
    p = softcapValue(p, CLICK_SOFTCAP, SOFTCAP_POWER);
    p *= getClickPctMult();
    p *= getBreed().bonuses.clickMult || 1;
    const fr = getFriend();
    if (fr) p *= fr.bonuses.clickMult || 1;
    p *= getPrestigeMult();
    p *= getMedalShopMult('click');
    p *= getYardStageMult();
    p *= getVipMult();
    p *= Math.min(COMBO_MAX, Math.max(1, state.combo));
    if (Date.now() < state.joyUntil) p *= JOY_MULT;
    p *= getItemMult();
    if (Date.now() < (state.seasonBoostUntil || 0)) p *= SEASON_BOOST_MULT;
    p *= getEnergyClickMult();
    p *= getTrainingAllIncomeMult();
    if (!isFinite(p) || p < 0) return BASE_CLICK * ENERGY_TIRED_MULT;
    return p;
  }
  function getIdleMult() {
    let m = 1;
    for (const u of Object.values(UPGRADES)) m += (state.levels[u.id] || 0) * u.idleMult;
    m += getTrainingSum('idleMult');
    m *= getBreed().bonuses.idleMult || 1;
    const fr = getFriend();
    if (fr) m *= fr.bonuses.idleMult || 1;
    m *= getPrestigeMult();
    m *= getMedalShopMult('idle');
    m *= getYardStageMult();
    m *= getVipMult();
    m *= getTrainingAllIncomeMult();
    if (Date.now() < state.adBoostUntil) m *= AD_BOOST_MULT;
    m *= getItemMult();
    if (Date.now() < (state.seasonBoostUntil || 0)) m *= SEASON_BOOST_MULT;
    if (!isFinite(m) || m < 0) return 1;
    return m;
  }
  function getOrePerSec() {
    let r = 0;
    for (const u of Object.values(UPGRADES)) r += (state.levels[u.id] || 0) * u.orePerSec;
    r += getCardOrePerSec();
    const out = r * getIdleMult();
    return isFinite(out) && out > 0 ? out : 0;
  }
  function getOfflineCapSec() {
    return OFFLINE_CAP_SEC + (state.levels.bed || 0) * OFFLINE_BED_BONUS_SEC;
  }
  function getOfflineEfficiency() {
    const wh = state.levels.warehouse || 0;
    const bed = state.levels.bed || 0;
    const eff = OFFLINE_BASE_EFF + wh * 0.045 + bed * 0.035 + getMedalOfflineBonus() + getTrainingSum('offlineBonus');
    return Math.min(1, Math.max(0.2, eff));
  }
  function contentGateOk(req) {
    if (!req) return true;
    if (req.reqLifetime && (state.stats.lifetimeBones || 0) < req.reqLifetime) return false;
    if (req.reqMedals && (state.medals || 0) < req.reqMedals) return false;
    if (req.reqPrestige && (state.prestigeLevel || 0) < req.reqPrestige) return false;
    if (req.unlockStage && (state.yardStage || 1) < req.unlockStage) return false;
    return true;
  }
  function contentGateText(req) {
    if (!req) return '';
    const parts = [];
    if (req.reqLifetime) parts.push(tr('gate_life', { n: fmtStatic(req.reqLifetime) }));
    if (req.reqMedals) parts.push('🏅 ' + req.reqMedals);
    if (req.reqPrestige) parts.push(tr('gate_shows', { n: req.reqPrestige }));
    if (req.unlockStage) parts.push(tr('gate_stage', { n: req.unlockStage }));
    return parts.length ? tr('need_colon', { parts: parts.join(' · ') }) : '';
  }
  function localDayKey() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Vladivostok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch (_) {
      const d = new Date();
      const local = new Date(d.getTime() + 10 * 60 * 60 * 1000);
      return local.getUTCFullYear() + '-' + String(local.getUTCMonth() + 1).padStart(2, '0') + '-' + String(local.getUTCDate()).padStart(2, '0');
    }
  }
  function upgradeCost(id) {
    const u = UPGRADES[id];
    if (window.GameCore && window.GameCore.geometricCost) return window.GameCore.geometricCost(u.baseCost, u.costMult, state.levels[id] || 0);
    return Math.floor(u.baseCost * Math.pow(u.costMult, state.levels[id] || 0));
  }
  function unlockReqText(unlock) {
    if (!unlock) return tr('locked');
    const parts = [];
    const uid = unlock.upgradeId || (unlock.type === 'level' ? unlock.id : null);
    const min = unlock.level != null ? unlock.level : unlock.min;
    if (uid && UPGRADES[uid] && min != null) parts.push(locn(UPGRADES[uid]) + ' ' + tr('lvl') + ' ' + min);
    if (unlock.lifetimeBones) parts.push(fmtStatic(unlock.lifetimeBones) + ' 🦴 ' + tr('lifetime'));
    return parts.length ? tr('need') + ': ' + parts.join(' · ') : tr('locked');
  }
  function isUpgradeUnlocked(id) {
    const u = UPGRADES[id];
    if (!u || !u.unlock) return true;
    const un = u.unlock;
    const uid = un.upgradeId || (un.type === 'level' ? un.id : null);
    const min = un.level != null ? un.level : un.min;
    if (uid && min != null && (state.levels[uid] || 0) < min) return false;
    if (un.lifetimeBones && (state.stats.lifetimeBones || 0) < un.lifetimeBones) return false;
    if (un.type === 'lifetime' && (state.stats.lifetimeBones || 0) < (un.min || 0)) return false;
    return true;
  }
  function trainingCost(id) {
    const t = TRAINING.find(function (x) { return x.id === id; });
    if (!t) return Infinity;
    if (window.GameCore && window.GameCore.geometricCost) return window.GameCore.geometricCost(t.baseCost, t.costMult, state.levelsTraining[id] || 0);
    return Math.floor(t.baseCost * Math.pow(t.costMult, state.levelsTraining[id] || 0));
  }
  function isTrainingUnlocked(id) {
    const idx = TRAINING_ORDER.indexOf(id);
    if (idx <= 0) return true;
    const prev = TRAINING_ORDER[idx - 1];
    return (state.levelsTraining[prev] || 0) >= 1;
  }
  function trainingUnlockText(id) {
    const idx = TRAINING_ORDER.indexOf(id);
    if (idx <= 0) return '';
    const prev = TRAINING[idx - 1];
    return tr('need') + ': «' + locn(prev) + '» ' + tr('lvl') + ' 1';
  }
  function cardNeedList(card) {
    const un = card && card.unlock;
    if (!un) return [];
    if (Array.isArray(un.need)) return un.need;
    const list = [];
    if (un.cardId) list.push({ cardId: un.cardId, level: un.level || 1 });
    if (un.upgradeId) list.push({ upgradeId: un.upgradeId, level: un.level || 1 });
    return list;
  }
  function isCardUnlocked(card) {
    const need = cardNeedList(card);
    for (let i = 0; i < need.length; i++) {
      const n = need[i];
      if (n.cardId && (state.levelsCards[n.cardId] || 0) < (n.level || 1)) return false;
      if (n.upgradeId && (state.levels[n.upgradeId] || 0) < (n.level || 1)) return false;
    }
    return true;
  }
  function cardUnlockText(card) {
    const need = cardNeedList(card);
    if (!need.length) return '';
    const parts = [];
    for (let i = 0; i < need.length; i++) {
      const n = need[i];
      if (n.cardId && SKILL_CARDS_BY_ID[n.cardId]) parts.push(locn(SKILL_CARDS_BY_ID[n.cardId]) + ' ' + tr('lvl') + ' ' + n.level);
      else if (n.upgradeId && UPGRADES[n.upgradeId]) parts.push(locn(UPGRADES[n.upgradeId]) + ' ' + tr('lvl') + ' ' + n.level);
    }
    return parts.length ? tr('need') + ': ' + parts.join(' · ') : tr('locked');
  }
  function cardCost(id) {
    const c = SKILL_CARDS_BY_ID[id];
    if (!c) return Infinity;
    if (window.GameCore && window.GameCore.geometricCost) return window.GameCore.geometricCost(c.baseCost, c.costMult, state.levelsCards[id] || 0);
    return Math.floor(c.baseCost * Math.pow(c.costMult, state.levelsCards[id] || 0));
  }
  function cardMaxLevel(c) {
    const n = c && c.maxLevel;
    return isFinite(n) && n > 0 ? Math.floor(n) : (CARD_MAX_LEVEL || 20);
  }
  function fmtPayback(sec) {
    const s = Math.max(0, Number(sec) || 0);
    if (s < 90) return tr('payback_s', { n: Math.max(1, Math.ceil(s)) });
    if (s < 3600) return tr('payback_m', { n: Math.max(1, Math.round(s / 60)) });
    return tr('payback_h', { n: (s / 3600).toFixed(1) });
  }
  function pickDailyCardCombo(seed) {
    const ids = SKILL_CARD_IDS.slice();
    const out = [];
    for (let i = 0; i < 3 && ids.length; i++) {
      const idx = Math.floor(seededRand(seed, 40 + i) * ids.length);
      out.push(ids.splice(idx, 1)[0]);
    }
    return out;
  }
  function ensureCardCombo() {
    const key = localDayKey();
    if (state.cardComboDay !== key) {
      state.cardComboDay = key;
      state.cardComboHits = {};
      state.cardComboClaimed = false;
    }
    if (!state.cardComboHits || typeof state.cardComboHits !== 'object') state.cardComboHits = {};
  }
  function fmt(n) {
    if (!isFinite(n)) return '0';
    const abs = Math.abs(n);
    if (abs >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (abs >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    if (abs >= 100) return Math.floor(n).toString();
    if (abs >= 10) return n.toFixed(1);
    return n.toFixed(2);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  const $ = (sel) => document.querySelector(sel);

  function tr(key, vars) {
    return (window.I18n && window.I18n.t) ? window.I18n.t(key, vars) : key;
  }
  function locn(item) {
    return (window.I18n && window.I18n.itemName) ? window.I18n.itemName(item) : (item && item.name) || '';
  }
  function locd(item) {
    return (window.I18n && window.I18n.itemDesc) ? window.I18n.itemDesc(item) : (item && item.desc) || '';
  }
  function locStageTitle(st) {
    return (window.I18n && window.I18n.stageTitle) ? window.I18n.stageTitle(st) : ((st && st.title) || '');
  }
  function locStageHook(st) {
    return (window.I18n && window.I18n.stageHook) ? window.I18n.stageHook(st) : ((st && st.hook) || '');
  }
  function qLabel(item) {
    if (!item) return '';
    if (window.I18n && window.I18n.questLabel) return window.I18n.questLabel(item.type, item.target);
    return item.label || '';
  }
  function dLabel(item) {
    if (!item) return '';
    if (window.I18n && window.I18n.dailyLabel) return window.I18n.dailyLabel(item.type, item.target);
    return item.label || '';
  }


  const ac = new AbortController();
  cleanups.push(function () { try { ac.abort(); } catch (_) {} });
  function listen(el, type, fn, opts) {
    if (!el) return;
    el.addEventListener(type, fn, Object.assign({}, opts || {}, { signal: ac.signal }));
  }

  function showToast(msg, ms) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, ms || 3500);
  }

  function pruneFx(layer, max) {
    while (layer && layer.childElementCount > max) {
      layer.removeChild(layer.firstChild);
    }
  }

  function spawnPopup(x, y, text) {
    const layer = $('#popup-layer');
    if (!layer) return;
    pruneFx(layer, 36);
    const span = document.createElement('span');
    span.className = 'ore-popup';
    span.textContent = text;
    span.style.left = x + 'px';
    span.style.top = y + 'px';
    span.style.setProperty('--drift-x', (Math.random() * 48 - 24).toFixed(1) + 'px');
    layer.appendChild(span);
    requestAnimationFrame(function () { span.classList.add('fly'); });
    setTimeout(function () { if (span.parentNode) span.remove(); }, 950);
  }

  function spawnClickFx(clientX, clientY) {
    const layer = $('#popup-layer');
    if (!layer) return;
    pruneFx(layer, 36);
    const hearts = ['💕', '💗', '💖', '💓', '✨', '🐾'];
    const n = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span');
      const isHeart = Math.random() > 0.28;
      el.className = isHeart ? 'fx-heart' : 'fx-sparkle';
      if (isHeart) el.textContent = hearts[i % hearts.length];
      const angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.6;
      const dist = 30 + Math.random() * 48;
      const hx = Math.cos(angle) * dist;
      const hy = Math.sin(angle) * dist - 22;
      el.style.left = clientX + 'px';
      el.style.top = clientY + 'px';
      if (isHeart) {
        el.style.setProperty('--hx', hx.toFixed(1) + 'px');
        el.style.setProperty('--hy', hy.toFixed(1) + 'px');
      } else {
        el.style.setProperty('--sx', hx.toFixed(1) + 'px');
        el.style.setProperty('--sy', hy.toFixed(1) + 'px');
      }
      layer.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.remove(); }, 820);
    }
  }

  function secondaryTabLabels() {
    return {
      breeds: tr('tab_breeds'),
      friends: tr('tab_friends'),
      album: tr('tab_album'),
      season: tr('tab_season'),
      quests: tr('tab_quests'),
      achievements: tr('tab_ach_short'),
      prestige: tr('tab_prestige')
    };
  }

  function isSecondaryTab(tab) {
    return !!secondaryTabLabels()[tab];
  }

  function closeMoreSheet() {
    var sheet = $('#more-sheet');
    var moreBtn = $('#tab-more');
    if (sheet) sheet.hidden = true;
    if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
  }

  function openMoreSheet() {
    var sheet = $('#more-sheet');
    var moreBtn = $('#tab-more');
    if (sheet) sheet.hidden = false;
    if (moreBtn) moreBtn.setAttribute('aria-expanded', 'true');
    if (window.Sounds && window.Sounds.playUi) window.Sounds.playUi();
  }

  function syncTabChrome(tab) {
    var secondary = isSecondaryTab(tab);
    document.querySelectorAll('.tabs > .tab').forEach(function (btn) {
      var key = btn.dataset.tab;
      var on = key === 'more' ? secondary : key === tab;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.more-item').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    var moreLabel = $('#tab-more-label');
    if (moreLabel) {
      moreLabel.textContent = secondary ? (secondaryTabLabels()[tab] || tr('tab_more')) : tr('tab_more');
    }
  }

  function syncBgm() {
    if (!window.Sounds || typeof window.Sounds.setBgm !== 'function') return;
    window.Sounds.setBgm('yard');
  }

  function setTab(tab) {
    if (tab === 'gpshop') tab = 'shop';
    if (!tab || tab === 'more') return;
    if (tab !== activeTab && window.Sounds && window.Sounds.playUi) window.Sounds.playUi();
    activeTab = tab;
    closeMoreSheet();
    syncTabChrome(tab);
    document.querySelectorAll('.panel-section').forEach(function (panel) {
      const show = panel.dataset.panel === tab;
      if (show) {
        panel.hidden = false;
        panel.classList.remove('panel-fade');
        void panel.offsetWidth;
        panel.classList.add('panel-fade');
      } else {
        panel.hidden = true;
        panel.classList.remove('panel-fade');
      }
    });
    renderActivePanel();
    syncBgm();
  }

  function renderActivePanel() {
    if (activeTab === 'shop') { renderShop(); }
    else if (activeTab === 'cards') renderSkillCards();
    else if (activeTab === 'training') renderTraining();
    else if (activeTab === 'breeds') renderBreeds();
    else if (activeTab === 'friends') renderFriends();
    else if (activeTab === 'yard') renderYards();
    else if (activeTab === 'album') renderAlbum();
    else if (activeTab === 'season') renderSeason();
    else if (activeTab === 'story') renderStory();
    else if (activeTab === 'quests') renderQuests();
    else if (activeTab === 'achievements') renderAchievements();
    else if (activeTab === 'prestige') renderPrestige();
  }

  function fmtPct(frac) {
    const n = (Number(frac) || 0) * 100;
    const r = Math.round(n * 10) / 10;
    return (Math.abs(r - Math.round(r)) < 0.05) ? String(Math.round(r)) : r.toFixed(1);
  }
  function shopStatHtml(u, lvl, cost) {
    const lines = [];
    function arrow(a, b) {
      lines.push('<span class="skill-card-arrow">' + a + ' → ' + b + '</span>');
    }
    function extra(txt) {
      if (txt) lines.push('<span class="skill-card-next">' + txt + '</span>');
    }
    if (u.clickPower) {
      arrow(fmt(lvl * u.clickPower), fmt((lvl + 1) * u.clickPower));
      extra(tr('plus_pets_lvl', { n: fmt(u.clickPower) }));
    }
    if (u.orePerSec) {
      arrow(fmt(lvl * u.orePerSec) + tr('per_sec'), fmt((lvl + 1) * u.orePerSec) + tr('per_sec'));
      extra(tr('plus_ops_lvl', { n: fmt(u.orePerSec) }) + ' · ' + fmtPayback(cost / u.orePerSec));
    }
    if (u.clickPct) {
      arrow('+' + fmtPct(lvl * u.clickPct) + '%', '+' + fmtPct((lvl + 1) * u.clickPct) + '%');
      extra(tr('plus_pct_pets_lvl', { n: fmtPct(u.clickPct) }));
    }
    if (u.idleMult) {
      arrow('+' + fmtPct(lvl * u.idleMult) + '%', '+' + fmtPct((lvl + 1) * u.idleMult) + '%');
      extra(tr('plus_pct_idle_lvl', { n: fmtPct(u.idleMult) }));
    }
    if (u.comboBonusMs) {
      arrow('+' + (lvl * u.comboBonusMs) + ' ' + tr('ms'), '+' + ((lvl + 1) * u.comboBonusMs) + ' ' + tr('ms'));
      extra(tr('plus_combo_lvl', { n: u.comboBonusMs }));
    }
    return lines.join('') || locd(u);
  }

  function renderShop() {
    const shop = $('#shop');
    if (!shop) return;
    const cats = $('#shop-cats');
    if (cats) {
      cats.querySelectorAll('.card-cat').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-shop-cat') === activeShopCat);
      });
    }
    shop.innerHTML = '';
    const ids = (SHOP_CAT_IDS && SHOP_CAT_IDS[activeShopCat]) || UPGRADE_ORDER;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const u = UPGRADES[id];
      if (!u) continue;
      const unlocked = isUpgradeUnlocked(id);
      const lvl = state.levels[id] || 0;
      const cost = upgradeCost(id);
      const canBuy = unlocked && state.ore >= cost;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'skill-card' + (canBuy ? '' : ' disabled') + (unlocked ? '' : ' locked');
      card.dataset.id = id;
      let desc;
      if (!unlocked) {
        desc = unlockReqText(u.unlock);
      } else {
        desc = shopStatHtml(u, lvl, cost);
      }
      card.innerHTML = '<div class="skill-card-top"><span class="skill-card-ico">' + (unlocked ? u.icon : '🔒') + '</span><span class="skill-card-lvl">' + tr('lvl') + lvl + '</span></div><div class="skill-card-name">' + locn(u) + '</div><div class="skill-card-desc">' + desc + '</div><div class="skill-card-cost">' + (unlocked ? '🦴 ' + fmt(cost) : '—') + '</div>';
      card.addEventListener('click', function () {
        if (!unlocked) { showToast(unlockReqText(u.unlock) || tr('locked')); return; }
        buyUpgrade(id);
      });
      shop.appendChild(card);
    }
  }

  function renderTraining() {
    const root = $('#training');
    if (!root) return;
    root.innerHTML = '';
    for (let i = 0; i < TRAINING.length; i++) {
      const t = TRAINING[i];
      const unlocked = isTrainingUnlocked(t.id);
      const lvl = state.levelsTraining[t.id] || 0;
      const cost = trainingCost(t.id);
      const canBuy = unlocked && state.ore >= cost;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'upgrade' + (canBuy ? '' : ' disabled') + (unlocked ? '' : ' locked');
      card.dataset.trainingId = t.id;
      if (!unlocked) {
        card.innerHTML = '<span class="up-icon">🔒</span><span class="up-body"><span class="up-name">' + locn(t) + '</span><span class="up-desc">' + trainingUnlockText(t.id) + '</span></span><span class="up-cost">—</span>';
        card.addEventListener('click', function () { showToast(trainingUnlockText(t.id) || tr('locked')); });
      } else {
        card.innerHTML = '<span class="up-icon">' + t.icon + '</span><span class="up-body"><span class="up-name">' + locn(t) + ' <em>' + tr('lvl') + lvl + '</em></span><span class="up-desc">' + locd(t) + '</span></span><span class="up-cost">🦴 ' + fmt(cost) + '</span>';
        card.addEventListener('click', function () { buyTraining(t.id); });
      }
      root.appendChild(card);
    }
  }

  function isPackCardOpen(card) {
    if (!card) return false;
    if (isPackStarterCard(card)) return true;
    return isPackCatOwned(card.cat) && isCardUnlocked(card);
  }
  function hidePackBuyModal() {
    const m = $('#pack-buy-modal');
    if (m) m.hidden = true;
  }
  function openPackBuyModal(cat) {
    const p = packProductByCat(cat);
    const modal = $('#pack-buy-modal');
    const title = $('#pack-buy-title');
    const text = $('#pack-buy-text');
    const buy = $('#pack-buy-confirm');
    if (!modal || !p) { showToast(tr('pack_need_branch')); return; }
    if (title) title.textContent = tr('pack_buy_h', { name: tr('cat_' + cat) });
    if (text) text.textContent = tr('pack_buy_p', { name: tr('cat_' + cat) });
    if (buy) {
      buy.textContent = packPriceLabel(p.tag);
      buy.dataset.packTag = p.tag;
    }
    modal.hidden = false;
  }

  function renderSkillCards() {
    ensureCardCombo();
    const comboRoot = $('#card-combo');
    const grid = $('#skill-cards');
    const cats = $('#card-cats');
    if (cats) {
      cats.querySelectorAll('.card-cat').forEach(function (btn) {
        const cat = btn.getAttribute('data-card-cat');
        btn.classList.toggle('active', cat === activeCardCat);
        btn.classList.remove('locked');
      });
    }
    if (comboRoot) {
      ensureCardCombo();
      const ids = pickDailyCardCombo(state.cardComboDay || localDayKey());
      const hits = ids.filter(function (id) { return state.cardComboHits && state.cardComboHits[id]; }).length;
      const done = !!state.cardComboClaimed;
      const ready = !done && hits >= ids.length && ids.length > 0;
      comboRoot.hidden = false;
      const icons = ids.map(function (id) {
        const c = SKILL_CARDS_BY_ID[id];
        const hit = state.cardComboHits && state.cardComboHits[id];
        const ico = c && c.icon ? c.icon : '❔';
        return '<span class="card-combo-ico' + (hit ? ' on' : '') + '">' + ico + '</span>';
      }).join('');
      let action = '';
      if (done) action = '<span class="card-combo-meta">' + tr('combo_done') + '</span>';
      else if (ready) action = '<button type="button" class="btn btn-sm" data-claim-combo="1">' + tr('combo_claim') + '</button>';
      else action = '<span class="card-combo-meta">' + tr('combo_go') + ' · ' + hits + '/' + ids.length + '</span>';
      comboRoot.innerHTML = '<div class="card-combo-title">' + tr('combo_h') + '</div><div class="card-combo-row">' + icons + '</div>' + action;
      const claimBtn = comboRoot.querySelector('[data-claim-combo]');
      if (claimBtn) claimBtn.addEventListener('click', function (e) { e.preventDefault(); claimCardCombo(); });
    }
    if (!grid) return;
    grid.innerHTML = '';
    SKILL_CARDS.forEach(function (c) {
      if (c.cat !== activeCardCat) return;
      const branchOwned = isPackCatOwned(c.cat);
      const unlocked = isPackCardOpen(c);
      const lvl = state.levelsCards[c.id] || 0;
      const maxL = cardMaxLevel(c);
      const maxed = unlocked && lvl >= maxL;
      const cost = cardCost(c.id);
      const can = unlocked && !maxed && state.ore >= cost;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'skill-card' + (can ? '' : ' disabled') + (unlocked ? '' : ' pack-locked') + (maxed ? ' maxed' : '');
      const now = lvl * (c.orePerSec || 0);
      let desc = '<span class="skill-card-now">' + tr('card_now', { n: fmt(now) }) + '</span>';
      desc += '<span class="skill-card-next">' + tr('plus_ops_lvl', { n: fmt(c.orePerSec) }) + (unlocked && !maxed ? ' · ' + fmtPayback(cost / c.orePerSec) : '') + '</span>';
      if (maxed) desc += '<span class="skill-card-next">' + tr('maxed') + '</span>';
      const costHtml = !unlocked ? tr('pack_locked_cta') : (maxed ? tr('maxed') : '🦴 ' + fmt(cost));
      card.innerHTML = '<div class="skill-card-top"><span class="skill-card-ico">' + c.icon + '</span><span class="skill-card-lvl">' + tr('lvl') + lvl + '</span></div><div class="skill-card-name">' + locn(c) + '</div><div class="skill-card-desc">' + desc + '</div><div class="skill-card-cost">' + costHtml + '</div>';
      card.addEventListener('click', function () {
        if (!unlocked) {
          if (!branchOwned) { openPackBuyModal(c.cat); return; }
          showToast(cardUnlockText(c) || tr('locked'));
          return;
        }
        if (maxed) { showToast(tr('max_lvl')); return; }
        buySkillCard(c.id);
      });
      grid.appendChild(card);
    });
  }
  function buySkillCard(id) {
    const c = SKILL_CARDS_BY_ID[id];
    if (!c) return;
    if (!isPackCardOpen(c)) {
      if (!isPackCatOwned(c.cat)) { openPackBuyModal(c.cat); return; }
      showToast(cardUnlockText(c) || tr('locked'));
      return;
    }
    if ((state.levelsCards[id] || 0) >= cardMaxLevel(c)) { showToast(tr('max_lvl')); return; }
    const cost = cardCost(id);
    if (state.ore < cost) { showToast(tr('need') + ' 🦴'); return; }
    state.ore -= cost;
    state.levelsCards[id] = (state.levelsCards[id] || 0) + 1;
    state.stats.upgradesBought += 1;
    bumpQuest('buy', 1);
    ensureCardCombo();
    const comboIds = pickDailyCardCombo(state.cardComboDay || localDayKey());
    if (comboIds.indexOf(id) !== -1) state.cardComboHits[id] = true;
    if (window.Sounds) window.Sounds.playBuy();
    checkAchievements(); maybeUnlockStory(); renderAll(); scheduleSave();
  }
  function claimCardCombo() {
    ensureCardCombo();
    if (state.cardComboClaimed) return;
    const ids = pickDailyCardCombo(state.cardComboDay || localDayKey());
    if (!ids.every(function (id) { return state.cardComboHits && state.cardComboHits[id]; })) return;
    const reward = Math.max(80, Math.floor(getOrePerSec() * 90 + getClickPower() * 40));
    state.cardComboClaimed = true;
    state.ore += reward;
    state.stats.lifetimeBones += reward;
    bumpQuest('earn', reward);
    if (window.Sounds) window.Sounds.playBuy();
    showToast(tr('quest_done', { n: fmt(reward) }));
    renderSkillCards(); renderStats(); scheduleSave();
  }

  function renderConsumables() {
    return;
  }

  function buyConsumable(id) {
    const c = CONSUMABLES[id];
    if (!c) return;
    if (state.ore < c.cost) { showToast(tr('need') + ' 🦴'); return; }
    state.ore -= c.cost;
    if (!state.inventory) state.inventory = {};
    state.inventory[id] = (state.inventory[id] || 0) + 1;
    if (window.Sounds) window.Sounds.playBuy();
    showToast(tr('item_inv', { name: locn(c) }));
    renderConsumables(); renderStats(); scheduleSave();
  }

  function useConsumable(id) {
    const c = CONSUMABLES[id];
    if (!c) return;
    if (state.activeItem && Date.now() < state.activeItem.until) { showToast(tr('active') + ' 🐾'); return; }
    const qty = (state.inventory && state.inventory[id]) || 0;
    if (qty <= 0) { showToast(tr('locked')); return; }
    state.inventory[id] = qty - 1;
    state.activeItem = { id: id, until: Date.now() + c.durationMs };
    if (window.Sounds) window.Sounds.playBuy();
    showToast(tr('item_on', { name: locn(c), mult: c.mult, n: Math.round(c.durationMs / 1000) }));
    renderConsumables(); renderStats(); scheduleSave();
  }


  function createYardDog() {
    const actor = $('#dogActor');
    const stage = $('#mine-btn');
    const sprite = $('#dogSprite');
    if (!actor || !stage) {
      return { start: function () {}, stop: function () {} };
    }

    const ACTOR_W = 96;
    const KENNEL_RESERVE = 102;
    const WALK_SPEED = 50;
    const FRAME_FPS = Math.max(10, Math.min(12, WALK_SPEED / 4.5));
    const TRANS_FPS = 11;
    const APPROACH_SNAP = 4;
    let mode = 'walk';
    let dir = 1;
    let pendingDir = null;
    let x = 16;
    let modeUntil = 0;
    let raf = 0;
    let running = false;
    let lastTs = 0;
    let frame = 0;
    let frameAcc = 0;
    let sheet = '';
    let transStart = 0;

    function prefersReduced() {
      try {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      } catch (_) {
        return false;
      }
    }

    function rand(a, b) {
      return a + Math.random() * (b - a);
    }

    function walkBounds() {
      const w = stage.clientWidth || 280;
      const minX = 8;
      const maxX = Math.max(minX, w - ACTOR_W - KENNEL_RESERVE);
      return { minX: minX, maxX: maxX, sitX: maxX };
    }

    function walkFrameCount() {
      const n = Number(actor.dataset.walkFrames);
      return n > 0 ? n : 8;
    }

    function sitdownFrameCount() {
      const n = Number(actor.dataset.sitdownFrames);
      return n > 0 ? n : 4;
    }

    function schedule(now) {
      if (mode === 'walk') modeUntil = now + rand(4000, 8000);
      else if (mode === 'sit') modeUntil = now + rand(2000, 4000);
      else modeUntil = now + 1e12;
    }

    function setSitIdle(on) {
      if (on) actor.classList.add('dog-sit-idle');
      else actor.classList.remove('dog-sit-idle');
    }

    function setSpriteXform(scaleY, ty) {
      if (!sprite) return;
      if (scaleY == null) {
        sprite.style.transform = '';
        return;
      }
      sprite.style.transform = 'translateY(' + ty.toFixed(2) + 'px) scaleY(' + scaleY.toFixed(3) + ')';
    }

    function paintSheetFrame(frames) {
      if (!sprite) return;
      const w = sprite.clientWidth || 96;
      const f = Math.min(frames - 1, Math.max(0, frame | 0));
      sprite.style.backgroundSize = (frames * w) + 'px 100%';
      sprite.style.backgroundPosition = (-f * w) + 'px 0';
    }

    function paintWalkFrame() {
      paintSheetFrame(walkFrameCount());
    }

    function applyWalkSheet() {
      if (!sprite) return;
      const walkSrc = actor.dataset.walkSrc || '';
      if (walkSrc) sprite.style.backgroundImage = 'url("' + walkSrc + '")';
      paintWalkFrame();
      sheet = 'walk';
    }

    function applySitSheet() {
      if (!sprite) return;
      const sitSrc = actor.dataset.sitSrc || '';
      if (sitSrc) sprite.style.backgroundImage = 'url("' + sitSrc + '")';
      sprite.style.backgroundSize = '100% 100%';
      sprite.style.backgroundPosition = '0 0';
      frame = 0;
      frameAcc = 0;
      sheet = 'sit';
    }

    function applySitdownSheet() {
      if (!sprite) return;
      const src = actor.dataset.sitdownSrc || '';
      if (src) sprite.style.backgroundImage = 'url("' + src + '")';
      frame = 0;
      frameAcc = 0;
      sheet = 'sitdown';
      paintSheetFrame(sitdownFrameCount());
    }

    function applyStandupSheet() {
      if (!sprite) return;
      const src = actor.dataset.standupSrc || '';
      if (src) sprite.style.backgroundImage = 'url("' + src + '")';
      frame = 0;
      frameAcc = 0;
      sheet = 'standup';
      paintSheetFrame(sitdownFrameCount());
    }

    function advanceWalkFrames(dt, fps) {
      frameAcc += dt;
      const frameDur = 1 / Math.max(0.5, fps);
      const frames = walkFrameCount();
      while (frameAcc >= frameDur) {
        frameAcc -= frameDur;
        frame = (frame + 1) % frames;
        if (pendingDir != null && frame === 0) {
          dir = pendingDir;
          pendingDir = null;
        }
      }
    }

    function requestDir(next) {
      if (next === dir && pendingDir == null) return;
      if (frame === 0) {
        dir = next;
        pendingDir = null;
      } else {
        pendingDir = next;
      }
    }

    function paint() {
      const sx = dir < 0 ? -1 : 1;
      actor.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0) scaleX(' + sx + ')';
      actor.dataset.mode = mode;
      if (sheet === 'walk' && (mode === 'walk' || mode === 'approach')) {
        paintWalkFrame();
        // No walk bob — leg animation alone looks smoother
        setSpriteXform(null);
      } else if (mode === 'sitdown' && sheet === 'sitdown') {
        paintSheetFrame(sitdownFrameCount());
      } else if (mode === 'standup' && sheet === 'standup') {
        paintSheetFrame(sitdownFrameCount());
      }
    }

    function enterApproach() {
      mode = 'approach';
      pendingDir = null;
      setSitIdle(false);
      setSpriteXform(null);
      applyWalkSheet();
      const b = walkBounds();
      if (x < b.sitX) dir = 1;
      else if (x > b.sitX) dir = -1;
    }

    function enterSitdown(now) {
      mode = 'sitdown';
      pendingDir = null;
      transStart = now;
      setSitIdle(false);
      setSpriteXform(null);
      applySitdownSheet();
    }

    function enterSit(now) {
      const b = walkBounds();
      mode = 'sit';
      pendingDir = null;
      x = b.sitX;
      dir = 1;
      applySitSheet();
      setSpriteXform(null);
      setSitIdle(!prefersReduced());
      schedule(now);
    }

    function enterStandup(now) {
      mode = 'standup';
      pendingDir = null;
      transStart = now;
      setSitIdle(false);
      setSpriteXform(null);
      applyStandupSheet();
    }

    function enterWalk(now, flipMaybe) {
      mode = 'walk';
      setSitIdle(false);
      setSpriteXform(null);
      applyWalkSheet();
      // Apply flip on sit exit (stride restart) so scaleX does not mid-stride flip
      if (flipMaybe && Math.random() < 0.55) {
        dir *= -1;
      }
      pendingDir = null;
      frame = 0;
      frameAcc = 0;
      schedule(now);
    }

    function tick(ts) {
      if (!running || destroyed) return;
      raf = requestAnimationFrame(tick);
      if (document.visibilityState === 'hidden') {
        lastTs = 0;
        return;
      }
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      if (prefersReduced()) {
        const b = walkBounds();
        mode = 'sit';
        x = b.sitX;
        dir = 1;
        pendingDir = null;
        applySitSheet();
        setSitIdle(false);
        setSpriteXform(null);
        paint();
        return;
      }

      if (mode === 'walk') {
        if (ts >= modeUntil) {
          enterApproach();
        } else {
          const b = walkBounds();
          x += dir * WALK_SPEED * dt;
          if (x <= b.minX) { x = b.minX; requestDir(1); }
          if (x >= b.maxX) { x = b.maxX; requestDir(-1); }
          advanceWalkFrames(dt, FRAME_FPS);
        }
      }

      if (mode === 'approach') {
        const b = walkBounds();
        if (Math.abs(x - b.sitX) < APPROACH_SNAP) {
          x = b.sitX;
          dir = 1;
          pendingDir = null;
          enterSitdown(ts);
        } else {
          dir = x < b.sitX ? 1 : -1;
          pendingDir = null;
          x += dir * WALK_SPEED * dt;
          if ((dir > 0 && x >= b.sitX) || (dir < 0 && x <= b.sitX)) {
            x = b.sitX;
            dir = 1;
            pendingDir = null;
            enterSitdown(ts);
          } else {
            advanceWalkFrames(dt, FRAME_FPS);
          }
        }
      }

      if (mode === 'sitdown') {
        const frames = sitdownFrameCount();
        const elapsed = (ts - transStart) / 1000;
        frame = Math.min(frames - 1, Math.floor(elapsed * TRANS_FPS));
        if (elapsed >= frames / TRANS_FPS) enterSit(ts);
      } else if (mode === 'sit') {
        x = walkBounds().sitX;
        dir = 1;
        if (ts >= modeUntil) enterStandup(ts);
      } else if (mode === 'standup') {
        const frames = sitdownFrameCount();
        const elapsed = (ts - transStart) / 1000;
        frame = Math.min(frames - 1, Math.floor(elapsed * TRANS_FPS));
        if (elapsed >= frames / TRANS_FPS) enterWalk(ts, true);
      }

      paint();
    }

    return {
      start: function () {
        if (running) return;
        running = true;
        const b = walkBounds();
        x = Math.min(Math.max(x, b.minX), b.maxX);
        if (prefersReduced()) {
          mode = 'sit';
          x = b.sitX;
          dir = 1;
          pendingDir = null;
          applySitSheet();
          setSitIdle(false);
          setSpriteXform(null);
        } else {
          mode = 'walk';
          pendingDir = null;
          applyWalkSheet();
          setSitIdle(false);
          setSpriteXform(null);
        }
        schedule(performance.now());
        lastTs = 0;
        paint();
        raf = requestAnimationFrame(tick);
      },
      stop: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        lastTs = 0;
      }
    };
  }

  function applyBreedArt() {
    const img = $('#dogArt');
    const sprite = $('#dogSprite');
    const actor = $('#dogActor');
    const breed = getBreed();
    if (!breed) return;
    if (img && !img.hasAttribute('hidden')) img.src = breed.src;
    else if (img && breed.src) img.src = breed.src;
    const walkSrc = breed.walkSrc || '';
    const sitSrc = breed.sitSrc || '';
    const sitdownSrc = breed.sitdownSrc || '';
    const standupSrc = breed.standupSrc || '';
    if (actor) {
      actor.dataset.walkSrc = walkSrc;
      actor.dataset.sitSrc = sitSrc;
      actor.dataset.sitdownSrc = sitdownSrc;
      actor.dataset.standupSrc = standupSrc;
      actor.dataset.frameW = String(breed.frameW || 192);
      actor.dataset.frameH = String(breed.frameH || 192);
      actor.dataset.walkFrames = String(breed.walkFrames || 8);
      actor.dataset.sitdownFrames = String(breed.sitdownFrames || 4);
    }
    if (sprite) {
      const mode = (actor && actor.dataset.mode) || 'walk';
      if (mode === 'sit' && sitSrc) {
        sprite.style.backgroundImage = 'url("' + sitSrc + '")';
        sprite.style.backgroundSize = '100% 100%';
        sprite.style.backgroundPosition = '0 0';
      } else if (walkSrc) {
        sprite.style.backgroundImage = 'url("' + walkSrc + '")';
        const frames = Number((actor && actor.dataset.walkFrames) || 8) || 8;
        const w = sprite.clientWidth || 96;
        sprite.style.backgroundSize = (frames * w) + 'px 100%';
        sprite.style.backgroundPosition = '0 0';
      }
    }
  }
  function applyYardArt() {
    const bg = $('#yard-bg');
    const yard = getYard();
    if (bg && yard) bg.style.backgroundImage = 'url("' + yard.src + '")';
  }
  function applyFriendArt() {
    const img = $('#friendArt');
    if (!img) return;
    const fr = getFriend();
    if (fr) {
      img.src = fr.src;
      img.alt = locn(fr);
      img.hidden = false;
    } else {
      img.hidden = true;
      img.alt = '';
    }
  }
  function updateSeasonUI() {
    const active = isSeasonActive();
    const acornStat = $('#acorn-stat');
    const tab = $('#tab-season');
    if (acornStat) acornStat.hidden = !active;
    if (tab) tab.hidden = !active;
    if (!active && activeTab === 'season') setTab('shop');
  }

  function renderBreeds() {
    const root = $('#breeds');
    if (!root) return;
    root.innerHTML = '';
    Object.values(BREEDS).forEach(function (b) {
      const unlocked = state.unlockedBreeds.indexOf(b.id) !== -1;
      const selected = state.selectedBreed === b.id;
      const card = document.createElement('div');
      card.className = 'breed-card' + (selected ? ' selected' : '') + (unlocked ? '' : ' locked');
      let actionHtml = '';
      if (!unlocked) {
        const gated = contentGateOk(b);
        const can = gated && state.ore >= b.unlockCost;
        const gate = contentGateText(b);
        actionHtml = (gate ? '<div class="gate-hint">' + gate + '</div>' : '') + '<button type="button" class="btn btn-sm' + (can ? '' : ' disabled') + '" data-unlock="' + b.id + '">' + tr('unlock_cost', { n: fmt(b.unlockCost) }) + '</button>';
      } else if (!selected) {
        actionHtml = '<button type="button" class="btn btn-sm" data-select="' + b.id + '">' + tr('choose') + '</button>';
      } else {
        actionHtml = '<span class="breed-active">' + tr('breed_on') + '</span>';
      }
      card.innerHTML = '<img class="breed-thumb" src="' + b.src + '" alt="' + locn(b) + '" /><div class="breed-body"><div class="breed-name">' + locn(b) + '</div><div class="breed-desc">' + locd(b) + '</div>' + actionHtml + '</div>';
      root.appendChild(card);
    });
    root.querySelectorAll('[data-unlock]').forEach(function (btn) {
      btn.addEventListener('click', function () { unlockBreed(btn.getAttribute('data-unlock')); });
    });
    root.querySelectorAll('[data-select]').forEach(function (btn) {
      btn.addEventListener('click', function () { selectBreed(btn.getAttribute('data-select')); });
    });
  }

  function unlockBreed(id) {
    const b = BREEDS[id];
    if (!b || state.unlockedBreeds.indexOf(id) !== -1) return;
    if (!contentGateOk(b)) { showToast(contentGateText(b) || tr('locked')); return; }
    if (state.ore < b.unlockCost) { showToast(tr('need') + ' 🦴'); return; }
    state.ore -= b.unlockCost;
    state.unlockedBreeds.push(id);
    if (state.unlockedBreeds.filter(function (x) { return x !== 'lab'; }).length === 1) {
      grantSticker('heart', true);
    }
    if (window.Sounds) window.Sounds.playBuy();
    showToast(tr('breed_in', { name: locn(b) }));
    checkAchievements(); maybeUnlockStory(); renderBreeds(); renderStats(); scheduleSave();
  }

  function selectBreed(id) {
    if (state.unlockedBreeds.indexOf(id) === -1) return;
    state.selectedBreed = id;
    applyBreedArt();
    showToast(tr('breed_set', { name: locn(BREEDS[id]) }));
    renderBreeds(); renderStats(); scheduleSave();
  }

  function renderFriends() {
    const root = $('#friends');
    if (!root) return;
    root.innerHTML = '';
    Object.values(FRIENDS).forEach(function (f) {
      const unlocked = (state.unlockedFriends || []).indexOf(f.id) !== -1;
      const selected = state.activeFriend === f.id;
      const card = document.createElement('div');
      card.className = 'breed-card' + (selected ? ' selected' : '') + (unlocked ? '' : ' locked');
      let actionHtml = '';
      if (!unlocked) {
        const gated = contentGateOk(f);
        const can = gated && state.ore >= f.unlockCost;
        const gate = contentGateText(f);
        actionHtml = (gate ? '<div class="gate-hint">' + gate + '</div>' : '') + '<button type="button" class="btn btn-sm' + (can ? '' : ' disabled') + '" data-unlock-friend="' + f.id + '">' + tr('unlock_cost', { n: fmt(f.unlockCost) }) + '</button>';
      } else if (!selected) {
        actionHtml = '<button type="button" class="btn btn-sm" data-select-friend="' + f.id + '">' + tr('activate') + '</button>';
      } else {
        actionHtml = '<button type="button" class="btn btn-sm btn-ghost" data-clear-friend="1">' + tr('unequip') + '</button> <span class="breed-active">' + tr('nearby') + '</span>';
      }
      card.innerHTML = '<img class="breed-thumb" src="' + f.src + '" alt="' + locn(f) + '" /><div class="breed-body"><div class="breed-name">' + locn(f) + '</div><div class="breed-desc">' + locd(f) + '</div>' + actionHtml + '</div>';
      root.appendChild(card);
    });
    root.querySelectorAll('[data-unlock-friend]').forEach(function (btn) {
      btn.addEventListener('click', function () { unlockFriend(btn.getAttribute('data-unlock-friend')); });
    });
    root.querySelectorAll('[data-select-friend]').forEach(function (btn) {
      btn.addEventListener('click', function () { selectFriend(btn.getAttribute('data-select-friend')); });
    });
    root.querySelectorAll('[data-clear-friend]').forEach(function (btn) {
      btn.addEventListener('click', function () { selectFriend(null); });
    });
  }

  function unlockFriend(id) {
    const f = FRIENDS[id];
    if (!f || (state.unlockedFriends || []).indexOf(id) !== -1) return;
    if (!contentGateOk(f)) { showToast(contentGateText(f) || tr('locked')); return; }
    if (state.ore < f.unlockCost) { showToast(tr('need') + ' 🦴'); return; }
    state.ore -= f.unlockCost;
    if (!state.unlockedFriends) state.unlockedFriends = [];
    state.unlockedFriends.push(id);
    grantSticker(id === 'cat' ? 'cat' : id === 'rabbit' ? 'rabbit' : id === 'hamster' ? 'hamster' : null);
    if (!state.activeFriend) state.activeFriend = id;
    applyFriendArt();
    if (window.Sounds) window.Sounds.playBuy();
    showToast(tr('friend_now', { name: locn(f) }));
    checkAchievements(); maybeUnlockStory(); renderFriends(); renderStats(); scheduleSave();
  }

  function selectFriend(id) {
    if (id == null) {
      state.activeFriend = null;
      applyFriendArt();
      showToast(tr('friend_rest'));
      renderFriends(); renderStats(); scheduleSave();
      return;
    }
    if ((state.unlockedFriends || []).indexOf(id) === -1) return;
    state.activeFriend = id;
    applyFriendArt();
    showToast(tr('with_you', { name: locn(FRIENDS[id]) }));
    renderFriends(); renderStats(); scheduleSave();
  }

  function renderAlbum() {
    const grid = $('#album');
    const setsRoot = $('#album-sets');
    if (setsRoot) {
      setsRoot.innerHTML = '';
      STICKER_SETS.forEach(function (set) {
        const owned = set.stickers.filter(function (id) { return hasSticker(id); }).length;
        const complete = owned >= set.stickers.length;
        const claimed = !!(state.stickerSetsClaimed || {})[set.id];
        const card = document.createElement('div');
        card.className = 'album-set';
        let btn = '';
        if (complete && !claimed) btn = '<button type="button" class="btn btn-sm" data-claim-set="' + set.id + '">' + tr('claim_cost', { n: fmt(set.reward) }) + '</button>';
        else if (claimed) btn = '<span class="breed-active">' + tr('reward_got') + '</span>';
        card.innerHTML = '<div class="album-set-title">' + locn(set) + '</div><div class="album-set-meta">' + owned + '/' + set.stickers.length + ' · ' + tr('reward_bones', { n: fmt(set.reward) }) + '</div>' + btn;
        setsRoot.appendChild(card);
      });
      setsRoot.querySelectorAll('[data-claim-set]').forEach(function (btn) {
        btn.addEventListener('click', function () { claimStickerSet(btn.getAttribute('data-claim-set')); });
      });
    }
    if (!grid) return;
    grid.innerHTML = '';
    if (!(state.stickers || []).length) {
      const empty = document.createElement('p');
      empty.className = 'panel-hint';
      empty.style.gridColumn = '1 / -1';
      empty.textContent = tr('album_empty');
      grid.appendChild(empty);
    }
    STICKERS.forEach(function (st) {
      const owned = hasSticker(st.id);
      const cell = document.createElement('div');
      cell.className = 'sticker-cell' + (owned ? ' owned' : ' locked');
      cell.innerHTML = '<span class="sticker-ico">' + (owned ? st.icon : '❔') + '</span><span>' + (owned ? locn(st) : '???') + '</span>';
      cell.title = owned ? ((window.I18n && I18n.stickerHow) ? I18n.stickerHow(st) : st.how) : tr('not_open');
      grid.appendChild(cell);
    });
  }

  function claimStickerSet(id) {
    const set = STICKER_SETS.find(function (x) { return x.id === id; });
    if (!set) return;
    if (!state.stickerSetsClaimed || typeof state.stickerSetsClaimed !== 'object' || Array.isArray(state.stickerSetsClaimed)) state.stickerSetsClaimed = {};
    if (state.stickerSetsClaimed[id]) return;
    const ok = set.stickers.every(function (sid) { return hasSticker(sid); });
    if (!ok) { showToast(tr('set_incomplete')); return; }
    state.stickerSetsClaimed[id] = true;
    const reward = Math.max(0, Number(set.reward) || 0);
    state.ore += reward;
    state.stats.lifetimeBones += reward;
    if (window.Sounds) window.Sounds.playBuy();
    showToast(tr('set_done', { name: locn(set), n: fmt(reward) }));
    renderAlbum(); renderStats(); maybeUnlockStory(); scheduleSave();
  }

  function renderSeason() {
    const root = $('#season-shop');
    const hint = $('#season-hint');
    if (hint) hint.textContent = isSeasonActive()
      ? tr('season_acorns', { n: fmt(isFinite(state.acorns) ? state.acorns : 0) })
      : tr('season_closed');
    if (!root) return;
    root.innerHTML = '';
    if (!isSeasonActive()) {
      root.innerHTML = '<p class="panel-hint">' + tr('season_sleep') + '</p>';
      return;
    }
    SEASON_SHOP.forEach(function (item) {
      const bought = !!(state.seasonPurchases || {})[item.id];
      const card = document.createElement('div');
      card.className = 'season-card' + (bought && item.kind !== 'boost' ? ' owned' : '');
      let action = '';
      if (item.kind === 'boost') {
        const active = Date.now() < (state.seasonBoostUntil || 0);
        if (active) action = '<span class="breed-active">' + tr('n_sec', { n: Math.ceil((state.seasonBoostUntil - Date.now()) / 1000) }) + '</span>';
        else {
          const can = (isFinite(state.acorns) ? state.acorns : 0) >= item.costAcorns;
          action = '<button type="button" class="btn btn-sm' + (can ? '' : ' disabled') + '" data-season="' + item.id + '">🌰 ' + item.costAcorns + '</button>';
        }
      } else if (bought || (item.kind === 'yard' && state.unlockedYards.indexOf('autumn') !== -1) || (item.kind === 'sticker' && hasSticker(item.stickerId))) {
        action = '<span class="breed-active">' + tr('owned_ok') + '</span>';
      } else {
        const can = (isFinite(state.acorns) ? state.acorns : 0) >= item.costAcorns;
        action = '<button type="button" class="btn btn-sm' + (can ? '' : ' disabled') + '" data-season="' + item.id + '">🌰 ' + item.costAcorns + '</button>';
      }
      card.innerHTML = '<span class="item-icon">' + item.icon + '</span><div class="item-body"><div class="item-name">' + locn(item) + '</div><div class="item-desc">' + locd(item) + '</div></div>' + action;
      root.appendChild(card);
    });
    root.querySelectorAll('[data-season]').forEach(function (btn) {
      btn.addEventListener('click', function () { buySeasonItem(btn.getAttribute('data-season')); });
    });
  }

  function buySeasonItem(id) {
    const item = SEASON_SHOP.find(function (x) { return x.id === id; });
    if (!item || !isSeasonActive()) return;
    const acorns = isFinite(state.acorns) ? state.acorns : 0;
    if (acorns < item.costAcorns) { showToast(tr('need') + ' 🌰'); return; }
    if (item.kind === 'yard') {
      if (state.unlockedYards.indexOf('autumn') !== -1) return;
      state.acorns = acorns - item.costAcorns;
      state.unlockedYards.push('autumn');
      if (!state.seasonPurchases) state.seasonPurchases = {};
      state.seasonPurchases[id] = true;
      grantSticker('leaf');
      showToast(tr('autumn_yard'));
    } else if (item.kind === 'sticker') {
      if (hasSticker(item.stickerId)) return;
      state.acorns = acorns - item.costAcorns;
      if (!state.seasonPurchases) state.seasonPurchases = {};
      state.seasonPurchases[id] = true;
      grantSticker(item.stickerId);
    } else if (item.kind === 'boost') {
      if (Date.now() < (state.seasonBoostUntil || 0)) return;
      state.acorns = acorns - item.costAcorns;
      state.seasonBoostUntil = Date.now() + SEASON_BOOST_MS;
      showToast(tr('autumn_charge'));
    } else {
      return;
    }
    if (window.Sounds) window.Sounds.playBuy();
    checkAchievements(); maybeUnlockStory(); renderSeason(); renderYards(); renderStats(); scheduleSave();
  }

  function renderYards() {
    const root = $('#yards');
    if (!root) return;
    root.innerHTML = '';
    root.appendChild(buildYardStageCard());
    Object.values(YARDS).forEach(function (y) {
      const unlocked = state.unlockedYards.indexOf(y.id) !== -1;
      const selected = state.selectedYard === y.id;
      const card = document.createElement('div');
      card.className = 'yard-card' + (selected ? ' selected' : '') + (unlocked ? '' : ' locked');
      let actionHtml = '';
      if (!unlocked) {
        if (y.seasonOnly) {
          actionHtml = '<span class="breed-active">' + tr('season_only') + '</span>';
        } else {
          const gated = contentGateOk(y);
          const can = gated && state.ore >= y.unlockCost;
          const gate = contentGateText(y);
          actionHtml = (gate ? '<div class="gate-hint">' + gate + '</div>' : '') + '<button type="button" class="btn btn-sm' + (can ? '' : ' disabled') + '" data-unlock-yard="' + y.id + '">' + tr('unlock_cost', { n: fmt(y.unlockCost) }) + '</button>';
        }
      } else if (!selected) {
        actionHtml = '<button type="button" class="btn btn-sm" data-select-yard="' + y.id + '">' + tr('choose') + '</button>';
      } else {
        actionHtml = '<span class="breed-active">' + tr('yard_on') + '</span>';
      }
      card.innerHTML = '<img class="yard-thumb" src="' + y.src + '" alt="' + locn(y) + '" /><div class="yard-body"><div class="yard-name">' + locn(y) + '</div><div class="yard-desc">' + locd(y) + '</div>' + actionHtml + '</div>';
      root.appendChild(card);
    });
    root.querySelectorAll('[data-unlock-yard]').forEach(function (btn) {
      btn.addEventListener('click', function () { unlockYard(btn.getAttribute('data-unlock-yard')); });
    });
    root.querySelectorAll('[data-select-yard]').forEach(function (btn) {
      btn.addEventListener('click', function () { selectYard(btn.getAttribute('data-select-yard')); });
    });
    root.querySelectorAll('[data-yard-advance]').forEach(function (btn) {
      btn.addEventListener('click', function () { tryAdvanceYardStage(); });
    });
  }

  function unlockYard(id) {
    const y = YARDS[id];
    if (!y || state.unlockedYards.indexOf(id) !== -1) return;
    if (y.seasonOnly) { showToast(tr('open_in_season')); return; }
    if (!contentGateOk(y)) { showToast(contentGateText(y) || tr('locked')); return; }
    if (state.ore < y.unlockCost) { showToast(tr('need') + ' 🦴'); return; }
    state.ore -= y.unlockCost;
    state.unlockedYards.push(id);
    if (window.Sounds) window.Sounds.playBuy();
    showToast(tr('yard_open', { name: locn(y) }));
    checkAchievements(); maybeUnlockStory(); renderYards(); renderStats(); scheduleSave();
  }

  function selectYard(id) {
    if (state.unlockedYards.indexOf(id) === -1) return;
    state.selectedYard = id;
    applyYardArt();
    showToast(tr('yard_set', { name: locn(YARDS[id]) }));
    renderYards(); scheduleSave();
  }

  function daySeed() { return localDayKey(); }
  function seededRand(seed, i) {
    let h = 2166136261;
    const str = seed + ':' + i;
    for (let c = 0; c < str.length; c++) { h ^= str.charCodeAt(c); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967296;
  }
  function makeQuestReward(type, target) {
    const streakBonus = 1 + Math.min(0.5, (state.questStreak || 0) * 0.05);
    if (type === 'clicks') return Math.floor((50 + target * 1.8) * streakBonus);
    if (type === 'earn') return Math.floor((target * 0.18 + 120) * streakBonus);
    if (type === 'buy') return Math.floor((220 + target * 80 + state.stats.upgradesBought * 3) * streakBonus);
    return Math.floor(120 * streakBonus);
  }
  function generateQuests(seed) {
    const used = {};
    const list = [];
    for (let i = 0; i < 3; i++) {
      let pick = Math.floor(seededRand(seed, i * 3) * QUEST_POOL.length);
      let guard = 0;
      while (used[pick] && guard < 8) { pick = (pick + 1) % QUEST_POOL.length; guard++; }
      used[pick] = true;
      const tpl = QUEST_POOL[pick];
      const ti = Math.floor(seededRand(seed, i * 3 + 1) * tpl.targets.length);
      const target = tpl.targets[ti];
      list.push({ id: seed + '-' + i + '-' + tpl.type, type: tpl.type, target: target, progress: 0, reward: makeQuestReward(tpl.type, target), label: tpl.label(target), claimed: false });
    }
    return list;
  }
  function ensureQuests() {
    const seed = daySeed();
    if (state.questDaySeed !== seed || !state.quests || state.quests.length === 0) {
      if (state.questDaySeed && state.questDaySeed !== seed) {
        const cleared = (state.questClaimsToday || 0) >= 3 || state.questLastClearDay === state.questDaySeed;
        if (!cleared) state.questStreak = 0;
      }
      state.questDaySeed = seed;
      state.questClaimsToday = 0;
      state.quests = generateQuests(seed);
      return;
    }
    state.quests = state.quests.filter(function (q) {
      return !!(q && !q.claimed);
    });
    while (state.quests.length < 3) {
      const extra = generateQuests(seed + '-fix-' + state.quests.length);
      state.quests.push(extra[0]);
    }
  }
  function bumpQuest(type, amount) {
    ensureQuests();
    ensureDailyGoals();
    const apply = (window.GameCore && window.GameCore.applyTrackedProgress)
      ? window.GameCore.applyTrackedProgress
      : null;
    const qRes = apply ? apply(state.quests, type, amount) : { changed: false };
    const dRes = apply ? apply(state.dailyGoals, type, amount) : { changed: false };
    if (!apply) {
      state.quests.forEach(function (q) {
        if (q.claimed || q.type !== type) return;
        if ((q.progress || 0) >= q.target) return;
        q.progress = Math.min(q.target, (q.progress || 0) + amount);
      });
      bumpDailyGoal(type, amount);
    }
    if (activeTab === 'quests' && (qRes.changed || dRes.changed)) paintQuestProgress();
  }
  function claimQuest(id) {
    const q = state.quests.find(function (x) { return x.id === id; });
    if (!q || q.claimed || q.progress < q.target) return;
    q.claimed = true;
    const reward = Math.max(0, Number(q.reward) || 0);
    q.reward = 0;
    state.ore += reward;
    state.stats.lifetimeBones += reward;
    state.questClaimsToday = (state.questClaimsToday || 0) + 1;
    if (state.questClaimsToday === 3 && state.questLastClearDay !== daySeed()) {
      state.questStreak = (state.questStreak || 0) + 1;
      state.questLastClearDay = daySeed();
      showToast(tr('quest_streak', { n: state.questStreak }));
    }
    if (window.Sounds) window.Sounds.playBuy();
    showToast(tr('quest_done', { n: fmt(reward) }));
    const tpl = QUEST_POOL.find(function (t) { return t.type === q.type; }) || QUEST_POOL[0];
    const ti = Math.floor(Math.random() * tpl.targets.length);
    const target = tpl.targets[ti];
    const idx = state.quests.indexOf(q);
    state.quests[idx] = { id: daySeed() + '-r-' + Date.now() + '-' + tpl.type, type: tpl.type, target: target, progress: 0, reward: makeQuestReward(tpl.type, target), label: tpl.label(target), claimed: false };
    renderQuests(); renderStats(); checkAchievements(); maybeUnlockStory(); scheduleSave();
  }
  function questBarPct(item) {
    const target = item && item.target > 0 ? item.target : 0;
    if (!target) return 0;
    return Math.min(100, Math.floor(((item.progress || 0) / target) * 100));
  }
  function paintOneProgressCard(card, item, kind) {
    if (!card || !item) return;
    const done = !item.claimed && (item.progress || 0) >= item.target;
    card.classList.toggle('done', done);
    card.classList.toggle('claimed', !!item.claimed);
    const bar = card.querySelector('.quest-bar > span');
    if (bar) bar.style.width = questBarPct(item) + '%';
    const meta = card.querySelector('.quest-meta');
    if (meta) {
      const rewardBit = kind === 'quest'
        ? ' · ' + tr('reward_bones', { n: fmt(item.reward) })
        : ' · 🦴 ' + fmt(item.reward);
      meta.textContent = fmt(Math.min(item.progress || 0, item.target)) + ' / ' + fmt(item.target) + rewardBit;
    }
    if (item.claimed) {
      if (!card.querySelector('.breed-active')) {
        const btn = card.querySelector('button');
        if (btn) btn.remove();
        const mark = document.createElement('span');
        mark.className = 'breed-active';
        mark.textContent = tr('claimed');
        card.appendChild(mark);
      }
      return;
    }
    if (done && !card.querySelector('button')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm';
      if (kind === 'quest') btn.setAttribute('data-claim', item.id);
      else btn.setAttribute('data-claim-daily', item.id);
      btn.textContent = tr('claim');
      card.appendChild(btn);
    }
  }
  function paintQuestProgress() {
    const root = $('#quests');
    if (!root) return;
    (state.dailyGoals || []).forEach(function (g) {
      paintOneProgressCard(root.querySelector('[data-daily-id="' + String(g.id).replace(/"/g, '') + '"]'), g, 'daily');
    });
    (state.quests || []).forEach(function (q) {
      paintOneProgressCard(root.querySelector('[data-quest-id="' + String(q.id).replace(/"/g, '') + '"]'), q, 'quest');
    });
  }
  function onQuestsClick(e) {
    const btn = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!btn) return;
    const dailyId = btn.getAttribute('data-claim-daily');
    if (dailyId) { claimDailyGoal(dailyId); return; }
    const questId = btn.getAttribute('data-claim');
    if (questId) claimQuest(questId);
  }
  function renderQuests() {
    ensureQuests();
    ensureDailyGoals();
    const root = $('#quests');
    if (!root) return;
    root.innerHTML = '';
    const dailyHead = document.createElement('div');
    dailyHead.className = 'section-subhead';
    dailyHead.innerHTML = '<strong>' + tr('daily_h') + '</strong> · ' + (state.dailyStreak || 0);
    root.appendChild(dailyHead);
    (state.dailyGoals || []).forEach(function (g) {
      const done = !g.claimed && g.progress >= g.target;
      const card = document.createElement('div');
      card.className = 'quest-card daily-goal' + (done ? ' done' : '') + (g.claimed ? ' claimed' : '');
      card.setAttribute('data-daily-id', g.id);
      const pct = questBarPct(g);
      let btn = '';
      if (g.claimed) btn = '<span class="breed-active">' + tr('claimed') + '</span>';
      else if (done) btn = '<button type="button" class="btn btn-sm" data-claim-daily="' + escapeHtml(g.id) + '">' + tr('claim') + '</button>';
      card.innerHTML = '<div class="quest-title">' + escapeHtml(dLabel(g)) + '</div><div class="quest-bar"><span style="width:' + pct + '%"></span></div><div class="quest-meta">' + fmt(Math.min(g.progress, g.target)) + ' / ' + fmt(g.target) + ' · 🦴 ' + fmt(g.reward) + '</div>' + btn;
      root.appendChild(card);
    });
    const qHead = document.createElement('div');
    qHead.className = 'section-subhead';
    qHead.innerHTML = '<strong>' + tr('tab_quests') + '</strong> · ' + (state.questStreak || 0);
    root.appendChild(qHead);
    state.quests.forEach(function (q) {
      const done = !q.claimed && q.progress >= q.target;
      const card = document.createElement('div');
      card.className = 'quest-card' + (done ? ' done' : '');
      card.setAttribute('data-quest-id', q.id);
      const pct = questBarPct(q);
      card.innerHTML = '<div class="quest-title">' + escapeHtml(qLabel(q)) + '</div><div class="quest-bar"><span style="width:' + pct + '%"></span></div><div class="quest-meta">' + fmt(Math.min(q.progress, q.target)) + ' / ' + fmt(q.target) + ' · ' + tr('reward_bones', { n: fmt(q.reward) }) + '</div>' + (done ? '<button type="button" class="btn btn-sm" data-claim="' + escapeHtml(q.id) + '">' + tr('claim') + '</button>' : '');
      root.appendChild(card);
    });
  }

  function checkAchievements() {
    let any = false;
    ACHIEVEMENTS.forEach(function (a) {
      if (state.achievementsClaimed[a.id]) return;
      if (a.check(state)) any = true;
    });
    if (any && activeTab === 'achievements') renderAchievements();
  }
  function claimAchievement(id) {
    const a = ACHIEVEMENTS.find(function (x) { return x.id === id; });
    if (!a || state.achievementsClaimed[id]) return;
    if (!a.check(state)) return;
    state.achievementsClaimed[id] = true;
    state.ore += a.reward;
    state.stats.lifetimeBones += a.reward;
    if (id === 'clicks_50') grantSticker('paw');
    if (id === 'bones_1k') grantSticker('bone');
    if (id === 'breed_1') grantSticker('heart');
    if (id === 'prestige_1') grantSticker('medal');
    if (window.Sounds) window.Sounds.playBuy();
    showToast(tr('ach_done', { n: fmt(a.reward) }));
    renderAchievements(); renderStats(); maybeUnlockStory(); scheduleSave();
  }
  function renderAchievements() {
    const root = $('#achievements');
    if (!root) return;
    root.innerHTML = '';
    ACHIEVEMENTS.forEach(function (a) {
      const claimed = !!state.achievementsClaimed[a.id];
      const ready = !claimed && a.check(state);
      const card = document.createElement('div');
      card.className = 'ach-card' + (claimed ? ' claimed' : '') + (ready ? ' ready' : '');
      card.innerHTML = '<div class="ach-body"><div class="ach-name">' + locn(a) + '</div><div class="ach-desc">' + locd(a) + '</div><div class="ach-reward">🦴 ' + fmt(a.reward) + '</div></div>' + (claimed ? '<span class="ach-status">✓</span>' : ready ? '<button type="button" class="btn btn-sm" data-ach="' + a.id + '">' + tr('claim') + '</button>' : '<span class="ach-status">…</span>');
      root.appendChild(card);
    });
    root.querySelectorAll('[data-ach]').forEach(function (btn) {
      btn.addEventListener('click', function () { claimAchievement(btn.getAttribute('data-ach')); });
    });
  }

  function isChapterUnlocked(ch) {
    try { return !!ch.unlock(state); } catch (_) { return false; }
  }
  function maybeUnlockStory() { if (activeTab === 'story') renderStory(); }

  function renderStory() {
    const root = $('#story');
    if (!root) return;
    root.innerHTML = '';
    STORY.forEach(function (ch, idx) {
      const unlocked = isChapterUnlocked(ch);
      const read = !!state.storyRead[ch.id];
      const card = document.createElement('div');
      card.className = 'story-card' + (unlocked ? '' : ' locked') + (unlocked && !read ? ' unread' : '') + (read ? ' read' : '');
      let badge = !unlocked ? '<span class="story-badge">🔒</span>' : (!read ? '<span class="story-badge">' + tr('story_new') + '</span>' : '<span class="story-badge">✓</span>');
      card.innerHTML = '<span class="item-icon">' + (idx + 1) + '</span><div class="story-body"><div class="story-name">' + ((window.I18n && I18n.storyOf) ? I18n.storyOf(ch).title : ch.title) + '</div><div class="story-desc">' + (unlocked ? (read ? tr('story_reread') : tr('story_tap')) : tr('story_locked')) + '</div>' + (unlocked ? '<button type="button" class="btn btn-sm" data-story="' + ch.id + '">' + (read ? tr('story_reread_btn') : tr('story_read_btn')) + '</button>' : '') + '</div>' + badge;
      root.appendChild(card);
    });
    root.querySelectorAll('[data-story]').forEach(function (btn) {
      btn.addEventListener('click', function () { openStory(btn.getAttribute('data-story')); });
    });
  }

  function openStory(id) {
    const ch = STORY.find(function (x) { return x.id === id; });
    if (!ch || !isChapterUnlocked(ch)) return;
    storyPlaying = (window.I18n && window.I18n.storyOf) ? window.I18n.storyOf(ch) : ch;
    storyLineIndex = 0;
    const modal = $('#story-modal');
    const title = $('#story-modal-title');
    if (title) title.textContent = storyPlaying.title || ch.title;
    renderStoryLines();
    if (modal) modal.hidden = false;
  }
  function renderStoryLines() {
    const box = $('#story-lines');
    const nextBtn = $('#story-next');
    if (!box || !storyPlaying) return;
    box.innerHTML = '';
    const max = Math.min(storyPlaying.lines.length, storyLineIndex + 1);
    for (let i = 0; i < max; i++) {
      const line = storyPlaying.lines[i];
      const div = document.createElement('div');
      div.className = 'story-line ' + (line.who === 'dog' ? 'dog' : 'narrator');
      const who = document.createElement('span');
      who.className = 'who';
      who.textContent = line.who === 'dog' ? tr('who_dog') : tr('who_narr');
      div.appendChild(who);
      div.appendChild(document.createTextNode(String(line.text == null ? '' : line.text)));
      box.appendChild(div);
    }
    box.scrollTop = box.scrollHeight;
    if (nextBtn) nextBtn.textContent = storyLineIndex >= storyPlaying.lines.length - 1 ? tr('help_ok') : tr('next');
  }
  function advanceStory() {
    if (!storyPlaying) return;
    if (storyLineIndex < storyPlaying.lines.length - 1) { storyLineIndex += 1; renderStoryLines(); return; }
    const id = storyPlaying.id;
    const wasNew = !state.storyRead[id];
    state.storyRead[id] = true;
    storyPlaying = null;
    const modal = $('#story-modal');
    if (modal) modal.hidden = true;
    if (wasNew) {
      if (window.Sounds) window.Sounds.playBuy();
      showToast(tr('chapter_read'));
      if (Object.keys(state.storyRead).length >= 3) grantSticker('heart', true);
      checkAchievements();
    }
    if (activeTab === 'story') renderStory();
    scheduleSave();
  }

  function scheduleNextEvent(fromNow) {
    const span = EVENT_MIN_MS + Math.random() * (EVENT_MAX_MS - EVENT_MIN_MS);
    state.nextEventAt = Date.now() + (fromNow != null ? fromNow : span);
    state.eventReadyType = null;
    hideEventBanner();
  }
  function pickEventType() {
    const pool = ['toy', 'train', 'hide', 'race'];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function eventTitle(type) {
    if (type === 'toy') return '🧸 ' + tr('toy_title');
    if (type === 'train') return '🎓 ' + tr('train_title') + '!';
    if (type === 'hide') return '🃏 ' + tr('hide_title') + '!';
    if (type === 'race') return '🐿️ ' + tr('race_title') + '!';
    return tr('event_bang');
  }
  function showEventBanner(type) {
    state.eventReadyType = type || pickEventType();
    const banner = $('#event-banner');
    const text = $('#event-banner-text');
    if (text) text.textContent = eventTitle(state.eventReadyType);
    if (banner) banner.hidden = false;
    updateSeasonUI();
    updateEventBtn();
  }
  function hideEventBanner() {
    const banner = $('#event-banner');
    if (banner) banner.hidden = true;
    updateSeasonUI();
  }
  function updateEventBtn() {
    const btn = $('#btn-event');
    if (!btn) return;
    if (toyActive || trainActive || hideActive || raceActive) { btn.disabled = true; btn.textContent = tr('event_running'); return; }
    if (state.eventReadyType) { btn.disabled = false; btn.textContent = tr('event_ready'); return; }
    const left = Math.max(0, (state.nextEventAt || 0) - Date.now());
    if (left > 0) {
      btn.disabled = true;
      btn.textContent = tr('event_cd', { n: Math.ceil(left / 60000) });
    } else {
      btn.disabled = false;
      btn.textContent = tr('event');
    }
  }
  function startEvent(forcedType) {
    if (toyActive || trainActive || hideActive || raceActive) return;
    const type = forcedType || state.eventReadyType || pickEventType();
    hideEventBanner();
    state.eventReadyType = null;
    if (type === 'toy') startToyGame();
    else if (type === 'train') startTrainGame();
    else if (type === 'hide') startHideGame();
    else if (type === 'race') startRaceGame();
    else startToyGame();
  }
  function onEventButton() {
    if (toyActive || trainActive || hideActive || raceActive) return;
    if (state.eventReadyType) { startEvent(state.eventReadyType); return; }
    if (!state.nextEventAt || Date.now() >= state.nextEventAt) {
      startEvent(pickEventType());
      return;
    }
    showToast(tr('event_not_ready'));
  }

  function startToyGame() {
    toyActive = true;
    toyTaps = 0;
    toyEndsAt = Date.now() + TOY_DURATION_MS;
    const modal = $('#toy-modal');
    const tapsEl = $('#toy-taps');
    const timerEl = $('#toy-timer');
    if (tapsEl) tapsEl.textContent = '0';
    if (timerEl) timerEl.textContent = '10.0';
    if (modal) modal.hidden = false;
    if (window.Sounds) window.Sounds.playCombo();
    syncBgm();
    function frame() {
      if (!toyActive) return;
      const left = Math.max(0, toyEndsAt - Date.now());
      if (timerEl) timerEl.textContent = (left / 1000).toFixed(1);
      if (left <= 0) { endToyGame(); return; }
      toyRaf = requestAnimationFrame(frame);
    }
    toyRaf = requestAnimationFrame(frame);
    updateEventBtn();
  }
  function toyTap() {
    if (!toyActive) return;
    toyTaps += 1;
    const tapsEl = $('#toy-taps');
    if (tapsEl) tapsEl.textContent = String(toyTaps);
    if (window.Sounds) window.Sounds.playPet();
  }
  function endToyGame() {
    toyActive = false;
    if (toyRaf) cancelAnimationFrame(toyRaf);
    toyRaf = null;
    const modal = $('#toy-modal');
    if (modal) modal.hidden = true;
    const taps = toyTaps;
    toyTaps = 0;
    if (taps > 0) {
      const base = Math.max(1, getClickPower());
      const reward = Math.floor(taps * TOY_REWARD_PER_TAP * Math.max(1, base * 0.15) * EVENT_REWARD_MULT);
      state.ore += reward;
      state.stats.lifetimeBones += reward;
      state.stats.eventsDone = (state.stats.eventsDone || 0) + 1;
      bumpDailyGoal('events', 1);
      grantSticker('ball', true);
      addEventAcorns(0.8);
      if (window.Sounds) window.Sounds.playOffline();
      showToast(tr('toy_found', { n: fmt(reward), taps: taps }));
      checkAchievements(); maybeUnlockStory();
      maybeOfferFullscreen('event');
    } else {
      showToast(tr('toy_miss'));
    }
    scheduleNextEvent();
    renderStats(); updateEventBtn(); scheduleSave();
    syncBgm();
  }

  function addEventAcorns(mult) {
    if (!isSeasonActive()) return 0;
    const gain = Math.max(1, Math.floor(ACORN_EVENT_BASE * (mult || 1) + Math.random() * 6));
    const prev = isFinite(state.acorns) ? state.acorns : 0;
    state.acorns = prev + gain;
    maybeGrantLeafSticker();
    return gain;
  }

  const TRAIN_CMDS = [
    { id: 'sit', key: 'cmd_sit' },
    { id: 'paw', key: 'cmd_paw' },
    { id: 'spin', key: 'cmd_spin' },
    { id: 'speak', key: 'cmd_speak' },
  ];

  function startTrainGame() {
    trainActive = true;
    trainSeq = [];
    for (let i = 0; i < 5; i++) trainSeq.push(TRAIN_CMDS[Math.floor(Math.random() * TRAIN_CMDS.length)].id);
    trainIndex = 0;
    const modal = $('#train-modal');
    if (modal) modal.hidden = false;
    if (window.Sounds) window.Sounds.playCombo();
    updateEventBtn();
    showTrainStep();
    syncBgm();
  }
  function showTrainStep() {
    const stepEl = $('#train-step');
    const prompt = $('#train-prompt');
    const btns = $('#train-btns');
    const status = $('#train-status');
    if (stepEl) stepEl.textContent = tr('train_step', { n: trainIndex + 1 });
    if (status) status.textContent = tr('train_watch');
    trainShowing = true;
    const cmd = TRAIN_CMDS.find(function (c) { return c.id === trainSeq[trainIndex]; });
    if (prompt) prompt.textContent = cmd ? tr(cmd.key) : '?';
    if (btns) btns.innerHTML = '';
    setTimeout(function () {
      if (!trainActive) return;
      if (prompt) prompt.textContent = tr('train_turn');
      if (status) status.textContent = tr('train_pick');
      trainShowing = false;
      if (!btns) return;
      btns.innerHTML = '';
      const shuffled = TRAIN_CMDS.slice().sort(function () { return Math.random() - 0.5; });
      shuffled.forEach(function (c) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn';
        b.textContent = tr(c.key);
        b.addEventListener('click', function () { answerTrain(c.id); });
        btns.appendChild(b);
      });
    }, 900);
  }
  function answerTrain(id) {
    if (!trainActive || trainShowing) return;
    if (id !== trainSeq[trainIndex]) {
      if (window.Sounds) window.Sounds.playPet();
      showToast(tr('train_miss'));
      showTrainStep();
      return;
    }
    if (window.Sounds) window.Sounds.playBuy();
    trainIndex += 1;
    if (trainIndex >= trainSeq.length) { endTrainGame(true); return; }
    showTrainStep();
  }
  function endTrainGame(success) {
    trainActive = false;
    const modal = $('#train-modal');
    if (modal) modal.hidden = true;
    if (success) {
      const reward = Math.floor((80 + getOrePerSec() * 8 + getClickPower() * 12 + trainSeq.length * 25) * EVENT_REWARD_MULT);
      state.ore += reward;
      state.stats.lifetimeBones += reward;
      state.stats.eventsDone = (state.stats.eventsDone || 0) + 1;
      bumpDailyGoal('events', 1);
      grantSticker('star', true);
      addEventAcorns(1);
      if (window.Sounds) window.Sounds.playOffline();
      showToast(tr('train_win', { n: fmt(reward) }));
      maybeOfferFullscreen('event');
    }
    scheduleNextEvent();
    checkAchievements(); maybeUnlockStory(); renderStats(); updateEventBtn(); scheduleSave();
    syncBgm();
  }

  function startHideGame() {
    hideActive = true;
    hideCardCount = 3 + Math.floor(Math.random() * 2);
    hideBoneIndex = Math.floor(Math.random() * hideCardCount);
    hideTriesLeft = HIDE_TRIES;
    const modal = $('#hide-modal');
    const status = $('#hide-status');
    const tries = $('#hide-tries');
    const cards = $('#hide-cards');
    if (status) status.textContent = tr('hide_pick');
    if (tries) tries.textContent = tr('hide_tries_n', { n: hideTriesLeft });
    if (cards) {
      cards.innerHTML = '';
      for (let i = 0; i < hideCardCount; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'hide-card';
        b.textContent = '❓';
        b.dataset.idx = String(i);
        b.addEventListener('click', function () { pickHideCard(Number(b.dataset.idx), b); });
        cards.appendChild(b);
      }
    }
    if (modal) modal.hidden = false;
    if (window.Sounds) window.Sounds.playCombo();
    updateEventBtn();
    syncBgm();
  }
  function pickHideCard(idx, btn) {
    if (!hideActive || !btn || btn.classList.contains('flipped')) return;
    btn.classList.add('flipped');
    if (idx === hideBoneIndex) {
      btn.textContent = '🦴';
      btn.classList.add('correct');
      endHideGame(true);
      return;
    }
    btn.textContent = '🍃';
    btn.classList.add('wrong');
    hideTriesLeft -= 1;
    const tries = $('#hide-tries');
    if (tries) tries.textContent = tr('hide_tries_n', { n: hideTriesLeft });
    if (window.Sounds) window.Sounds.playPet();
    if (hideTriesLeft <= 0) {
      const cards = $('#hide-cards');
      if (cards) {
        const correct = cards.children[hideBoneIndex];
        if (correct) { correct.textContent = '🦴'; correct.classList.add('flipped', 'correct'); }
      }
      setTimeout(function () { endHideGame(false); }, 700);
    }
  }
  function endHideGame(success) {
    if (!hideActive) return;
    hideActive = false;
    const modal = $('#hide-modal');
    if (modal) modal.hidden = true;
    if (success) {
      const reward = Math.floor((60 + getClickPower() * 10 + getOrePerSec() * 5) * EVENT_REWARD_MULT);
      state.ore += reward;
      state.stats.lifetimeBones += reward;
      state.stats.eventsDone = (state.stats.eventsDone || 0) + 1;
      bumpDailyGoal('events', 1);
      grantSticker('hide');
      const ac = addEventAcorns(1.1);
      if (window.Sounds) window.Sounds.playOffline();
      showToast(tr('hide_win', { n: fmt(reward) }) + (ac ? ' · 🌰+' + ac : ''));
      maybeOfferFullscreen('event');
    } else {
      showToast(tr('hide_miss'));
    }
    scheduleNextEvent();
    checkAchievements(); maybeUnlockStory(); renderStats(); updateEventBtn(); scheduleSave();
    syncBgm();
  }

  function startRaceGame() {
    raceActive = true;
    raceFill = 12;
    raceEndsAt = Date.now() + RACE_DURATION_MS;
    raceLastTap = 0;
    const modal = $('#race-modal');
    const fill = $('#race-fill');
    const score = $('#race-score');
    const timer = $('#race-timer');
    if (fill) fill.style.width = raceFill + '%';
    if (score) score.textContent = Math.floor(raceFill) + '%';
    if (timer) timer.textContent = '5.0';
    if (modal) modal.hidden = false;
    if (window.Sounds) window.Sounds.playCombo();
    updateEventBtn();
    syncBgm();
    let raceLastFrame = performance.now();
    function frame(now) {
      if (!raceActive) return;
      const dt = Math.min(0.05, Math.max(0.008, ((now || performance.now()) - raceLastFrame) / 1000));
      raceLastFrame = now || performance.now();
      const left = Math.max(0, raceEndsAt - Date.now());
      if (timer) timer.textContent = (left / 1000).toFixed(1);
      raceFill = Math.max(0, raceFill - RACE_DECAY_PER_SEC * dt);
      if (fill) fill.style.width = Math.min(100, raceFill) + '%';
      if (score) score.textContent = Math.floor(Math.min(100, raceFill)) + '%';
      if (left <= 0) { endRaceGame(); return; }
      raceRaf = requestAnimationFrame(frame);
    }
    raceRaf = requestAnimationFrame(frame);
  }
  function raceTap() {
    if (!raceActive) return;
    const now = Date.now();
    if (now - raceLastTap < 40) return;
    raceLastTap = now;
    raceFill = Math.min(100, raceFill + RACE_TAP_GAIN);
    const fill = $('#race-fill');
    const score = $('#race-score');
    if (fill) fill.style.width = raceFill + '%';
    if (score) score.textContent = Math.floor(raceFill) + '%';
    if (window.Sounds) window.Sounds.playPet();
  }
  function endRaceGame(forceFail) {
    if (!raceActive) return;
    raceActive = false;
    if (raceRaf) cancelAnimationFrame(raceRaf);
    raceRaf = null;
    const modal = $('#race-modal');
    if (modal) modal.hidden = true;
    const pct = Math.min(100, raceFill);
    if (!forceFail && pct >= 55) {
      const reward = Math.floor((50 + getClickPower() * 8 + getOrePerSec() * 6 + pct * 1.5) * EVENT_REWARD_MULT);
      state.ore += reward;
      state.stats.lifetimeBones += reward;
      state.stats.eventsDone = (state.stats.eventsDone || 0) + 1;
      bumpDailyGoal('events', 1);
      const ac = addEventAcorns(0.9 + pct / 100);
      if (window.Sounds) window.Sounds.playOffline();
      showToast(tr('race_win', { n: fmt(reward), pct: Math.floor(pct) }) + (ac ? ' · 🌰+' + ac : ''));
      checkAchievements(); maybeUnlockStory();
      maybeOfferFullscreen('event');
    } else {
      showToast(tr('race_miss', { pct: Math.floor(pct) }));
    }
    scheduleNextEvent();
    renderStats(); updateEventBtn(); scheduleSave();
    syncBgm();
  }

  function checkEventTimer() {
    if (toyActive || trainActive || hideActive || raceActive) return;
    if (state.eventReadyType) return;
    if (!state.nextEventAt) { scheduleNextEvent(); return; }
    if (Date.now() >= state.nextEventAt) showEventBanner(pickEventType());
    updateEventBtn();
  }


  function applyNoAdsUi() {
    const btn = $('#btn-ad');
    if (btn) {
      if (state.noAds) {
        btn.textContent = tr('ad_noads');
        btn.classList.add('no-ads');
      } else {
        btn.classList.remove('no-ads');
        if (!btn.disabled) btn.textContent = tr('ad_video');
      }
    }
    if (state.noAds && window.GPBridge && window.GPBridge.hideSticky) {
      try { window.GPBridge.hideSticky(); } catch (_) {}
    }
  }

  function maybeOfferFullscreen(reason) {
    if (state.noAds) return;
    if (!window.GPBridge || typeof window.GPBridge.showFullscreen !== 'function') return;
    // ~20% after prestige / event win (bridge also rate-limits ~180s)
    if (Math.random() > 0.2) return;
    setTimeout(function () {
      window.GPBridge.showFullscreen(false).catch(function () {});
    }, reason === 'prestige' ? 900 : 600);
  }

  function gpProductOwned(p) {
    if (!p || p.kind !== 'permanent') return false;
    if (p.flag === 'noAds') return !!state.noAds;
    if (p.flag === 'vipTreats') return !!state.vipTreats;
    if (p.packCat) return isPackCatOwned(p.packCat);
    return false;
  }

  function appendGpSkillCard(root, p) {
    if (!root || !p) return;
    const owned = gpProductOwned(p);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'upgrade gp-skill' + (owned ? ' owned' : '');
    card.innerHTML = '<span class="up-icon">' + p.icon + '</span><span class="up-body"><span class="up-name">' + locn(p) + '</span><span class="up-desc">' + locd(p) + '</span></span><span class="up-cost iap">' + (owned ? tr('bought') : tr('iap_cost')) + '</span>';
    if (owned) card.disabled = true;
    else card.addEventListener('click', function () { buyGpProduct(p.tag); });
    root.appendChild(card);
  }

  let gpBuyBusy = false;

  async function buyGpProduct(tag) {
    const product = GP_PRODUCTS.find(function (p) { return p.tag === tag; });
    if (!product) return;
    if (gpBuyBusy) { showToast(tr('wait')); return; }
    if (product.kind === 'permanent') {
      if (product.flag === 'noAds' && state.noAds) { showToast(tr('bought')); return; }
      if (product.flag === 'vipTreats' && state.vipTreats) { showToast(tr('bought')); return; }
      if (product.packCat && isPackCatOwned(product.packCat)) { showToast(tr('bought')); return; }
    }
    const bridge = window.GPBridge;
    if (!bridge || typeof bridge.purchase !== 'function') {
      showToast(tr('gpshop_hint'));
      if (window.Sounds && window.Sounds.playError) window.Sounds.playError();
      return;
    }
    gpBuyBusy = true;
    try {
      const res = await bridge.purchase(tag);
      if (!res || !res.ok) {
        const err = res && res.error;
        let msg = tr('buy_fail');
        if (err === 'cancelled') msg = tr('buy_cancel');
        else if (err === 'payments_unavailable') msg = tr('pay_now_na');
        showToast(msg);
        if (window.Sounds && window.Sounds.playError) window.Sounds.playError();
        return;
      }
      if (product.kind === 'consumable') {
        const gain = Number(product.bones) || 0;
        // Grant once per successful purchase, then consume (prevents redelivery loops)
        state.ore += gain;
        state.stats.lifetimeBones += gain;
        bumpQuest('earn', gain);
        await persist();
        if (typeof bridge.consume === 'function') await bridge.consume(tag);
        if (window.Sounds && window.Sounds.playPurchase) window.Sounds.playPurchase();
        else if (window.Sounds) window.Sounds.playBuy();
        showToast(tr('bones_plus', { n: fmt(gain) }));
      } else {
        if (product.flag === 'noAds') state.noAds = true;
        if (product.flag === 'vipTreats') state.vipTreats = true;
        if (product.packCat) {
          grantPackCat(product.packCat);
          hidePackBuyModal();
        }
        applyNoAdsUi();
        await persist();
        if (window.Sounds && window.Sounds.playPurchase) window.Sounds.playPurchase();
        else if (window.Sounds) window.Sounds.playBuy();
        showToast(tr('product_on', { name: locn(product) }));
      }
      checkAchievements();
      renderAll();
    } finally {
      gpBuyBusy = false;
    }
  }

  async function restoreGpPurchases() {
    const bridge = window.GPBridge;
    if (!bridge) return;
    let changed = false;
    try {
      if (typeof bridge.hasPurchase === 'function') {
        if (!state.noAds && (await bridge.hasPurchase('NO_ADS'))) { state.noAds = true; changed = true; }
        if (!state.vipTreats && (await bridge.hasPurchase('VIP_TREATS'))) { state.vipTreats = true; changed = true; }
        for (let i = 0; i < PACK_BRANCHES.length; i++) {
          const b = PACK_BRANCHES[i];
          if (!isPackCatOwned(b.id) && (await bridge.hasPurchase(b.tag))) {
            grantPackCat(b.id);
            changed = true;
          }
        }
      }
      if (typeof bridge.fetchProducts === 'function') {
        const list = await bridge.fetchProducts();
        if (Array.isArray(list)) {
          list.forEach(function (item) {
            const tag = item && (item.tag || (item.product && item.product.tag));
            const price = item && (item.prettyPrice || item.localizedPrice || item.price);
            if (tag && price != null && String(price)) gpPriceByTag[tag] = String(price);
          });
        }
      }
    } catch (_) {}
    applyNoAdsUi();
    if (changed) scheduleSave();
    if (activeTab === 'cards') renderSkillCards();
  }


  /* ——— Energy / Walks / Yard stages / Daily goals / Medal shop ——— */
  function clampEnergy() {
    const max = getEnergyMax();
    if (!isFinite(state.energy) || state.energy < 0) state.energy = 0;
    if (state.energy > max) state.energy = max;
  }
  function regenEnergy(dt) {
    if (state.activeWalk && state.activeWalk.endsAt > Date.now()) return;
    const max = getEnergyMax();
    if (state.energy >= max) return;
    state.energy = Math.min(max, state.energy + getEnergyRegen() * dt);
  }
  function updateEnergyUI() {
    clampEnergy();
    const fill = $('#energy-fill');
    const label = $('#energy-label');
    const max = getEnergyMax();
    const pct = max > 0 ? Math.max(0, Math.min(100, (state.energy / max) * 100)) : 0;
    if (fill) fill.style.width = pct.toFixed(1) + '%';
    if (label) label.textContent = Math.floor(state.energy) + ' / ' + max;
    const restBtn = $('#btn-rest');
    if (restBtn) {
      const now = Date.now();
      if (state.activeWalk) {
        restBtn.disabled = true;
        restBtn.textContent = state.activeWalk.endsAt > now ? tr('rest_after') : tr('claim_walk');
      } else if (now < (state.energyRestReadyAt || 0)) {
        restBtn.disabled = true;
        restBtn.textContent = tr('rest_cd', { n: Math.ceil((state.energyRestReadyAt - now) / 1000) });
      } else if (state.energy >= max - 0.5) {
        restBtn.disabled = true;
        restBtn.textContent = tr('rest');
      } else {
        restBtn.disabled = false;
        restBtn.textContent = tr('rest_plus', { n: ENERGY_REST_GAIN });
      }
    }
    updateWalkUI();
  }
  function doRest() {
    const now = Date.now();
    if (state.activeWalk) {
      showToast(state.activeWalk.endsAt > now ? tr('walk_busy') : tr('claim_walk_first'));
      return;
    }
    if (now < (state.energyRestReadyAt || 0)) { showToast(tr('rest_busy')); return; }
    const max = getEnergyMax();
    if (state.energy >= max - 0.5) { showToast(tr('energy_full')); return; }
    state.energy = Math.min(max, state.energy + ENERGY_REST_GAIN);
    state.energyRestReadyAt = now + ENERGY_REST_COOLDOWN_MS;
    if (window.Sounds) window.Sounds.playBuy();
    showToast(tr('rest_toast', { n: ENERGY_REST_GAIN }));
    updateEnergyUI(); scheduleSave();
  }

  function isWalkUnlocked(tier) {
    if ((state.yardStage || 1) < (tier.unlockStage || 1)) return false;
    if (tier.unlockPrestige && (state.prestigeLevel || 0) < tier.unlockPrestige) return false;
    return true;
  }
  function startWalk(tierId) {
    if (state.activeWalk && state.activeWalk.endsAt > Date.now()) {
      showToast(tr('already_walk')); return;
    }
    // claim finished walk first
    if (state.activeWalk && state.activeWalk.endsAt <= Date.now()) {
      completeWalk(true); return;
    }
    const tier = WALK_TIERS.find(function (t) { return t.id === tierId; }) || WALK_TIERS[0];
    if (!isWalkUnlocked(tier)) {
      showToast(tier.unlockPrestige ? tr('need_stage_show', { n: tier.unlockStage }) : tr('need_stage', { n: tier.unlockStage }));
      return;
    }
    if (state.energy < tier.energy) { showToast(tr('low_energy')); return; }
    if (state.ore < tier.boneCost) { showToast(tr('need') + ' 🦴'); return; }
    state.energy -= tier.energy;
    state.ore -= tier.boneCost;
    state.activeWalk = { tierId: tier.id, endsAt: Date.now() + tier.durationMs, startedAt: Date.now() };
    showToast(tr('walk_start', { icon: tier.icon, name: locn(tier), mins: (tier.durationMs % 60000 ? (tier.durationMs / 60000).toFixed(1) : String(Math.round(tier.durationMs / 60000))) }));
    updateEnergyUI(); renderStats(); scheduleSave();
  }
  function walkRewardBones(tier) {
    const secs = tier.durationMs / 1000;
    const base = Math.max(8, getOrePerSec() * secs * 0.55 + getClickPower() * 14);
    const trainWalk = 1 + getTrainingSum('walkRewardPct');
    return Math.floor(base * tier.rewardMult * (1 + (state.yardStage || 1) * 0.03) * trainWalk);
  }
  function completeWalk(fromClaim) {
    const walk = state.activeWalk;
    if (!walk) return;
    if (Date.now() < walk.endsAt) return;
    const tier = WALK_TIERS.find(function (t) { return t.id === walk.tierId; }) || WALK_TIERS[0];
    state.activeWalk = null;
    const reward = walkRewardBones(tier);
    state.ore += reward;
    state.stats.lifetimeBones += reward;
    state.stats.walksDone = (state.stats.walksDone || 0) + 1;
    bumpDailyGoal('walks', 1);
    let extra = '';
    if (Math.random() < tier.stickerChance) {
      const pool = ['paw', 'bone', 'leaf', 'ball'];
      const sid = pool[Math.floor(Math.random() * pool.length)];
      if (grantSticker(sid, true)) extra += ' · ' + tr('sticker_bang');
    }
    if (isSeasonActive() && Math.random() < tier.acornChance) {
      const ac = 2 + Math.floor(Math.random() * 5);
      state.acorns = (isFinite(state.acorns) ? state.acorns : 0) + ac;
      extra += ' · 🌰+' + ac;
    }
    // walk restores some energy
    state.energy = Math.min(getEnergyMax(), state.energy + 12 + tier.energy * 0.25);
    showToast(tr('walk_back', { n: fmt(reward) }) + extra);
    checkAchievements(); maybeUnlockStory(); updateEnergyUI(); renderStats();
    if (activeTab === 'quests') renderQuests();
    scheduleSave();
  }
  function updateWalkUI() {
    const btn = $('#btn-walk');
    const meta = $('#walk-meta');
    if (!btn) return;
    if (state.activeWalk) {
      const left = state.activeWalk.endsAt - Date.now();
      if (left <= 0) {
        btn.disabled = false;
        btn.textContent = tr('claim') + '!';
        btn.dataset.walkAction = 'claim';
        if (meta) meta.textContent = tr('walk');
      } else {
        btn.disabled = true;
        const m = Math.floor(left / 60000);
        const s = Math.ceil((left % 60000) / 1000);
        btn.textContent = tr('walking', { clock: m + ':' + String(s).padStart(2, '0') });
        btn.dataset.walkAction = 'busy';
        if (meta) {
          const tier = WALK_TIERS.find(function (t) { return t.id === state.activeWalk.tierId; });
          const total = (tier && tier.durationMs) || 1;
          const started = state.activeWalk.startedAt || (state.activeWalk.endsAt - total);
          const pct = Math.max(0, Math.min(100, ((Date.now() - started) / total) * 100));
          meta.textContent = (tier ? tier.icon + ' ' + locn(tier) : tr('walk')) + ' · ' + Math.floor(pct) + '%';
        }
      }
      return;
    }
    btn.disabled = false;
    btn.textContent = tr('walk');
    btn.dataset.walkAction = 'menu';
    if (meta) meta.textContent = tr('walk_meta');
  }
  function onWalkButton() {
    if (state.activeWalk && state.activeWalk.endsAt <= Date.now()) {
      completeWalk(true); return;
    }
    if (state.activeWalk) { showToast(tr('still_walk')); return; }
    openWalkSheet();
  }
  function openWalkSheet() {
    const sheet = $('#walk-sheet');
    const list = $('#walk-sheet-list');
    if (!sheet || !list) {
      startWalk('short');
      return;
    }
    list.innerHTML = '';
    WALK_TIERS.forEach(function (t) {
      const unlocked = isWalkUnlocked(t);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'walk-tier-btn' + (unlocked ? '' : ' locked');
      row.disabled = !unlocked;
      const mins = (t.durationMs / 60000).toFixed(t.durationMs % 60000 ? 1 : 0);
      row.innerHTML = '<span class="walk-tier-ico">' + t.icon + '</span><span class="walk-tier-body"><strong>' + locn(t) + '</strong><small>' + tr('walk_row', { mins: mins, energy: t.energy, cost: fmt(t.boneCost) }) + (!unlocked ? ' · ' + tr('walk_stage', { n: t.unlockStage }) : '') + '</small></span>';
      if (unlocked) row.addEventListener('click', function () { sheet.hidden = true; startWalk(t.id); });
      list.appendChild(row);
    });
    sheet.hidden = false;
  }

  function currentYardStageDef() {
    return YARD_STAGES.find(function (x) { return x.level === (state.yardStage || 1); }) || YARD_STAGES[0];
  }
  function nextYardStageDef() {
    const cur = state.yardStage || 1;
    return YARD_STAGES.find(function (x) { return x.level === cur + 1; }) || null;
  }
  function buildYardStageCard() {
    const wrap = document.createElement('div');
    wrap.className = 'yard-stage-card';
    const cur = currentYardStageDef();
    const next = nextYardStageDef();
    let pct = 100;
    let meta = tr('stage_max');
    let can = false;
    if (next) {
      const lifeNeed = next.reqLifetime || 1;
      const lifePct = Math.min(100, Math.floor(((state.stats.lifetimeBones || 0) / lifeNeed) * 100));
      pct = lifePct;
      meta = tr('stage_to', { n: next.level, have: fmt(state.stats.lifetimeBones), need: fmt(next.reqLifetime) });
      if (next.reqPrestige) meta += ' · ' + tr('stage_shows', { have: (state.prestigeLevel || 0), need: next.reqPrestige });
      can = (state.stats.lifetimeBones || 0) >= next.reqLifetime && (state.prestigeLevel || 0) >= (next.reqPrestige || 0);
    }
    wrap.innerHTML = '<div class="yard-stage-title">' + tr('yard_stage_title', { n: cur.level, title: locStageTitle(cur) }) + '</div><div class="quest-bar"><span style="width:' + pct + '%"></span></div><div class="yard-stage-meta">' + meta + '</div><div class="yard-stage-hook">' + locStageHook(cur) + ' · ' + tr('income_bonus', { n: cur.incomeMult.toFixed(2) }) + '</div>' + (next ? '<button type="button" class="btn btn-sm' + (can ? '' : ' disabled') + '" data-yard-advance="1">' + (can ? tr('open_stage', { n: next.level }) : tr('too_soon')) + '</button>' : '');
    return wrap;
  }
  function tryAdvanceYardStage() {
    const next = nextYardStageDef();
    if (!next) { showToast(tr('already_max')); return; }
    if ((state.stats.lifetimeBones || 0) < next.reqLifetime) { showToast(tr('need_more_bones')); return; }
    if ((state.prestigeLevel || 0) < (next.reqPrestige || 0)) { showToast(tr('need_more_shows')); return; }
    state.yardStage = next.level;
    if (window.Sounds) window.Sounds.playBuy();
    showToast(tr('stage_unlock', { n: next.level, title: locStageTitle(next) }));
    checkAchievements(); maybeUnlockStory();
    if (activeTab === 'yard') renderYards();
    if (activeTab === 'prestige') renderPrestige();
    renderStats(); scheduleSave();
  }
  function syncYardStageFromProgress() {
    // auto-unlock stages player already qualifies for (migration-friendly)
    let advanced = false;
    while (true) {
      const next = nextYardStageDef();
      if (!next) break;
      if ((state.stats.lifetimeBones || 0) < next.reqLifetime) break;
      if ((state.prestigeLevel || 0) < (next.reqPrestige || 0)) break;
      state.yardStage = next.level;
      advanced = true;
    }
    return advanced;
  }

  function generateDailyGoals(seed) {
    const used = {};
    const list = [];
    for (let i = 0; i < 3; i++) {
      let pick = Math.floor(seededRand(seed, i * 5) * DAILY_GOAL_POOL.length);
      let guard = 0;
      while (used[pick] && guard < 10) { pick = (pick + 1) % DAILY_GOAL_POOL.length; guard++; }
      used[pick] = true;
      const tpl = DAILY_GOAL_POOL[pick];
      const ti = Math.floor(seededRand(seed, i * 5 + 1) * tpl.targets.length);
      const target = tpl.targets[ti];
      const reward = tpl.rewardBones[Math.min(ti, tpl.rewardBones.length - 1)];
      list.push({ id: seed + '-dg-' + i + '-' + tpl.type, type: tpl.type, target: target, progress: 0, reward: reward, label: tpl.label(target), claimed: false });
    }
    return list;
  }
  function ensureDailyGoals() {
    const key = localDayKey();
    if (state.dailyDayKey !== key) {
      if (state.dailyDayKey) {
        const cleared = state.dailyLastClearDay === state.dailyDayKey
          || ((state.dailyGoals || []).length > 0 && (state.dailyGoals || []).every(function (g) { return g.claimed; }));
        if (!cleared) state.dailyStreak = 0;
      }
      state.dailyDayKey = key;
      state.dailyGoals = generateDailyGoals(key);
    }
    if (!Array.isArray(state.dailyGoals) || state.dailyGoals.length === 0) {
      state.dailyGoals = generateDailyGoals(key);
    }
  }
  function bumpDailyGoal(type, amount) {
    ensureDailyGoals();
    const apply = window.GameCore && window.GameCore.applyTrackedProgress;
    const res = apply
      ? apply(state.dailyGoals, type, amount)
      : { changed: false };
    if (!apply) {
      (state.dailyGoals || []).forEach(function (g) {
        if (g.claimed || g.type !== type) return;
        if ((g.progress || 0) >= g.target) return;
        g.progress = Math.min(g.target, (g.progress || 0) + amount);
        res.changed = true;
      });
    }
    if (res.changed && activeTab === 'quests') paintQuestProgress();
  }
  function claimDailyGoal(id) {
    ensureDailyGoals();
    const g = (state.dailyGoals || []).find(function (x) { return x.id === id; });
    if (!g || g.claimed || g.progress < g.target) return;
    g.claimed = true;
    const streakMult = 1 + Math.min(0.6, (state.dailyStreak || 0) * 0.06);
    const reward = Math.floor((Number(g.reward) || 0) * streakMult);
    state.ore += reward;
    state.stats.lifetimeBones += reward;
    if (window.Sounds) window.Sounds.playBuy();
    showToast(tr('daily_done', { n: fmt(reward) }));
    const allClaimed = state.dailyGoals.every(function (x) { return x.claimed; });
    if (allClaimed) {
      if (state.dailyLastClearDay !== state.dailyDayKey) {
        state.dailyStreak = (state.dailyStreak || 0) + 1;
        state.dailyLastClearDay = state.dailyDayKey;
      }
      showToast(tr('daily_all', { n: state.dailyStreak }));
    }
    checkAchievements(); renderQuests(); renderStats(); scheduleSave();
  }

  function medalUpgradeCost(item) {
    const lvl = getMedalLevel(item.id);
    return Math.max(1, Math.floor(item.baseCost * Math.pow(item.costMult, lvl)));
  }
  function buyMedalUpgrade(id) {
    const item = MEDAL_SHOP.find(function (x) { return x.id === id; });
    if (!item) return;
    const lvl = getMedalLevel(id);
    if (lvl >= item.maxLevel) { showToast(tr('max_lvl')); return; }
    const cost = medalUpgradeCost(item);
    if ((state.medals || 0) < cost) { showToast(tr('few_medals')); return; }
    state.medals -= cost;
    if (!state.medalUpgrades) state.medalUpgrades = {};
    state.medalUpgrades[id] = lvl + 1;
    if (window.Sounds) window.Sounds.playBuy();
    showToast(tr('medal_lvl', { name: locn(item), n: lvl + 1 }));
    clampEnergy();
    renderPrestige(); renderStats(); scheduleSave();
  }

  function canPrestige() { return state.stats.lifetimeBones >= getPrestigeRequirement(); }

  function medalsGainOnPrestige() {
    const req = getPrestigeRequirement();
    const life = Math.max(req, state.stats.lifetimeBones);
    const base = 1 + Math.max(0, Math.floor(Math.log10(life / req)));
    const bonus = 1 + getTrainingSum('medalYield');
    return Math.max(1, Math.floor(base * bonus));
  }
  function renderPrestige() {
    const info = $('#prestige-info');
    const btn = $('#btn-prestige');
    const req = getPrestigeRequirement();
    if (info) {
      info.innerHTML = tr('prestige_info', { medals: state.medals, shows: state.prestigeLevel, flat: Math.round(state.medals * PRESTIGE_MEDAL_INCOME * 100), life: fmt(state.stats.lifetimeBones), need: fmt(req), stage: (state.yardStage || 1), off: Math.round(getOfflineEfficiency() * 100), cap: Math.round(getOfflineCapSec() / 3600) });
    }
    if (btn) {
      btn.disabled = !canPrestige();
      btn.textContent = canPrestige() ? tr('hold_show_plus', { n: medalsGainOnPrestige() }) : tr('need_life_bones', { n: fmt(req) });
    }
    const shop = $('#medal-shop');
    if (shop) {
      shop.innerHTML = '<h3 class="shop-subhead">' + tr('medal_shop_h') + '</h3><p class="panel-hint">' + tr('medal_shop_hint', { pct: Math.round(PRESTIGE_MEDAL_INCOME * 100) }) + '</p>';
      MEDAL_SHOP.forEach(function (item) {
        const lvl = getMedalLevel(item.id);
        const maxed = lvl >= item.maxLevel;
        const cost = medalUpgradeCost(item);
        const can = !maxed && state.medals >= cost;
        const card = document.createElement('div');
        card.className = 'upgrade' + (can ? '' : ' disabled');
        card.innerHTML = '<span class="up-icon">' + item.icon + '</span><span class="up-body"><span class="up-name">' + locn(item) + ' <em>' + tr('lvl') + lvl + '/' + item.maxLevel + '</em></span><span class="up-desc">' + locd(item) + '</span></span><span class="up-cost">' + (maxed ? 'MAX' : '🏅 ' + cost) + '</span>';
        if (can) card.addEventListener('click', function () { buyMedalUpgrade(item.id); });
        shop.appendChild(card);
      });
      const stageWrap = document.createElement('div');
      stageWrap.className = 'yard-stage-wrap';
      stageWrap.appendChild(buildYardStageCard());
      shop.appendChild(stageWrap);
      shop.querySelectorAll('[data-yard-advance]').forEach(function (b) {
        b.addEventListener('click', function () { tryAdvanceYardStage(); });
      });
    }
  }
  function openPrestigeModal() {
    if (!canPrestige()) { showToast(tr('prestige_soon')); return; }
    const modal = $('#prestige-modal');
    const text = $('#prestige-confirm-text');
    const gain = medalsGainOnPrestige();
    if (text) {
      text.textContent = tr('prestige_confirm_text', { gain: gain, pct: Math.round(gain * PRESTIGE_MEDAL_INCOME * 100) });
    }
    if (modal) modal.hidden = false;
  }
  function doPrestige() {
    if (!canPrestige()) return;
    const gain = medalsGainOnPrestige();
    if (!isFinite(gain) || gain < 1) return;
    state.medals = (isFinite(state.medals) ? state.medals : 0) + gain;
    state.prestigeLevel = (isFinite(state.prestigeLevel) ? state.prestigeLevel : 0) + 1;
    state.ore = 0;
    state.levels = defaultLevels();
    state.levelsCards = defaultCardLevels();
    state.pendingClickMult = 1;
    state.adBoostUntil = 0;
    state.joyUntil = 0;
    state.joyReadyAt = 0;
    state.combo = 1;
    state.lastClickAt = 0;
    lastComboMilestone = 1;
    state.activeItem = null;
    state.seasonBoostUntil = 0;
    state.energy = getEnergyMax();
    state.activeWalk = null;
    grantSticker('medal', true);
    syncYardStageFromProgress();
    if (window.Sounds && window.Sounds.playPrestige) window.Sounds.playPrestige();
    else if (window.Sounds) window.Sounds.playOffline();
    showToast(tr('prestige_toast', { n: gain, total: state.medals }));
    const modal = $('#prestige-modal');
    if (modal) modal.hidden = true;
    checkAchievements(); maybeUnlockStory(); renderAll(); scheduleSave();
    maybeOfferFullscreen('prestige');
  }


  function renderStats() {
    const oreEl = $('#stat-ore');
    const opsEl = $('#stat-ops');
    const clickEl = $('#stat-click');
    const boostEl = $('#boost-badge');
    const comboEl = $('#combo-badge');
    const itemEl = $('#item-badge');
    const medalsEl = $('#stat-medals');
    const acornsEl = $('#stat-acorns');
    const joyBtn = $('#btn-joy');
    if (oreEl) oreEl.textContent = fmt(state.ore);
    if (opsEl) opsEl.textContent = fmt(getOrePerSec()) + tr('per_sec');
    if (clickEl) clickEl.textContent = fmt(getClickPower() * (state.pendingClickMult > 1 ? state.pendingClickMult : 1));
    if (medalsEl) medalsEl.textContent = String(state.medals);
    if (acornsEl) acornsEl.textContent = fmt(isFinite(state.acorns) ? state.acorns : 0);
    updateSeasonUI();
    if (boostEl) {
      const parts = [];
      if (state.pendingClickMult > 1) parts.push(tr('click_ready'));
      if (Date.now() < state.adBoostUntil) parts.push(tr('idle_x2', { n: Math.ceil((state.adBoostUntil - Date.now()) / 1000) }));
      if (Date.now() < state.joyUntil) parts.push(tr('joy_x2n', { n: Math.ceil((state.joyUntil - Date.now()) / 1000) }));
      if (Date.now() < (state.seasonBoostUntil || 0)) parts.push(tr('autumn_xn', { n: Math.ceil((state.seasonBoostUntil - Date.now()) / 1000) }));
      boostEl.hidden = parts.length === 0;
      if (parts.length) boostEl.textContent = parts.join(' · ');
    }
    if (itemEl) {
      if (state.activeItem && Date.now() < state.activeItem.until) {
        itemEl.hidden = false;
        itemEl.textContent = tr('item_x2', { n: Math.ceil((state.activeItem.until - Date.now()) / 1000) });
      } else {
        itemEl.hidden = true;
        if (state.activeItem && Date.now() >= state.activeItem.until) state.activeItem = null;
      }
    }
    if (comboEl) {
      const c = Math.min(COMBO_MAX, state.combo);
      const show = c >= 1.15 && Date.now() - state.lastClickAt < getComboWindow() + 400;
      comboEl.hidden = !show;
      if (show) comboEl.textContent = tr('combo_x', { n: c.toFixed(1) });
    }
    if (joyBtn) {
      const now = Date.now();
      if (now < state.joyUntil) { joyBtn.disabled = true; joyBtn.textContent = tr('joy_on', { n: Math.ceil((state.joyUntil - now) / 1000) }); }
      else if (now < state.joyReadyAt) { joyBtn.disabled = true; joyBtn.textContent = tr('joy_cd', { n: Math.ceil((state.joyReadyAt - now) / 1000) }); }
      else { joyBtn.disabled = false; joyBtn.textContent = tr('joy'); }
    }
    updateEnergyUI();
  }

  function renderAll() {
    applyBreedArt();
    applyYardArt();
    applyFriendArt();
    updateSeasonUI();
    renderStats();
    updateEnergyUI();
    renderActivePanel();
    updateEventBtn();
  }

  function updateCombo() {
    const now = Date.now();
    const windowMs = getComboWindow();
    if (state.lastClickAt && now - state.lastClickAt <= windowMs) {
      state.combo = Math.min(COMBO_MAX, state.combo + COMBO_STEP);
      const milestone = Math.floor(state.combo * 2) / 2;
      if (milestone >= 1.5 && milestone > lastComboMilestone) {
        lastComboMilestone = milestone;
        if (window.Sounds && window.Sounds.playCombo) window.Sounds.playCombo();
      }
    } else { state.combo = 1; lastComboMilestone = 1; }
    state.lastClickAt = now;
  }
  function decayCombo(dt) {
    if (!state.lastClickAt) return;
    if (Date.now() - state.lastClickAt > getComboWindow()) {
      state.combo = Math.max(1, state.combo - COMBO_DECAY_PER_SEC * dt);
      if (state.combo <= 1.02) { state.combo = 1; lastComboMilestone = 1; }
    }
  }

  function mineClick(ev) {
    if (!ready || destroyed) return;
    updateCombo();
    clampEnergy();
    const power = getClickPower() * state.pendingClickMult;
    state.ore += power;
    state.stats.totalClicks += 1;
    state.stats.lifetimeBones += power;
    state.energy = Math.max(0, state.energy - ENERGY_PER_CLICK);
    if (isSeasonActive()) {
      const prev = isFinite(state.acorns) ? state.acorns : 0;
      state.acorns = prev + ACORN_PER_CLICK;
      if (state.stats.totalClicks % 25 === 0) maybeGrantLeafSticker();
    }
    bumpQuest('clicks', 1);
    bumpQuest('earn', power);
    if (state.pendingClickMult > 1) { state.pendingClickMult = 1; showToast(tr('double_used')); }
    const btn = $('#mine-btn');
    if (btn) {
      btn.classList.remove('clicked', 'pulse', 'wag');
      void btn.offsetWidth;
      btn.classList.add('clicked');
      if (Math.random() < 0.28 || state.combo >= 1.5) btn.classList.add('wag');
      setTimeout(function () { btn.classList.remove('clicked', 'wag'); }, 240);
    }
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.35;
    if (ev && typeof ev.clientX === 'number') { x = ev.clientX; y = ev.clientY - 20; }
    const comboTag = state.combo >= 1.2 ? ' x' + Math.min(COMBO_MAX, state.combo).toFixed(1) : '';
    spawnPopup(x, y, '+' + fmt(power) + ' 🦴' + comboTag);
    spawnClickFx(x, y + 10);
    if (window.Sounds) window.Sounds.playPet();
    checkAchievements(); maybeUnlockStory(); renderStats(); updateEnergyUI();
  }

  function buyUpgrade(id) {
    if (!isUpgradeUnlocked(id)) {
      showToast(unlockReqText(UPGRADES[id] && UPGRADES[id].unlock) || tr('locked'));
      if (window.Sounds && window.Sounds.playError) window.Sounds.playError();
      return;
    }
    const cost = upgradeCost(id);
    if (state.ore < cost) {
      showToast(tr('need') + ' 🦴');
      if (window.Sounds && window.Sounds.playError) window.Sounds.playError();
      return;
    }
    state.ore -= cost;
    state.levels[id] = (state.levels[id] || 0) + 1;
    state.stats.upgradesBought += 1;
    bumpQuest('buy', 1);
    if (window.Sounds) window.Sounds.playBuy();
    checkAchievements(); maybeUnlockStory(); renderAll(); scheduleSave();
  }

  function buyTraining(id) {
    if (!isTrainingUnlocked(id)) {
      showToast(trainingUnlockText(id) || tr('locked'));
      if (window.Sounds && window.Sounds.playError) window.Sounds.playError();
      return;
    }
    const cost = trainingCost(id);
    if (state.ore < cost) {
      showToast(tr('need') + ' 🦴');
      if (window.Sounds && window.Sounds.playError) window.Sounds.playError();
      return;
    }
    state.ore -= cost;
    state.levelsTraining[id] = (state.levelsTraining[id] || 0) + 1;
    state.stats.upgradesBought += 1;
    bumpQuest('buy', 1);
    if (window.Sounds) window.Sounds.playBuy();
    checkAchievements(); maybeUnlockStory(); renderAll(); scheduleSave();
  }

  function activateJoy() {
    const now = Date.now();
    if (now < state.joyReadyAt || now < state.joyUntil) { showToast(tr('joy_rest')); return; }
    state.joyUntil = now + JOY_DURATION_MS;
    state.joyReadyAt = state.joyUntil + JOY_COOLDOWN_MS;
    showToast(tr('joy_toast'));
    if (window.Sounds) window.Sounds.playBuy();
    renderStats(); scheduleSave();
  }

  let rewardBusy = false;

  async function onRewarded() {
    const bridge = window.GPBridge;
    if (!bridge || rewardBusy) return;
    rewardBusy = true;
    const btn = $('#btn-ad');
    if (btn) btn.disabled = true;
    try {
      let ok = false;
      if (state.noAds) {
        ok = true;
      } else {
        ok = await bridge.showRewarded();
      }
      if (!ok) {
        showToast(tr('video_skip'));
        if (window.Sounds && window.Sounds.playError) window.Sounds.playError();
        return;
      }
      state.pendingClickMult = AD_BOOST_MULT;
      state.adBoostUntil = Date.now() + AD_BOOST_DURATION_MS;
      if (window.Sounds && window.Sounds.playReward) window.Sounds.playReward();
      else if (window.Sounds) window.Sounds.playBuy();
      showToast(state.noAds ? tr('noads_bonus') : tr('ad_bonus'));
      renderStats(); scheduleSave();
    } finally {
      rewardBusy = false;
      if (btn) btn.disabled = false;
      applyNoAdsUi();
    }
  }

  async function manualSave() { await persist(); showToast(tr('saved')); }

  function serialize() {
    const now = Date.now();
    const adUntil = Number(state.adBoostUntil) || 0;
    const joyUntil = Number(state.joyUntil) || 0;
    const joyReady = Number(state.joyReadyAt) || 0;
    const seasonUntil = Number(state.seasonBoostUntil) || 0;
    let activeItem = state.activeItem;
    if (activeItem && (!(Number(activeItem.until) > now) || !CONSUMABLES[activeItem.id])) activeItem = null;
    return {
      v: SAVE_VERSION,
      ore: state.ore,
      levels: Object.assign(defaultLevels(), state.levels),
      levelsTraining: Object.assign(defaultTrainingLevels(), state.levelsTraining || {}),
      levelsCards: Object.assign(defaultCardLevels(), state.levelsCards || {}),
      packUnlocked: Object.assign(defaultPackUnlocks(), state.packUnlocked || {}),
      packPaid: Object.assign(defaultPackUnlocks(), state.packPaid || {}),
      lastSaveAt: now,
      adBoostUntil: adUntil > now ? adUntil : 0,
      pendingClickMult: state.pendingClickMult > 1 ? state.pendingClickMult : 1,
      prestigeLevel: state.prestigeLevel,
      medals: state.medals,
      selectedBreed: state.selectedBreed,
      unlockedBreeds: state.unlockedBreeds.slice(),
      selectedYard: state.selectedYard,
      unlockedYards: state.unlockedYards.slice(),
      stats: {
        totalClicks: state.stats.totalClicks,
        lifetimeBones: state.stats.lifetimeBones,
        upgradesBought: state.stats.upgradesBought,
        eventsDone: state.stats.eventsDone || 0,
        walksDone: state.stats.walksDone || 0,
      },
      achievementsClaimed: Object.assign({}, state.achievementsClaimed),
      quests: state.quests,
      questDaySeed: state.questDaySeed,
      questStreak: Number(state.questStreak) || 0,
      questLastClearDay: state.questLastClearDay || '',
      questClaimsToday: Number(state.questClaimsToday) || 0,
      joyUntil: joyUntil > now ? joyUntil : 0,
      joyReadyAt: joyReady > now ? joyReady : 0,
      inventory: Object.assign({ boneBoost: 0 }, state.inventory || {}),
      activeItem: activeItem,
      storyRead: Object.assign({}, state.storyRead || {}),
      nextEventAt: state.nextEventAt,
      eventReadyType: state.eventReadyType,
      stickers: (state.stickers || []).slice(),
      stickerSetsClaimed: Object.assign({}, state.stickerSetsClaimed || {}),
      unlockedFriends: (state.unlockedFriends || []).slice(),
      activeFriend: state.activeFriend,
      acorns: isFinite(state.acorns) ? Math.max(0, Math.round(state.acorns * 1000) / 1000) : 0,
      seasonBoostUntil: seasonUntil > now ? seasonUntil : 0,
      seasonPurchases: Object.assign({}, state.seasonPurchases || {}),
      noAds: !!state.noAds,
      vipTreats: !!state.vipTreats,
      medalUpgrades: Object.assign({}, state.medalUpgrades || {}),
      energy: isFinite(state.energy) ? Math.max(0, state.energy) : ENERGY_MAX_BASE,
      energyRestReadyAt: Number(state.energyRestReadyAt) || 0,
      activeWalk: state.activeWalk && state.activeWalk.endsAt ? { tierId: String(state.activeWalk.tierId || 'short'), endsAt: Number(state.activeWalk.endsAt) || 0, startedAt: Number(state.activeWalk.startedAt) || 0 } : null,
      yardStage: Math.max(1, Number(state.yardStage) || 1),
      dailyGoals: Array.isArray(state.dailyGoals) ? state.dailyGoals : [],
      dailyDayKey: state.dailyDayKey || '',
      dailyStreak: Number(state.dailyStreak) || 0,
      dailyLastClearDay: state.dailyLastClearDay || '',
      cardComboDay: state.cardComboDay || '',
      cardComboHits: Object.assign({}, state.cardComboHits || {}),
      cardComboClaimed: !!state.cardComboClaimed,
    };
  }

  function migrateSave(data) {
    if (!data || typeof data !== 'object') return null;
    let out;
    if (window.GameCore && window.GameCore.applyVersionMigrations) {
      out = window.GameCore.applyVersionMigrations(data, SAVE_VERSION, { energyMaxBase: ENERGY_MAX_BASE });
    } else {
      out = window.GameCore && window.GameCore.normalizeSave
        ? window.GameCore.normalizeSave(data)
        : Object.assign({}, data);
    }
    if (!out) return null;
    // Training tree:    // Training tree: default 0s, never wipe existing progress
    {
      const baseT = defaultTrainingLevels();
      const srcT = (out.levelsTraining && typeof out.levelsTraining === 'object' && !Array.isArray(out.levelsTraining)) ? out.levelsTraining : {};
      out.levelsTraining = Object.assign(baseT, srcT);
      for (let i = 0; i < TRAINING_ORDER.length; i++) {
        const id = TRAINING_ORDER[i];
        const n = Number(out.levelsTraining[id]);
        out.levelsTraining[id] = isFinite(n) && n > 0 ? Math.floor(n) : 0;
      }
    }
    // New shop upgrades default to 0 via defaultLevels merge (no wipe)
    out.levels = Object.assign(defaultLevels(), out.levels || {});
    {
      const baseC = defaultCardLevels();
      const srcC = (out.levelsCards && typeof out.levelsCards === 'object' && !Array.isArray(out.levelsCards)) ? out.levelsCards : {};
      out.levelsCards = Object.assign(baseC, srcC);
      for (let i = 0; i < SKILL_CARD_IDS.length; i++) {
        const id = SKILL_CARD_IDS[i];
        const n = Number(out.levelsCards[id]);
        out.levelsCards[id] = isFinite(n) && n > 0 ? Math.floor(n) : 0;
      }
      out.cardComboDay = out.cardComboDay || '';
      out.cardComboHits = (out.cardComboHits && typeof out.cardComboHits === 'object' && !Array.isArray(out.cardComboHits)) ? out.cardComboHits : {};
      out.cardComboClaimed = !!out.cardComboClaimed;
    }
    {
      const packs = defaultPackUnlocks();
      const paid = defaultPackUnlocks();
      const srcP = (out.packPaid && typeof out.packPaid === 'object' && !Array.isArray(out.packPaid)) ? out.packPaid : {};
      const srcC = (out.levelsCards && typeof out.levelsCards === 'object') ? out.levelsCards : {};
      CARD_CATS.forEach(function (cat) {
        paid[cat] = !!srcP[cat];
        packs[cat] = packHasPaidProgress(cat, srcC, paid);
      });
      out.packPaid = paid;
      out.packUnlocked = packs;
    }
    out.v = SAVE_VERSION;
    return out;
  }

  function applySave(data) {
    data = migrateSave(data);
    if (!data) return 0;
    state.ore = Number(data.ore) || 0;
    if (!isFinite(state.ore) || state.ore < 0) state.ore = 0;
    state.levels = defaultLevels();
    if (data.levels && typeof data.levels === 'object') {
      for (const id of UPGRADE_ORDER) {
        const n = Number(data.levels[id]);
        state.levels[id] = isFinite(n) && n > 0 ? Math.floor(n) : 0;
      }
    }
    state.levelsTraining = defaultTrainingLevels();
    if (data.levelsTraining && typeof data.levelsTraining === 'object') {
      for (let i = 0; i < TRAINING_ORDER.length; i++) {
        const id = TRAINING_ORDER[i];
        const n = Number(data.levelsTraining[id]);
        state.levelsTraining[id] = isFinite(n) && n > 0 ? Math.floor(n) : 0;
      }
    }
    state.levelsCards = defaultCardLevels();
    if (data.levelsCards && typeof data.levelsCards === 'object') {
      for (let i = 0; i < SKILL_CARD_IDS.length; i++) {
        const id = SKILL_CARD_IDS[i];
        const n = Number(data.levelsCards[id]);
        state.levelsCards[id] = isFinite(n) && n > 0 ? Math.floor(n) : 0;
      }
    }
    state.cardComboDay = data.cardComboDay || '';
    state.cardComboHits = (data.cardComboHits && typeof data.cardComboHits === 'object' && !Array.isArray(data.cardComboHits)) ? Object.assign({}, data.cardComboHits) : {};
    state.cardComboClaimed = !!data.cardComboClaimed;
    state.packPaid = defaultPackUnlocks();
    if (data.packPaid && typeof data.packPaid === 'object') {
      CARD_CATS.forEach(function (cat) {
        state.packPaid[cat] = !!data.packPaid[cat];
      });
    }
    state.packUnlocked = defaultPackUnlocks();
    grandfatherPackUnlocks();
    state.adBoostUntil = Number(data.adBoostUntil) || 0;
    state.pendingClickMult = Number(data.pendingClickMult) || 1;
    state.prestigeLevel = Number(data.prestigeLevel) || 0;
    if (!isFinite(state.prestigeLevel) || state.prestigeLevel < 0) state.prestigeLevel = 0;
    state.medals = Number(data.medals) || 0;
    if (!isFinite(state.medals) || state.medals < 0) state.medals = 0;
    state.selectedBreed = BREEDS[data.selectedBreed] ? data.selectedBreed : 'lab';
    state.unlockedBreeds = Array.isArray(data.unlockedBreeds) ? data.unlockedBreeds.filter(function (id) { return !!BREEDS[id]; }) : ['lab'];
    state.unlockedBreeds = state.unlockedBreeds.filter(function (id, i, arr) { return arr.indexOf(id) === i; });
    if (state.unlockedBreeds.indexOf('lab') === -1) state.unlockedBreeds.unshift('lab');
    if (state.unlockedBreeds.indexOf(state.selectedBreed) === -1) state.selectedBreed = 'lab';
    state.selectedYard = YARDS[data.selectedYard] ? data.selectedYard : 'sunny';
    state.unlockedYards = Array.isArray(data.unlockedYards) ? data.unlockedYards.filter(function (id) { return !!YARDS[id]; }) : ['sunny'];
    state.unlockedYards = state.unlockedYards.filter(function (id, i, arr) { return arr.indexOf(id) === i; });
    if (state.unlockedYards.indexOf('sunny') === -1) state.unlockedYards.unshift('sunny');
    if (state.unlockedYards.indexOf(state.selectedYard) === -1) state.selectedYard = 'sunny';
    state.stats = {
      totalClicks: Number(data.stats && data.stats.totalClicks) || 0,
      lifetimeBones: Number(data.stats && data.stats.lifetimeBones) || 0,
      upgradesBought: Number(data.stats && data.stats.upgradesBought) || 0,
      eventsDone: Number(data.stats && data.stats.eventsDone) || 0,
      walksDone: Number(data.stats && data.stats.walksDone) || 0,
    };
    Object.keys(state.stats).forEach(function (k) {
      if (!isFinite(state.stats[k]) || state.stats[k] < 0) state.stats[k] = 0;
    });
    state.noAds = !!(data.noAds);
    state.vipTreats = !!(data.vipTreats);
    state.achievementsClaimed = Object.assign({}, data.achievementsClaimed || {});
    state.quests = Array.isArray(data.quests) ? data.quests.map(function (q) {
      if (!q || typeof q !== 'object') return null;
      const target = Math.max(1, Number(q.target) || 1);
      const progress = Math.max(0, Number(q.progress) || 0);
      const reward = Math.max(0, Number(q.reward) || 0);
      return {
        id: String(q.id || ('q-' + Math.random())),
        type: q.type === 'clicks' || q.type === 'earn' || q.type === 'buy' ? q.type : 'clicks',
        target: target,
        progress: Math.min(progress, target),
        reward: reward,
        label: typeof q.label === 'string' ? q.label : tr('quest_fallback'),
        claimed: !!q.claimed,
      };
    }).filter(Boolean) : [];
    state.questDaySeed = data.questDaySeed || '';
    state.questStreak = Number(data.questStreak) || 0;
    state.questLastClearDay = data.questLastClearDay || '';
    state.questClaimsToday = Number(data.questClaimsToday) || 0;
    state.joyUntil = Number(data.joyUntil) || 0;
    state.joyReadyAt = Number(data.joyReadyAt) || 0;
    state.inventory = Object.assign({ boneBoost: 0 }, data.inventory || {});
    Object.keys(state.inventory).forEach(function (k) {
      const n = Number(state.inventory[k]);
      state.inventory[k] = isFinite(n) && n > 0 ? Math.floor(n) : 0;
    });
    state.activeItem = data.activeItem && typeof data.activeItem === 'object' ? data.activeItem : null;
    if (state.activeItem) {
      const until = Number(state.activeItem.until) || 0;
      if (!CONSUMABLES[state.activeItem.id] || !until || Date.now() >= until) state.activeItem = null;
      else state.activeItem = { id: state.activeItem.id, until: until };
    }
    state.storyRead = Object.assign({}, data.storyRead || {});
    state.nextEventAt = Number(data.nextEventAt) || 0;
    const okEvent = { toy: 1, train: 1, hide: 1, race: 1 };
    state.eventReadyType = okEvent[data.eventReadyType] ? data.eventReadyType : null;
    state.stickers = Array.isArray(data.stickers) ? data.stickers.filter(function (id, i, arr) {
      return STICKERS.some(function (st) { return st.id === id; }) && arr.indexOf(id) === i;
    }) : [];
    state.unlockedFriends = Array.isArray(data.unlockedFriends) ? data.unlockedFriends.filter(function (id) { return !!FRIENDS[id]; }) : [];
    state.unlockedFriends = state.unlockedFriends.filter(function (id, i, arr) { return arr.indexOf(id) === i; });
    state.activeFriend = (data.activeFriend && state.unlockedFriends.indexOf(data.activeFriend) !== -1) ? data.activeFriend : null;
    {
      const ac = Number(data.acorns);
      state.acorns = isFinite(ac) && ac > 0 ? ac : 0;
    }
    state.seasonBoostUntil = Number(data.seasonBoostUntil) || 0;
    if (!isFinite(state.seasonBoostUntil) || (state.seasonBoostUntil && Date.now() >= state.seasonBoostUntil)) state.seasonBoostUntil = 0;
    state.seasonPurchases = (data.seasonPurchases && typeof data.seasonPurchases === 'object' && !Array.isArray(data.seasonPurchases))
      ? Object.assign({}, data.seasonPurchases) : {};
    state.stickerSetsClaimed = (data.stickerSetsClaimed && typeof data.stickerSetsClaimed === 'object' && !Array.isArray(data.stickerSetsClaimed))
      ? Object.assign({}, data.stickerSetsClaimed) : {};
    state.medalUpgrades = (data.medalUpgrades && typeof data.medalUpgrades === 'object' && !Array.isArray(data.medalUpgrades))
      ? Object.assign({}, data.medalUpgrades) : {};
    {
      const e = Number(data.energy);
      state.energy = isFinite(e) ? e : getEnergyMax();
    }
    state.energyRestReadyAt = Number(data.energyRestReadyAt) || 0;
    if (data.activeWalk && typeof data.activeWalk === 'object' && Number(data.activeWalk.endsAt) > 0) {
      state.activeWalk = {
        tierId: String(data.activeWalk.tierId || 'short'),
        endsAt: Number(data.activeWalk.endsAt),
        startedAt: Number(data.activeWalk.startedAt) || 0,
      };
    } else {
      state.activeWalk = null;
    }
    state.yardStage = Math.max(1, Number(data.yardStage) || 1);
    state.dailyGoals = Array.isArray(data.dailyGoals) ? data.dailyGoals.map(function (g) {
      if (!g || typeof g !== 'object') return null;
      const target = Math.max(1, Number(g.target) || 1);
      return {
        id: String(g.id || ('dg-' + Math.random())),
        type: ['clicks', 'earn', 'walks', 'events', 'buy'].indexOf(g.type) !== -1 ? g.type : 'clicks',
        target: target,
        progress: Math.min(target, Math.max(0, Number(g.progress) || 0)),
        reward: Math.max(0, Number(g.reward) || 0),
        label: typeof g.label === 'string' ? g.label : tr('goal_fallback'),
        claimed: !!g.claimed,
      };
    }).filter(Boolean) : [];
    state.dailyDayKey = data.dailyDayKey || '';
    state.dailyStreak = Number(data.dailyStreak) || 0;
    state.dailyLastClearDay = data.dailyLastClearDay || '';
    state.combo = 1;
    state.lastClickAt = 0;
    const last = Number(data.lastSaveAt) || Date.now();
    state.lastSaveAt = last;
    syncYardStageFromProgress();
    clampEnergy();
    ensureQuests();
    ensureDailyGoals();
    // Prefer restoring a ready event over wiping it with a fresh cooldown
    if (state.eventReadyType) {
      showEventBanner(state.eventReadyType);
    } else if (!state.nextEventAt || state.nextEventAt < Date.now() - EVENT_MAX_MS) {
      scheduleNextEvent(22 * 1000);
    }
    // energy regen while offline (capped) — paused during an active walk
    {
      const offSec = Math.max(0, (Date.now() - last) / 1000);
      const walking = !!(state.activeWalk && state.activeWalk.endsAt && state.activeWalk.endsAt > Date.now());
      if (!walking) {
        state.energy = Math.min(getEnergyMax(), (isFinite(state.energy) ? state.energy : getEnergyMax()) + getEnergyRegen() * Math.min(offSec, 4 * 3600));
      }
    }
    // finish walk if ended while away
    if (state.activeWalk && state.activeWalk.endsAt && state.activeWalk.endsAt <= Date.now()) {
      completeWalk(true);
    }
    const elapsedSec = Math.min(getOfflineCapSec(), Math.max(0, (Date.now() - last) / 1000));
    const boostBackup = state.adBoostUntil;
    const itemBackup = state.activeItem;
    state.adBoostUntil = 0;
    state.activeItem = null;
    const rate = getOrePerSec() * getOfflineEfficiency();
    state.adBoostUntil = boostBackup;
    state.activeItem = itemBackup;
    const gained = window.GameCore && window.GameCore.offlineGain
      ? window.GameCore.offlineGain(rate, 1, elapsedSec, getOfflineCapSec())
      : rate * elapsedSec;
    if (gained > 0.01) { state.ore += gained; state.stats.lifetimeBones += gained; return gained; }
    return 0;
  }

  function readLocalSave() {
    try {
      let raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        raw = localStorage.getItem(LEGACY_SAVE_KEY);
        if (raw) localStorage.setItem(SAVE_KEY, raw);
      }
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  async function persist() {
    if (destroyed || (typeof window !== 'undefined' && window.__dvorikWiping)) return;
    const payload = serialize();
    if (destroyed || (typeof window !== 'undefined' && window.__dvorikWiping)) return;
    state.lastSaveAt = payload.lastSaveAt;
    if (window.GPBridge) await window.GPBridge.saveCloudSave(payload);
    else { try { localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); } catch (_) {} }
  }

  let saveQueued = false;
  function scheduleSave() {
    if (destroyed) return;
    if (saveQueued) return;
    saveQueued = true;
    saveTimer = setTimeout(function () {
      saveQueued = false;
      if (!destroyed) persist();
    }, 200);
  }

  function tick(now) {
    if (destroyed) return;
    const dt = Math.min(0.25, (now - lastTick) / 1000);
    lastTick = now;
    if (!ready) {
      rafTick = requestAnimationFrame(tick);
      return;
    }
    if (!isFinite(state.ore) || state.ore < 0) state.ore = 0;
    if (!isFinite(state.stats.lifetimeBones) || state.stats.lifetimeBones < 0) state.stats.lifetimeBones = 0;
    if (!isFinite(state.acorns) || state.acorns < 0) state.acorns = 0;
    const gain = getOrePerSec() * dt;
    if (gain > 0 && isFinite(gain)) { state.ore += gain; state.stats.lifetimeBones += gain; bumpQuest('earn', gain); }
    regenEnergy(dt);
    if (state.activeWalk && state.activeWalk.endsAt <= Date.now()) {
      updateWalkUI();
    }
    decayCombo(dt);
    if (now - lastHudAt > 80) {
      lastHudAt = now;
      renderStats();
      checkEventTimer();
    }
    rafTick = requestAnimationFrame(tick);
  }

  let shopDirtyAt = 0;
  function shopSign() {
    const ore = state.ore || 0;
    if (activeTab === 'shop') {
      return activeShopCat + ':' + UPGRADE_ORDER.map(function (id) {
        return (isUpgradeUnlocked(id) ? '1' : '0') + (ore >= upgradeCost(id) ? '1' : '0') + (state.levels[id] || 0);
      }).join('') + '|' + ((state.inventory && state.inventory.boneBoost) || 0) + '|' + (state.activeItem ? state.activeItem.until : 0);
    }
    if (activeTab === 'cards') {
      return activeCardCat + ':' + SKILL_CARD_IDS.map(function (id) {
        const c = SKILL_CARDS_BY_ID[id];
        return (isCardUnlocked(c) ? '1' : '0') + (ore >= cardCost(id) ? '1' : '0') + (state.levelsCards[id] || 0);
      }).join('') + ':' + JSON.stringify(state.cardComboHits || {}) + ':' + (state.cardComboClaimed ? '1' : '0');
    }
    if (activeTab === 'training') {
      return TRAINING_ORDER.map(function (id) {
        return (isTrainingUnlocked(id) ? '1' : '0') + (ore >= trainingCost(id) ? '1' : '0') + (state.levelsTraining[id] || 0);
      }).join('');
    }
    if (activeTab === 'prestige') {
      return String(state.medals) + ':' + state.prestigeLevel + ':' + (state.yardStage || 1) + ':' + JSON.stringify(state.medalUpgrades || {});
    }
    if (activeTab === 'season') {
      return String(state.acorns) + ':' + (state.seasonBoostUntil || 0);
    }
    return activeTab;
  }
  function tickShopThrottle(now) {
    if (destroyed) return;
    if (ready && (activeTab === 'shop' || activeTab === 'cards' || activeTab === 'training' || activeTab === 'prestige' || activeTab === 'season')) {
      const sign = shopSign();
      const minGap = activeTab === 'prestige' ? 800 : 400;
      if (sign !== lastShopSign && now - shopDirtyAt > minGap) {
        shopDirtyAt = now;
        lastShopSign = sign;
        if (activeTab === 'shop') { renderShop(); }
        else if (activeTab === 'cards') renderSkillCards();
        else if (activeTab === 'training') renderTraining();
        else if (activeTab === 'prestige') renderPrestige();
        else if (activeTab === 'season') renderSeason();
      }
    }
    rafShop = requestAnimationFrame(tickShopThrottle);
  }

  function showOfflineModal(gained) {
    const modal = $('#offline-modal');
    const text = $('#offline-text');
    const close = $('#offline-close');
    if (!modal || !text) {
      showToast(tr('offline_toast', { n: fmt(gained) }));
      if (window.Sounds) window.Sounds.playOffline();
      return;
    }
    const hours = Math.round(getOfflineCapSec() / 3600);
    text.textContent = tr('offline_body', { n: fmt(gained), hours: hours, pct: Math.round(getOfflineEfficiency() * 100) });
    modal.hidden = false;
    const hide = function () { modal.hidden = true; if (window.Sounds) window.Sounds.playOffline(); };
    close && close.addEventListener('click', hide, { once: true });
    modal.addEventListener('click', function (e) { if (e.target === modal) hide(); }, { once: true });
  }

  function init() {
    const boot = $('#boot-overlay');
    function hideBoot() {
      if (boot) boot.hidden = true;
    }

    function setGpStatus() {
      const status = $('#gp-status');
      if (!status) return;
      const bridge = window.GPBridge;
      const info = bridge && bridge.getStatus ? bridge.getStatus() : { connected: false, sdk: 'local', cloudSave: 'local', ads: 'local', payments: 'local' };
      const label = info.connected ? (info.cloudSave === 'error' ? tr('cloud_err') : tr('cloud_ok')) : tr('local');
      status.textContent = label;
      status.classList.toggle('gp-on', !!info.connected && info.cloudSave !== 'error');
      status.classList.toggle('gp-off', !info.connected || info.cloudSave === 'error');
      status.title = tr('gp_title', { sdk: info.sdk, cloud: info.cloudSave, ads: info.ads, pay: info.payments, err: info.lastError ? ' · ' + info.lastError : '' });
      const detail = $('#status-detail');
      if (detail) {
        detail.textContent = tr('save_detail', { cloud: info.cloudSave || 'local', ads: info.ads || 'local', pay: info.payments || 'local' });
      }
    }

    function syncMuteBtn() {
      const btn = $('#btn-mute');
      if (!btn || !window.Sounds) return;
      const m = window.Sounds.isMuted && window.Sounds.isMuted();
      btn.textContent = m ? '🔇' : '🔊';
      btn.setAttribute('aria-label', m ? tr('sound_off') : tr('sound_on'));
      btn.title = m ? tr('sound_off_title') : tr('sound_on_title');
    }

    let gained = 0;
    try {
      const data = readLocalSave();
      if (data) gained = applySave(data);
      else { ensureQuests(); ensureDailyGoals(); state.energy = getEnergyMax(); scheduleNextEvent(22 * 1000); }
    } catch (e) {
      console.warn('[dvorik] load failed', e);
      ensureQuests(); ensureDailyGoals(); state.energy = getEnergyMax(); scheduleNextEvent(22 * 1000);
    }

    if (destroyed) return;

    listen($('#mine-btn'), 'click', mineClick);
    listen($('#quests'), 'click', onQuestsClick);
    listen($('#btn-ad'), 'click', onRewarded);
    listen($('#btn-save'), 'click', manualSave);
    listen($('#btn-joy'), 'click', activateJoy);
    listen($('#btn-rest'), 'click', doRest);
    listen($('#btn-walk'), 'click', onWalkButton);
    document.querySelectorAll('[data-walk-close]').forEach(function (el) {
      listen(el, 'click', function () { const sh = $('#walk-sheet'); if (sh) sh.hidden = true; });
    });
    listen($('#btn-event'), 'click', onEventButton);
    listen($('#btn-prestige'), 'click', openPrestigeModal);
    listen($('#prestige-confirm'), 'click', doPrestige);
    listen($('#prestige-cancel'), 'click', function () { const m = $('#prestige-modal'); if (m) m.hidden = true; });
    listen($('#prestige-modal'), 'click', function (e) { if (e.target === e.currentTarget) e.currentTarget.hidden = true; });
    listen($('#pack-buy-cancel'), 'click', hidePackBuyModal);
    listen($('#pack-buy-confirm'), 'click', function () {
      const btn = $('#pack-buy-confirm');
      const tag = btn && btn.dataset.packTag;
      if (tag) buyGpProduct(tag);
    });
    listen($('#pack-buy-modal'), 'click', function (e) { if (e.target === e.currentTarget) hidePackBuyModal(); });
    listen($('#event-banner-go'), 'click', function () { startEvent(state.eventReadyType); });
    listen($('#toy-tap'), 'click', toyTap);
    listen($('#train-modal'), 'click', function (e) {
      if (e.target === e.currentTarget && trainActive) endTrainGame(false);
    });
    listen($('#toy-modal'), 'click', function (e) {
      if (e.target === e.currentTarget && toyActive) endToyGame();
    });
    listen($('#story-next'), 'click', advanceStory);
    listen($('#story-modal'), 'click', function (e) {
      if (e.target === e.currentTarget && storyPlaying) {
        storyPlaying = null;
        e.currentTarget.hidden = true;
      }
    });
    listen($('#race-tap'), 'click', raceTap);
    listen($('#race-modal'), 'click', function (e) {
      if (e.target === e.currentTarget && raceActive) endRaceGame(true);
    });
    listen($('#hide-modal'), 'click', function (e) {
      if (e.target === e.currentTarget && hideActive) endHideGame(false);
    });

    document.querySelectorAll('.tabs > .tab').forEach(function (btn) {
      listen(btn, 'click', function () {
        var key = btn.dataset.tab;
        if (key === 'more') {
          var sheet = $('#more-sheet');
          if (sheet && !sheet.hidden) closeMoreSheet();
          else openMoreSheet();
          return;
        }
        setTab(key);
      });
    });
    document.querySelectorAll('.more-item').forEach(function (btn) {
      listen(btn, 'click', function () { setTab(btn.dataset.tab); });
    });
    document.querySelectorAll('[data-card-cat]').forEach(function (btn) {
      listen(btn, 'click', function () {
        const cat = btn.getAttribute('data-card-cat');
        if (CARD_CATS.indexOf(cat) === -1) return;
        activeCardCat = cat;
        if (window.Sounds && window.Sounds.playUi) window.Sounds.playUi();
        renderSkillCards();
      });
    });
    document.querySelectorAll('[data-shop-cat]').forEach(function (btn) {
      listen(btn, 'click', function () {
        const cat = btn.getAttribute('data-shop-cat');
        if (SHOP_CATS.indexOf(cat) === -1) return;
        activeShopCat = cat;
        if (window.Sounds && window.Sounds.playUi) window.Sounds.playUi();
        renderShop();
      });
    });
    document.querySelectorAll('[data-more-close]').forEach(function (el) {
      listen(el, 'click', function () { closeMoreSheet(); });
    });
    listen($('#mine-btn'), 'contextmenu', function (e) { e.preventDefault(); });

    listen($('#btn-mute'), 'click', function () {
      if (window.Sounds && window.Sounds.toggleMute) window.Sounds.toggleMute();
      syncMuteBtn();
    });
    syncMuteBtn();

    function onKeyPet(e) {
      if (!ready || destroyed) return;
      if (e.code !== 'Space' && e.key !== ' ') return;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      e.preventDefault();
      mineClick({ clientX: window.innerWidth / 2, clientY: window.innerHeight * 0.32 });
    }
    listen(document, 'keydown', onKeyPet);

    listen($('#btn-help'), 'click', function () {
      const m = $('#help-modal');
      if (m) m.hidden = false;
    });
    document.querySelectorAll('[data-help-close]').forEach(function (el) {
      listen(el, 'click', function () { const m = $('#help-modal'); if (m) m.hidden = true; });
    });
    listen($('#btn-settings'), 'click', function () {
      const sh = $('#settings-sheet');
      if (sh) sh.hidden = false;
    });
    document.querySelectorAll('[data-settings-close]').forEach(function (el) {
      listen(el, 'click', function () { const sh = $('#settings-sheet'); if (sh) sh.hidden = true; });
    });
    listen($('#btn-export'), 'click', function () {
      try {
        const json = JSON.stringify(serialize(), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sobachiy-dvorik-save.json';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
        showToast(tr('save_dl'));
      } catch (_) {
        showToast(tr('export_fail'));
      }
    });
    listen($('#btn-import'), 'click', function () {
      const input = $('#import-file');
      if (input) input.click();
    });
    listen($('#import-file'), 'change', function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const data = JSON.parse(String(reader.result || ''));
          applySave(data);
          persist();
          renderAll();
          showToast(tr('save_loaded'));
        } catch (_) {
          showToast(tr('file_bad'));
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
    listen($('#btn-reset'), 'click', async function () {
      const ok = window.__dvorikConfirm
        ? await window.__dvorikConfirm(tr('reset_q'))
        : window.confirm(tr('reset_q'));
      if (!ok || destroyed) return;
      destroyed = true;
      ready = false;
      window.__dvorikWiping = true;
      window.__dvorikReady = false;
      if (saveTimer) { try { clearTimeout(saveTimer); } catch (_) {} }
      saveQueued = false;
      if (autosaveTimer) { try { clearInterval(autosaveTimer); } catch (_) {} }
      const empty = { v: SAVE_VERSION, lastSaveAt: Date.now() };
      try {
        if (window.GPBridge && window.GPBridge.wipeProgress) await window.GPBridge.wipeProgress(empty);
        else {
          try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
          try { localStorage.removeItem(LEGACY_SAVE_KEY); } catch (_) {}
          try { localStorage.setItem(SAVE_KEY, JSON.stringify(empty)); } catch (_) {}
        }
      } catch (_) {}
      window.location.reload();
    });

    applyBreedArt();
    applyYardArt();
    applyFriendArt();
    const yardDog = createYardDog();
    yardDog.start();
    cleanups.push(function () { try { yardDog.stop(); } catch (_) {} });
    updateSeasonUI();
    if (window.I18n) {
      window.I18n.applyDom();
      window.I18n.onChange(function () {
        if (destroyed) return;
        window.I18n.applyDom();
        renderAll();
        updateWalkUI();
        updateEnergyUI();
        applyNoAdsUi();
        setGpStatus();
      });
    }
    listen($('#lang-ru'), 'click', function () { if (window.I18n) window.I18n.setLang('ru'); });
    listen($('#lang-en'), 'click', function () { if (window.I18n) window.I18n.setLang('en'); });
    renderAll();
    lastTick = performance.now();
    ready = true;
    hideBoot();
    syncBgm();
    window.__dvorikReady = true;
    try {
      var gp = window.__gp;
      if (gp && typeof gp.gameStart === 'function' && !window.__gpGameStarted) {
        window.__gpGameStarted = true;
        gp.gameStart();
      }
    } catch (_) {}
    rafTick = requestAnimationFrame(tick);
    rafShop = requestAnimationFrame(tickShopThrottle);
    autosaveTimer = setInterval(function () { if (!destroyed) persist(); }, AUTOSAVE_MS);
    statusTimer = setInterval(function () { if (!destroyed) setGpStatus(); }, AUTOSAVE_MS);

    setGpStatus();
    applyNoAdsUi();
    restoreGpPurchases();

    if (window.GPBridge && typeof window.GPBridge.loadCloudSave === 'function') {
      window.GPBridge.loadCloudSave().then(function (cloud) {
        if (destroyed || !cloud) {
          if (!destroyed) setGpStatus();
          return;
        }
        const cloudAt = Number(cloud.lastSaveAt) || 0;
        const localAt = Number(state.lastSaveAt) || 0;
        if (cloudAt > localAt + 1000) {
          let wiping = false;
          try { wiping = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('dvorik-wipe') === '1'; } catch (_) {}
          if (!wiping) {
            const extra = applySave(cloud);
            renderAll();
            if (extra > 0.01) showOfflineModal(extra);
          }
        }
        setGpStatus();
        restoreGpPurchases();
        if (window.GPBridge.consumeWipeFlag) window.GPBridge.consumeWipeFlag();
      }).catch(function () {
        if (!destroyed) setGpStatus();
        if (window.GPBridge && window.GPBridge.consumeWipeFlag) window.GPBridge.consumeWipeFlag();
      });
    }

    const onGpReady = function () {
      if (destroyed) return;
      if (window.I18n && window.I18n.syncFromGp) window.I18n.syncFromGp();
      setGpStatus();
      restoreGpPurchases();
      showToast(tr('title'));
    };
    listen(window, 'gp-ready', onGpReady);

    const firstHint = $('#hint-first');
    const isNewbie = (state.stats.totalClicks || 0) < 4 && (state.stats.upgradesBought || 0) < 1 && (state.stats.lifetimeBones || 0) < 8;
    if (firstHint) firstHint.hidden = !isNewbie;
    if (gained > 0.01) showOfflineModal(gained);
    else if (isNewbie) {
      showToast(tr('pet_hint_toast'));
    } else {
      showToast(tr('back_yard'));
    }
    if (firstHint) {
      const hideHint = function () { firstHint.hidden = true; };
      listen($('#mine-btn'), 'click', hideHint, { once: true });
    }

    function onVisibility() {
      if (destroyed) return;
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        persist();
        return;
      }
      if (hiddenAt && Date.now() - hiddenAt > 2500) {
        const last = Number(state.lastSaveAt) || hiddenAt;
        const elapsedSec = Math.min(getOfflineCapSec(), Math.max(0, (Date.now() - last) / 1000));
        if (elapsedSec > 2) {
          const walking = !!(state.activeWalk && state.activeWalk.endsAt && state.activeWalk.endsAt > Date.now());
          if (!walking) {
            state.energy = Math.min(getEnergyMax(), (isFinite(state.energy) ? state.energy : 0) + getEnergyRegen() * Math.min(elapsedSec, 4 * 3600));
          }
          if (state.activeWalk && state.activeWalk.endsAt && state.activeWalk.endsAt <= Date.now()) {
            completeWalk(true);
          }
          const boostBackup = state.adBoostUntil;
          const itemBackup = state.activeItem;
          state.adBoostUntil = 0;
          state.activeItem = null;
          const rate = getOrePerSec() * getOfflineEfficiency();
          state.adBoostUntil = boostBackup;
          state.activeItem = itemBackup;
          const extra = window.GameCore && window.GameCore.offlineGain
            ? window.GameCore.offlineGain(rate, 1, elapsedSec, getOfflineCapSec())
            : rate * elapsedSec;
          if (extra > 0.01) {
            state.ore += extra;
            state.stats.lifetimeBones += extra;
            showOfflineModal(extra);
          }
        }
      }
      hiddenAt = 0;
      lastTick = performance.now();
      renderStats();
    }
    listen(document, 'visibilitychange', onVisibility);

    function flushSave() {
      if (destroyed || (typeof window !== 'undefined' && window.__dvorikWiping)) return;
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(serialize())); } catch (_) {}
    }
    listen(window, 'beforeunload', flushSave);
    listen(window, 'pagehide', flushSave);
  }

  init();

  window.__dvorik = {
    getState: function () { return state; },
    persist: persist,
    fmt: fmt,
  };

  return function destroy() {
    destroyed = true;
    ready = false;
    window.__dvorikReady = false;
    if (rafTick) cancelAnimationFrame(rafTick);
    if (rafShop) cancelAnimationFrame(rafShop);
    if (autosaveTimer) clearInterval(autosaveTimer);
    if (statusTimer) clearInterval(statusTimer);
    if (saveTimer) clearTimeout(saveTimer);
    if (toastTimer) clearTimeout(toastTimer);
    if (toyRaf) cancelAnimationFrame(toyRaf);
    if (raceRaf) cancelAnimationFrame(raceRaf);
    cleanups.forEach(function (fn) { try { fn(); } catch (_) {} });
    persist();
  };
}

  startGame();
})();
