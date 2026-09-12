(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GameContent = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

/** Game catalogs and balance. Pure data — no DOM. */

const AUTOSAVE_MS = 4000;
const OFFLINE_CAP_SEC = 8 * 60 * 60;
const OFFLINE_BED_BONUS_SEC = 30 * 60;
const OFFLINE_BASE_EFF = 0.20;
const AD_BOOST_MULT = 2;
const AD_BOOST_DURATION_MS = 60 * 1000;
const SAVE_KEY = 'dog-yard-clicker-v1';
const LEGACY_SAVE_KEY = 'ore-mine-clicker-v1';
const SAVE_VERSION = 8;
// In production the festival follows the calendar. Set to true only for local QA.
const SEASON_FORCE = false;
const ACORN_PER_CLICK = 0.022;
const ACORN_EVENT_BASE = 7;
const SEASON_BOOST_MULT = 1.25;
const SEASON_BOOST_MS = 60 * 1000;
const HIDE_TRIES = 2;
const RACE_DURATION_MS = 5 * 1000;
const RACE_DECAY_PER_SEC = 18;
const RACE_TAP_GAIN = 8;

const COMBO_WINDOW_MS = 800;
const COMBO_MAX = 3;
const COMBO_STEP = 0.08;
const COMBO_DECAY_PER_SEC = 0.55;
const WHISTLE_COMBO_MS = 40;

const JOY_MULT = 2;
const JOY_DURATION_MS = 10 * 1000;
const JOY_COOLDOWN_MS = 45 * 1000;

const PRESTIGE_REQ_BASE = 2e8;
const PRESTIGE_REQ_SCALE = 2.2;
const PRESTIGE_MEDAL_INCOME = 0.02;
const BASE_CLICK = 0.85;
const VIP_INCOME_MULT = 1.15;

const CLICK_SOFTCAP = 400;
const IDLE_SOFTCAP = 0;
const SOFTCAP_POWER = 0.7;
const CARD_MAX_LEVEL = 20;

const ENERGY_MAX_BASE = 100;
const ENERGY_PER_CLICK = 1.6;
const ENERGY_REGEN_PER_SEC = 1.2;
const ENERGY_TIRED_MULT = 0.12;
const ENERGY_REST_GAIN = 28;
const ENERGY_REST_COOLDOWN_MS = 40 * 1000;

const EVENT_MIN_MS = 90 * 1000;
const EVENT_MAX_MS = 180 * 1000;
const TOY_DURATION_MS = 10 * 1000;
const TOY_REWARD_PER_TAP = 2.2;
const EVENT_REWARD_MULT = 1.05;

const UPGRADES = {
  pickaxe: { id: 'pickaxe', name: 'Лакомство', desc: '+0.7 к почесушкам за уровень', baseCost: 18, costMult: 1.22, clickPower: 0.7, orePerSec: 0, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🦴', unlock: null },
  miner: { id: 'miner', name: 'Щенок-помощник', desc: '+0.30 кост./сек за уровень', baseCost: 55, costMult: 1.22, clickPower: 0, orePerSec: 0.30, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🐕', unlock: null },
  ball: { id: 'ball', name: 'Мячик', desc: '+2.5 к почесушкам за уровень', baseCost: 220, costMult: 1.24, clickPower: 2.5, orePerSec: 0, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🎾', unlock: { upgradeId: 'pickaxe', level: 3, text: 'Нужно Лакомство ур. 3' } },
  drill: { id: 'drill', name: 'Дрессировщик', desc: '+1.8 кост./сек за уровень', baseCost: 1400, costMult: 1.25, clickPower: 0, orePerSec: 1.8, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🧤', unlock: { upgradeId: 'miner', level: 2, text: 'Нужен Щенок-помощник ур. 2' } },
  walk: { id: 'walk', name: 'Выгул', desc: '+7 кост./сек за уровень', baseCost: 22000, costMult: 1.28, clickPower: 0, orePerSec: 7, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🦮', unlock: { upgradeId: 'drill', level: 1, text: 'Нужен Дрессировщик ур. 1' } },
  warehouse: { id: 'warehouse', name: 'Будка', desc: '+7% к автодоходу за уровень · офлайн', baseCost: 4800, costMult: 1.28, clickPower: 0, orePerSec: 0, idleMult: 0.07, clickPct: 0, comboBonusMs: 0, icon: '🏠', unlock: { upgradeId: 'miner', level: 5, text: 'Нужен Щенок-помощник ур. 5' } },
  groomer: { id: 'groomer', name: 'Грумер', desc: '+10% к автодоходу за уровень', baseCost: 70000, costMult: 1.32, clickPower: 0, orePerSec: 0, idleMult: 0.10, clickPct: 0, comboBonusMs: 0, icon: '✂️', unlock: { upgradeId: 'warehouse', level: 2, text: 'Нужна Будка ур. 2' } },
  kennel: { id: 'kennel', name: 'Питомник', desc: '+20 кост./сек за уровень', baseCost: 400000, costMult: 1.32, clickPower: 0, orePerSec: 20, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🏡', unlock: { upgradeId: 'walk', level: 2, text: 'Нужен Выгул ур. 2' } },
  collar: { id: 'collar', name: 'Ошейник', desc: '+2% к почесушкам за уровень', baseCost: 400, costMult: 1.23, clickPower: 0, orePerSec: 0, idleMult: 0, clickPct: 0.02, comboBonusMs: 0, icon: '📿', unlock: { upgradeId: 'pickaxe', level: 2, text: 'Нужно Лакомство ур. 2' } },
  frisbee: { id: 'frisbee', name: 'Фрисби', desc: '+1.2 кост./сек за уровень', baseCost: 2500, costMult: 1.25, clickPower: 0, orePerSec: 1.2, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🥏', unlock: { upgradeId: 'miner', level: 3, text: 'Нужен Щенок-помощник ур. 3' } },
  bed: { id: 'bed', name: 'Лежанка', desc: '+30 мин офлайн-капа за уровень · офлайн %', baseCost: 10000, costMult: 1.28, clickPower: 0, orePerSec: 0, idleMult: 0.02, clickPct: 0, comboBonusMs: 0, icon: '🛏️', unlock: { upgradeId: 'warehouse', level: 1, text: 'Нужна Будка ур. 1' } },
  whistle: { id: 'whistle', name: 'Свисток', desc: '+40 мс к окну комбо за уровень', baseCost: 5500, costMult: 1.27, clickPower: 0, orePerSec: 0, idleMult: 0, clickPct: 0, comboBonusMs: WHISTLE_COMBO_MS, icon: '📣', unlock: { upgradeId: 'ball', level: 2, text: 'Нужен Мячик ур. 2' } },
  /* —— new gated chain —— */
  clickWhistle: { id: 'clickWhistle', name: 'Свисток клика', desc: '+3% к почесушкам за уровень', baseCost: 3200, costMult: 1.28, clickPower: 0, orePerSec: 0, idleMult: 0, clickPct: 0.03, comboBonusMs: 0, icon: '🎵', unlock: { upgradeId: 'pickaxe', level: 5, text: 'Нужно Лакомство ур. 5' } },
  treatBag: { id: 'treatBag', name: 'Запас лакомств', desc: '+4.5 к почесушкам за уровень', baseCost: 14000, costMult: 1.30, clickPower: 4.5, orePerSec: 0, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🍖', unlock: { upgradeId: 'clickWhistle', level: 2, text: 'Нужен Свисток клика ур. 2' } },
  volunteers: { id: 'volunteers', name: 'Волонтёры', desc: '+3.5 кост./сек за уровень', baseCost: 12000, costMult: 1.29, clickPower: 0, orePerSec: 3.5, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🤝', unlock: { upgradeId: 'miner', level: 6, text: 'Нужен Щенок-помощник ур. 6' } },
  autofeeder: { id: 'autofeeder', name: 'Автокормушка', desc: '+8% к автодоходу за уровень', baseCost: 95000, costMult: 1.32, clickPower: 0, orePerSec: 0, idleMult: 0.08, clickPct: 0, comboBonusMs: 0, icon: '🤖', unlock: { upgradeId: 'drill', level: 3, text: 'Нужен Дрессировщик ур. 3' } },
  kennelPlus: { id: 'kennelPlus', name: 'Питомник+', desc: '+45 кост./сек за уровень', baseCost: 3e6, costMult: 1.35, clickPower: 0, orePerSec: 45, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🏰', unlock: { upgradeId: 'kennel', level: 4, lifetimeBones: 8e7, text: 'Нужен Питомник ур. 4 и 80M 🦴 за жизнь' } },
  squeaky: { id: 'squeaky', name: 'Пищалка', desc: '+1.4 к почесушкам за уровень', baseCost: 70, costMult: 1.23, clickPower: 1.4, orePerSec: 0, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🧸', unlock: { upgradeId: 'pickaxe', level: 1, text: 'Нужно Лакомство ур. 1' } },
  bandana: { id: 'bandana', name: 'Бандана', desc: '+2.5% к почесушкам за уровень', baseCost: 900, costMult: 1.25, clickPower: 0, orePerSec: 0, idleMult: 0, clickPct: 0.025, comboBonusMs: 0, icon: '🧣', unlock: { upgradeId: 'collar', level: 2, text: 'Нужен Ошейник ур. 2' } },
  leash: { id: 'leash', name: 'Поводок', desc: '+3.6 к почесушкам за уровень', baseCost: 2500, costMult: 1.26, clickPower: 3.6, orePerSec: 0, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🪢', unlock: { upgradeId: 'ball', level: 2, text: 'Нужен Мячик ур. 2' } },
  rubber: { id: 'rubber', name: 'Резиновая кость', desc: '+8 к почесушкам за уровень', baseCost: 48000, costMult: 1.30, clickPower: 8, orePerSec: 0, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🪀', unlock: { upgradeId: 'treatBag', level: 2, text: 'Нужен Запас лакомств ур. 2' } },
  bowls: { id: 'bowls', name: 'Миски', desc: '+0.55 кост./сек за уровень', baseCost: 160, costMult: 1.23, clickPower: 0, orePerSec: 0.55, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🥣', unlock: { upgradeId: 'miner', level: 1, text: 'Нужен Щенок-помощник ур. 1' } },
  kids: { id: 'kids', name: 'Ребята двора', desc: '+2.4 кост./сек за уровень', baseCost: 3800, costMult: 1.26, clickPower: 0, orePerSec: 2.4, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🧒', unlock: { upgradeId: 'frisbee', level: 1, text: 'Нужно Фрисби ур. 1' } },
  mailman: { id: 'mailman', name: 'Почтальон', desc: '+5.5 кост./сек за уровень', baseCost: 16000, costMult: 1.28, clickPower: 0, orePerSec: 5.5, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '📬', unlock: { upgradeId: 'drill', level: 2, text: 'Нужен Дрессировщик ур. 2' } },
  night: { id: 'night', name: 'Ночной двор', desc: '+11 кост./сек за уровень', baseCost: 75000, costMult: 1.30, clickPower: 0, orePerSec: 11, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🌙', unlock: { upgradeId: 'walk', level: 1, text: 'Нужен Выгул ур. 1' } },
  park: { id: 'park', name: 'Площадка', desc: '+30 кост./сек за уровень', baseCost: 9e5, costMult: 1.33, clickPower: 0, orePerSec: 30, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🛝', unlock: { upgradeId: 'kennel', level: 1, text: 'Нужен Питомник ур. 1' } },
  heater: { id: 'heater', name: 'Грелка', desc: '+4% к автодоходу за уровень', baseCost: 900, costMult: 1.25, clickPower: 0, orePerSec: 0, idleMult: 0.04, clickPct: 0, comboBonusMs: 0, icon: '🔥', unlock: { upgradeId: 'miner', level: 2, text: 'Нужен Щенок-помощник ур. 2' } },
  blanket: { id: 'blanket', name: 'Плед', desc: '+5% к автодоходу за уровень', baseCost: 14000, costMult: 1.28, clickPower: 0, orePerSec: 0, idleMult: 0.05, clickPct: 0, comboBonusMs: 0, icon: '🧺', unlock: { upgradeId: 'bed', level: 1, text: 'Нужна Лежанка ур. 1' } },
  lamp: { id: 'lamp', name: 'Фонарик', desc: '+6% к автодоходу за уровень', baseCost: 36000, costMult: 1.30, clickPower: 0, orePerSec: 0, idleMult: 0.06, clickPct: 0, comboBonusMs: 0, icon: '🏮', unlock: { upgradeId: 'warehouse', level: 2, text: 'Нужна Будка ур. 2' } },
  radio: { id: 'radio', name: 'Радио', desc: '+9% к автодоходу за уровень', baseCost: 160000, costMult: 1.32, clickPower: 0, orePerSec: 0, idleMult: 0.09, clickPct: 0, comboBonusMs: 0, icon: '📻', unlock: { upgradeId: 'groomer', level: 1, text: 'Нужен Грумер ур. 1' } },
};

const UPGRADE_ORDER = ['pickaxe','squeaky','miner','bowls','collar','ball','bandana','frisbee','drill','heater','warehouse','whistle','clickWhistle','leash','bed','blanket','kids','volunteers','treatBag','mailman','walk','lamp','groomer','night','autofeeder','radio','rubber','kennel','park','kennelPlus'];
const SHOP_CATS = ['paws', 'tails', 'cozy'];
const SHOP_CAT_IDS = {
  paws: ['pickaxe', 'squeaky', 'collar', 'ball', 'bandana', 'clickWhistle', 'leash', 'whistle', 'treatBag', 'rubber'],
  tails: ['miner', 'bowls', 'frisbee', 'drill', 'kids', 'volunteers', 'mailman', 'walk', 'night', 'kennel', 'park', 'kennelPlus'],
  cozy: ['heater', 'warehouse', 'bed', 'blanket', 'lamp', 'groomer', 'autofeeder', 'radio']
};

/** Progressive training tree (Дрессировка) — buy previous to unlock next */
const TRAINING = [
  { id: 'sit', name: 'Сит', desc: '+2.5% к почесушкам за уровень', baseCost: 1500, costMult: 1.45, clickPct: 0.025, energyRegen: 0, comboBonusMs: 0, walkRewardPct: 0, idleMult: 0, offlineBonus: 0, medalYield: 0, allIncome: 0, icon: '🪑' },
  { id: 'heel', name: 'Рядом', desc: '+7% реген энергии за уровень', baseCost: 6000, costMult: 1.47, clickPct: 0, energyRegen: 0.07, comboBonusMs: 0, walkRewardPct: 0, idleMult: 0, offlineBonus: 0, medalYield: 0, allIncome: 0, icon: '👣' },
  { id: 'paw', name: 'Лапу', desc: '+35 мс к окну комбо за уровень', baseCost: 22000, costMult: 1.48, clickPct: 0, energyRegen: 0, comboBonusMs: 35, walkRewardPct: 0, idleMult: 0, offlineBonus: 0, medalYield: 0, allIncome: 0, icon: '🐾' },
  { id: 'voice', name: 'Голос', desc: '+6% награда прогулки за уровень', baseCost: 90000, costMult: 1.50, clickPct: 0, energyRegen: 0, comboBonusMs: 0, walkRewardPct: 0.06, idleMult: 0, offlineBonus: 0, medalYield: 0, allIncome: 0, icon: '📣' },
  { id: 'fetch', name: 'Апорт', desc: '+4% к автодоходу за уровень', baseCost: 320000, costMult: 1.52, clickPct: 0, energyRegen: 0, comboBonusMs: 0, walkRewardPct: 0, idleMult: 0.04, offlineBonus: 0, medalYield: 0, allIncome: 0, icon: '🦴' },
  { id: 'trick', name: 'Трюк', desc: '+3% офлайн · +12% медалек выставки за уровень', baseCost: 1.4e6, costMult: 1.55, clickPct: 0, energyRegen: 0, comboBonusMs: 0, walkRewardPct: 0, idleMult: 0, offlineBonus: 0.03, medalYield: 0.12, allIncome: 0, icon: '🎪' },
  { id: 'champ', name: 'Чемпион', desc: '+1.5% ко всем доходам за уровень', baseCost: 6e6, costMult: 1.58, clickPct: 0, energyRegen: 0, comboBonusMs: 0, walkRewardPct: 0, idleMult: 0, offlineBonus: 0, medalYield: 0, allIncome: 0.015, icon: '🏆' },
];
const TRAINING_ORDER = TRAINING.map(function (t) { return t.id; });

/** Hamster-style unique cards: 3 menus, cross-gates between trees. */
const CARD_CATS = ['crew', 'district', 'special'];
const SKILL_CARDS = [
  { id: 'neighbor', cat: 'crew', name: 'Сосед', desc: '+0.25 кост./сек за уровень', icon: '🏡', baseCost: 50, costMult: 1.18, orePerSec: 0.25, clickPct: 0.004, maxLevel: 20, unlock: null },
  { id: 'walker', cat: 'crew', name: 'Выгульщик', desc: '+0.80 кост./сек за уровень', icon: '🦮', baseCost: 200, costMult: 1.18, orePerSec: 0.80, clickPct: 0, maxLevel: 20, unlock: { cardId: 'neighbor', level: 2 } },
  { id: 'sitter', cat: 'crew', name: 'Няня', desc: '+2.5 кост./сек за уровень', icon: '🧸', baseCost: 800, costMult: 1.19, orePerSec: 2.5, clickPct: 0, maxLevel: 20, unlock: { cardId: 'walker', level: 3 } },
  { id: 'groom_team', cat: 'crew', name: 'Бригада грумеров', desc: '+8 кост./сек за уровень', icon: '✂️', baseCost: 3200, costMult: 1.20, orePerSec: 8, clickPct: 0, maxLevel: 20, unlock: { cardId: 'sitter', level: 2 } },
  { id: 'rescue', cat: 'crew', name: 'Спасатели двора', desc: '+26 кост./сек за уровень', icon: '🚑', baseCost: 14000, costMult: 1.21, orePerSec: 26, clickPct: 0, maxLevel: 20, unlock: { cardId: 'groom_team', level: 3 } },
  { id: 'pack_leader', cat: 'crew', name: 'Вожак стаи', desc: '+90 кост./сек за уровень', icon: '🐺', baseCost: 65000, costMult: 1.22, orePerSec: 90, clickPct: 0.01, maxLevel: 20, unlock: { need: [{ cardId: 'rescue', level: 4 }, { cardId: 'kiosk', level: 2 }] } },

  { id: 'kiosk', cat: 'district', name: 'Ларьёк', desc: '+0.32 кост./сек за уровень', icon: '🏪', baseCost: 70, costMult: 1.18, orePerSec: 0.32, clickPct: 0, maxLevel: 20, unlock: null },
  { id: 'skver', cat: 'district', name: 'Сквер', desc: '+1.0 кост./сек за уровень', icon: '🌳', baseCost: 280, costMult: 1.18, orePerSec: 1.0, clickPct: 0, maxLevel: 20, unlock: { cardId: 'kiosk', level: 2 } },
  { id: 'vet', cat: 'district', name: 'Ветеринар', desc: '+3.2 кост./сек за уровень', icon: '💉', baseCost: 1100, costMult: 1.19, orePerSec: 3.2, clickPct: 0, maxLevel: 20, unlock: { need: [{ cardId: 'skver', level: 2 }, { cardId: 'walker', level: 2 }] } },
  { id: 'cafe', cat: 'district', name: 'Кафе для лап', desc: '+10 кост./сек за уровень', icon: '☕', baseCost: 4500, costMult: 1.20, orePerSec: 10, clickPct: 0, maxLevel: 20, unlock: { cardId: 'vet', level: 3 } },
  { id: 'stadium', cat: 'district', name: 'Площадка', desc: '+34 кост./сек за уровень', icon: '🏟️', baseCost: 20000, costMult: 1.21, orePerSec: 34, clickPct: 0, maxLevel: 20, unlock: { cardId: 'cafe', level: 3 } },
  { id: 'mayor', cat: 'district', name: 'Мэр района', desc: '+120 кост./сек за уровень', icon: '🎩', baseCost: 90000, costMult: 1.22, orePerSec: 120, clickPct: 0, maxLevel: 20, unlock: { need: [{ cardId: 'stadium', level: 4 }, { cardId: 'poster', level: 2 }] } },

  { id: 'poster', cat: 'special', name: 'Афиша двора', desc: '+0.40 кост./сек за уровень', icon: '🪧', baseCost: 120, costMult: 1.18, orePerSec: 0.40, clickPct: 0.008, maxLevel: 20, unlock: { upgradeId: 'pickaxe', level: 2 } },
  { id: 'mascot', cat: 'special', name: 'Талисман', desc: '+1.4 кост./сек за уровень', icon: '🎀', baseCost: 500, costMult: 1.19, orePerSec: 1.4, clickPct: 0, maxLevel: 20, unlock: { cardId: 'poster', level: 3 } },
  { id: 'cup', cat: 'special', name: 'Кубок двора', desc: '+4.5 кост./сек за уровень', icon: '🏆', baseCost: 2000, costMult: 1.20, orePerSec: 4.5, clickPct: 0, maxLevel: 20, unlock: { need: [{ cardId: 'mascot', level: 2 }, { cardId: 'sitter', level: 3 }] } },
  { id: 'legend', cat: 'special', name: 'Легенда района', desc: '+15 кост./сек за уровень', icon: '⭐', baseCost: 9000, costMult: 1.21, orePerSec: 15, clickPct: 0, maxLevel: 20, unlock: { cardId: 'cup', level: 4 } },
  { id: 'dynasty', cat: 'special', name: 'Династия', desc: '+50 кост./сек за уровень', icon: '👑', baseCost: 40000, costMult: 1.22, orePerSec: 50, clickPct: 0.015, maxLevel: 20, unlock: { need: [{ cardId: 'legend', level: 3 }, { cardId: 'pack_leader', level: 2 }] } },
  { id: 'throne', cat: 'special', name: 'Трон дворика', desc: '+180 кост./сек за уровень', icon: '🪑', baseCost: 220000, costMult: 1.24, orePerSec: 180, clickPct: 0, maxLevel: 20, unlock: { need: [{ cardId: 'dynasty', level: 5 }, { cardId: 'mayor', level: 3 }] } },
];
const SKILL_CARD_IDS = SKILL_CARDS.map(function (c) { return c.id; });
const SKILL_CARDS_BY_ID = {};
SKILL_CARDS.forEach(function (c) { SKILL_CARDS_BY_ID[c.id] = c; });

/** Paid pack branches — cards stay visible; upgrades require IAP unlock. */
const PACK_BRANCHES = [
  { id: 'crew', tag: 'PACK_CREW', flag: 'packCrew', icon: '🐺' },
  { id: 'district', tag: 'PACK_DISTRICT', flag: 'packDistrict', icon: '🏘️' },
  { id: 'special', tag: 'PACK_SPECIAL', flag: 'packSpecial', icon: '⭐' },
];
const PACK_BRANCH_BY_ID = {};
PACK_BRANCHES.forEach(function (b) { PACK_BRANCH_BY_ID[b.id] = b; });

function packBranchReward(cat) {
  const cards = SKILL_CARDS.filter(function (c) { return c.cat === cat; });
  let perLvl = 0;
  let maxIdle = 0;
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const maxL = c.maxLevel || CARD_MAX_LEVEL;
    perLvl += c.orePerSec || 0;
    maxIdle += (c.orePerSec || 0) * maxL;
  }
  return { count: cards.length, perLvl: perLvl, maxIdle: maxIdle, cards: cards };
}

function packStarterId(cat) {
  for (let i = 0; i < SKILL_CARDS.length; i++) {
    if (SKILL_CARDS[i].cat === cat) return SKILL_CARDS[i].id;
  }
  return null;
}
function isPackStarterCard(card) {
  return !!(card && packStarterId(card.cat) === card.id);
}

function defaultPackUnlocks() {
  return { crew: false, district: false, special: false };
}

const BREEDS = {
  lab: { id: 'lab', name: 'Лабрадор', desc: 'Сбалансированный старт', src: 'assets/dog-click.webp', walkSrc: 'assets/dog-lab-walk.webp', sitSrc: 'assets/dog-lab-sit.webp', sitdownSrc: 'assets/dog-lab-sitdown.webp', standupSrc: 'assets/dog-lab-standup.webp', sitdownFrames: 4, walkFrames: 4, frameW: 192, frameH: 192, unlockCost: 0, bonuses: { clickMult: 1, idleMult: 1, comboWindowBonus: 0 }, startUnlocked: true },
  corgi: { id: 'corgi', name: 'Корги', desc: '+5% к почесушкам', src: 'assets/dog-corgi.webp', walkSrc: 'assets/dog-corgi-walk.webp', sitSrc: 'assets/dog-corgi-sit.webp', sitdownSrc: 'assets/dog-corgi-sitdown.webp', standupSrc: 'assets/dog-corgi-standup.webp', sitdownFrames: 4, walkFrames: 4, frameW: 192, frameH: 192, unlockCost: 35000, reqLifetime: 1e5, bonuses: { clickMult: 1.05, idleMult: 1, comboWindowBonus: 0 }, startUnlocked: false },
  husky: { id: 'husky', name: 'Хаски', desc: '+5% к автодоходу', src: 'assets/dog-husky.webp', walkSrc: 'assets/dog-husky-walk.webp', sitSrc: 'assets/dog-husky-sit.webp', sitdownSrc: 'assets/dog-husky-sitdown.webp', standupSrc: 'assets/dog-husky-standup.webp', sitdownFrames: 4, walkFrames: 4, frameW: 192, frameH: 192, unlockCost: 140000, reqLifetime: 5e5, bonuses: { clickMult: 1, idleMult: 1.05, comboWindowBonus: 0 }, startUnlocked: false },
  dachshund: { id: 'dachshund', name: 'Такса', desc: '+200 мс к окну комбо', src: 'assets/dog-dachshund.webp', walkSrc: 'assets/dog-dachshund-walk.webp', sitSrc: 'assets/dog-dachshund-sit.webp', sitdownSrc: 'assets/dog-dachshund-sitdown.webp', standupSrc: 'assets/dog-dachshund-standup.webp', sitdownFrames: 4, walkFrames: 4, frameW: 192, frameH: 192, unlockCost: 450000, reqLifetime: 2.5e6, reqMedals: 1, bonuses: { clickMult: 1, idleMult: 1, comboWindowBonus: 200 }, startUnlocked: false },
  shiba: { id: 'shiba', name: 'Сиба', desc: '+4% к почесушкам и +2% к автодоходу', src: 'assets/dog-shiba.webp', walkSrc: 'assets/dog-shiba-walk.webp', sitSrc: 'assets/dog-shiba-sit.webp', sitdownSrc: 'assets/dog-shiba-sitdown.webp', standupSrc: 'assets/dog-shiba-standup.webp', sitdownFrames: 4, walkFrames: 4, frameW: 192, frameH: 192, unlockCost: 1.2e6, reqLifetime: 6e6, reqMedals: 2, bonuses: { clickMult: 1.04, idleMult: 1.02, comboWindowBonus: 0 }, startUnlocked: false },
  poodle: { id: 'poodle', name: 'Пудель', desc: '+8% к автодоходу', src: 'assets/dog-poodle.webp', walkSrc: 'assets/dog-poodle-walk.webp', sitSrc: 'assets/dog-poodle-sit.webp', sitdownSrc: 'assets/dog-poodle-sitdown.webp', standupSrc: 'assets/dog-poodle-standup.webp', sitdownFrames: 4, walkFrames: 4, frameW: 192, frameH: 192, unlockCost: 2.8e6, reqLifetime: 2.5e7, reqMedals: 3, bonuses: { clickMult: 1, idleMult: 1.08, comboWindowBonus: 0 }, startUnlocked: false },
  beagle: { id: 'beagle', name: 'Бигль', desc: '+6% к почесушкам · +80 мс комбо', src: 'assets/dog-beagle.webp', walkSrc: 'assets/dog-beagle-walk.webp', sitSrc: 'assets/dog-beagle-sit.webp', sitdownSrc: 'assets/dog-beagle-sitdown.webp', standupSrc: 'assets/dog-beagle-standup.webp', sitdownFrames: 4, walkFrames: 4, frameW: 192, frameH: 192, unlockCost: 7e6, reqLifetime: 8e7, reqMedals: 5, bonuses: { clickMult: 1.06, idleMult: 1, comboWindowBonus: 80 }, startUnlocked: false },
};
const BREED_COUNT = Object.keys(BREEDS).length;

const YARDS = {
  sunny: { id: 'sunny', name: 'Солнечный', desc: 'Тёплый день во дворе', src: 'assets/yard-sunny.webp', unlockCost: 0, startUnlocked: true },
  evening: { id: 'evening', name: 'Вечер', desc: 'Мягкий закат', src: 'assets/yard-evening.webp', unlockCost: 80000, reqLifetime: 3.5e5, startUnlocked: false },
  winter: { id: 'winter', name: 'Зима', desc: 'Снежный дворик', src: 'assets/yard-winter.webp', unlockCost: 600000, reqLifetime: 3.5e6, reqMedals: 1, startUnlocked: false },
  autumn: { id: 'autumn', name: 'Осень', desc: 'Золотые листья фестиваля', src: 'assets/yard-autumn.webp', unlockCost: 0, startUnlocked: false, seasonOnly: true },
};

const FRIENDS = {
  cat: { id: 'cat', name: 'Котик', desc: '+3% к почесушкам', src: 'assets/pet-cat.webp', unlockCost: 70000, reqLifetime: 2.5e5, bonuses: { clickMult: 1.03, idleMult: 1 } },
  rabbit: { id: 'rabbit', name: 'Кролик', desc: '+3% к автодоходу', src: 'assets/pet-rabbit.webp', unlockCost: 180000, reqLifetime: 7e5, bonuses: { clickMult: 1, idleMult: 1.03 } },
  hamster: { id: 'hamster', name: 'Хомячок', desc: '+2% к почесушкам · +2% к автодоходу', src: 'assets/pet-hamster.webp', unlockCost: 450000, reqLifetime: 2.5e6, reqMedals: 1, bonuses: { clickMult: 1.02, idleMult: 1.02 } },
};

const STICKERS = [
  { id: 'paw', name: 'Лапки', icon: '🐾', how: 'Достижение «Первые лапки»' },
  { id: 'bone', name: 'Косточка', icon: '🦴', how: 'Достижение «Косточка в лапке»' },
  { id: 'heart', name: 'Сердце', icon: '💖', how: 'Прочитать 3 главы' },
  { id: 'ball', name: 'Мячик', icon: '🎾', how: 'Событие «Пропала игрушка»' },
  { id: 'star', name: 'Звезда', icon: '⭐', how: 'Событие «Дрессировка»' },
  { id: 'medal', name: 'Медаль', icon: '🏅', how: 'Устроить выставку' },
  { id: 'cat', name: 'Котик', icon: '🐱', how: 'Открыть друга Котика' },
  { id: 'rabbit', name: 'Кролик', icon: '🐰', how: 'Открыть друга Кролика' },
  { id: 'hamster', name: 'Хомяк', icon: '🐹', how: 'Открыть друга Хомячка' },
  { id: 'leaf', name: 'Листок', icon: '🍁', how: 'Осенний фестиваль' },
  { id: 'acorn', name: 'Жёлудь', icon: '🌰', how: 'Купить в сезонном магазине' },
  { id: 'hide', name: 'Прятки', icon: '🃏', how: 'Выиграть в «Прятки»' },
];

const STICKER_SETS = [
  { id: 'yard_life', name: 'Жизнь дворика', stickers: ['paw', 'bone', 'heart', 'ball'], reward: 800 },
  { id: 'pals', name: 'Друзья', stickers: ['cat', 'rabbit', 'hamster'], reward: 1500 },
  { id: 'festival', name: 'Фестиваль', stickers: ['leaf', 'acorn', 'hide', 'star'], reward: 1200 },
  { id: 'champions', name: 'Чемпионы', stickers: ['medal', 'star', 'bone'], reward: 1000 },
];

const SEASON_SHOP = [
  { id: 'yard_autumn', name: 'Осенний двор', desc: 'Фон «Осень» навсегда', icon: '🍂', costAcorns: 110, kind: 'yard' },
  { id: 'sticker_acorn', name: 'Наклейка «Жёлудь»', desc: 'Эксклюзив фестиваля', icon: '🌰', costAcorns: 75, kind: 'sticker', stickerId: 'acorn' },
  { id: 'temp_boost', name: 'Осенний заряд', desc: 'x1.25 косточки на 60 с', icon: '⚡', costAcorns: 55, kind: 'boost' },
];


const GP_PRODUCTS = [
  { tag: 'PACK_CREW', name: 'Стая · Команда', desc: 'Открывает ветку «Команда»: 6 карточек автодохода', icon: '🐺', kind: 'permanent', flag: 'packCrew', packCat: 'crew' },
  { tag: 'PACK_DISTRICT', name: 'Стая · Район', desc: 'Открывает ветку «Район»: 6 карточек автодохода', icon: '🏘️', kind: 'permanent', flag: 'packDistrict', packCat: 'district' },
  { tag: 'PACK_SPECIAL', name: 'Стая · Особые', desc: 'Открывает ветку «Особые»: 6 карточек автодохода', icon: '⭐', kind: 'permanent', flag: 'packSpecial', packCat: 'special' },
  { tag: 'BONES_PACK_S', name: 'Горсть косточек', desc: '+2 500 косточек', icon: '🦴', kind: 'consumable', bones: 2500 },
  { tag: 'BONES_PACK_M', name: 'Мешок косточек', desc: '+25 000 косточек', icon: '🎒', kind: 'consumable', bones: 25000 },
  { tag: 'NO_ADS', name: 'Без рекламы', desc: 'Награды без видео · скрыть sticky', icon: '🚫', kind: 'permanent', flag: 'noAds' },
  { tag: 'VIP_TREATS', name: 'VIP-лакомства', desc: '+15% ко всем доходам навсегда', icon: '👑', kind: 'permanent', flag: 'vipTreats' },
];

const CONSUMABLES = {
  boneBoost: { id: 'boneBoost', name: 'Косточка удачи', desc: 'x2 косточки на 30 сек', icon: '🍀', cost: 350, durationMs: 30 * 1000, mult: 2 },
};

const ACHIEVEMENTS = [
  { id: 'clicks_50', name: 'Первые лапки', desc: 'Почесать 50 раз', check: (s) => s.stats.totalClicks >= 50, reward: 60 },
  { id: 'clicks_500', name: 'Любимчик', desc: 'Почесать 500 раз', check: (s) => s.stats.totalClicks >= 500, reward: 400 },
  { id: 'clicks_5k', name: 'Чемпион почесушек', desc: 'Почесать 5 000 раз', check: (s) => s.stats.totalClicks >= 5000, reward: 3500 },
  { id: 'clicks_25k', name: 'Бесконечные ласки', desc: 'Почесать 25 000 раз', check: (s) => s.stats.totalClicks >= 25000, reward: 35000 },
  { id: 'bones_1k', name: 'Косточка в лапке', desc: 'Заработать 1 000 косточек', check: (s) => s.stats.lifetimeBones >= 1e3, reward: 120 },
  { id: 'bones_100k', name: 'Сундук косточек', desc: 'Заработать 100 000 косточек', check: (s) => s.stats.lifetimeBones >= 1e5, reward: 5000 },
  { id: 'bones_1m', name: 'Миллионер дворика', desc: 'Заработать 1 000 000 косточек', check: (s) => s.stats.lifetimeBones >= 1e6, reward: 35000 },
  { id: 'bones_100m', name: 'Собачий олигарх', desc: 'Заработать 100 000 000 косточек', check: (s) => s.stats.lifetimeBones >= 1e8, reward: 3500000 },
  { id: 'bones_1b', name: 'Легенда косточек', desc: 'Заработать 1 000 000 000 косточек', check: (s) => s.stats.lifetimeBones >= 1e9, reward: 25000000 },
  { id: 'upgrades_10', name: 'Заботливый хозяин', desc: 'Купить 10 апгрейдов', check: (s) => s.stats.upgradesBought >= 10, reward: 200 },
  { id: 'upgrades_50', name: 'Питомник мечты', desc: 'Купить 50 апгрейдов', check: (s) => s.stats.upgradesBought >= 50, reward: 6000 },
  { id: 'upgrades_200', name: 'Империя заботы', desc: 'Купить 200 апгрейдов', check: (s) => s.stats.upgradesBought >= 200, reward: 120000 },
  { id: 'prestige_1', name: 'Звезда выставки', desc: 'Устроить выставку 1 раз', check: (s) => s.prestigeLevel >= 1, reward: 15000 },
  { id: 'prestige_5', name: 'Мастер ринга', desc: 'Устроить выставку 5 раз', check: (s) => s.prestigeLevel >= 5, reward: 150000 },
  { id: 'prestige_10', name: 'Чемпион всех времён', desc: 'Устроить выставку 10 раз', check: (s) => s.prestigeLevel >= 10, reward: 800000 },
  { id: 'breed_1', name: 'Новый друг', desc: 'Открыть любую породу', check: (s) => (s.unlockedBreeds || []).filter((b) => b !== 'lab').length >= 1, reward: 4000 },
  { id: 'breed_all', name: 'Собачья семья', desc: 'Открыть все породы', check: (s) => (s.unlockedBreeds || []).length >= BREED_COUNT, reward: 400000 },
  { id: 'yard_1', name: 'Новый вид', desc: 'Открыть фон двора', check: (s) => (s.unlockedYards || []).filter((y) => y !== 'sunny').length >= 1, reward: 8000 },
  { id: 'event_3', name: 'Искатель игрушек', desc: 'Завершить 3 события', check: (s) => (s.stats.eventsDone || 0) >= 3, reward: 1200 },
  { id: 'event_25', name: 'Герой двора', desc: 'Завершить 25 событий', check: (s) => (s.stats.eventsDone || 0) >= 25, reward: 40000 },
  { id: 'walks_10', name: 'Гуляка', desc: 'Завершить 10 прогулок', check: (s) => (s.stats.walksDone || 0) >= 10, reward: 6000 },
  { id: 'walks_50', name: 'Следопыт', desc: 'Завершить 50 прогулок', check: (s) => (s.stats.walksDone || 0) >= 50, reward: 50000 },
  { id: 'yard_stage_3', name: 'Этап III', desc: 'Достичь 3 этапа двора', check: (s) => (s.yardStage || 1) >= 3, reward: 25000 },
  { id: 'yard_stage_5', name: 'Этап V', desc: 'Достичь 5 этапа двора', check: (s) => (s.yardStage || 1) >= 5, reward: 400000 },
  { id: 'daily_streak_7', name: 'Неделя заботы', desc: 'Серия ежедневных целей 7 дней', check: (s) => (s.dailyStreak || 0) >= 7, reward: 25000 },
];

const STORY = [
  { id: 'ch1', title: 'Первая встреча', unlock: (s) => true, lines: [
    { who: 'narrator', text: 'В тихом дворике появился маленький хвостик. Он смотрел на вас блестящими глазами.' },
    { who: 'dog', text: 'Гав! Ты… мой человек? Можно почесать за ушком?' },
    { who: 'narrator', text: 'Так началась дружба — с одной почесушки и одной косточки.' },
  ]},
  { id: 'ch2', title: 'Любимая косточка', unlock: (s) => s.stats.lifetimeBones >= 200, lines: [
    { who: 'narrator', text: 'Косточки копились быстрее лапок. Пёсик прятал лучшую под лежанку.' },
    { who: 'dog', text: 'Эта — особенная! Её мы заработали вместе. Не съедим… пока.' },
    { who: 'narrator', text: 'Вы улыбнулись. Дворик стал чуть уютнее.' },
  ]},
  { id: 'ch3', title: 'Новые друзья', unlock: (s) => (s.unlockedBreeds || []).length >= 2 || s.stats.upgradesBought >= 8, lines: [
    { who: 'narrator', text: 'Во дворе появился новый носик. Хвостики виляли так, что ветер поднялся.' },
    { who: 'dog', text: 'Смотри, друг! Теперь нас двое. Почесушек хватит на всех!' },
    { who: 'narrator', text: 'И правда — радости стало вдвое больше.' },
  ]},
  { id: 'ch4', title: 'Пропажа мячика', unlock: (s) => s.stats.lifetimeBones >= 5000 || (s.stats.eventsDone || 0) >= 1, lines: [
    { who: 'narrator', text: 'Однажды утром мячик исчез. Двор затих… почти.' },
    { who: 'dog', text: 'Игрууушка! Помоги найти — я буду очень храбрым!' },
    { who: 'narrator', text: 'Вы искали вместе. Награда ждала самых быстрых лапок.' },
    { who: 'dog', text: 'Нашли! Ты лучший. Гав-гав!' },
  ]},
  { id: 'ch5', title: 'Вечерний двор', unlock: (s) => (s.unlockedYards || []).indexOf('evening') !== -1 || s.stats.lifetimeBones >= 15000, lines: [
    { who: 'narrator', text: 'Закат окрасил забор персиковым светом. Пёсик лёг рядом.' },
    { who: 'dog', text: 'В такие вечера косточки вкуснее… и ты ещё добрее.' },
    { who: 'narrator', text: 'Дворик научился быть красивым — не только полезным.' },
  ]},
  { id: 'ch6', title: 'Зимняя прогулка', unlock: (s) => (s.unlockedYards || []).indexOf('winter') !== -1 || s.stats.lifetimeBones >= 50000, lines: [
    { who: 'narrator', text: 'Снег укрыл тропинки. Следы лапок вели к вам.' },
    { who: 'dog', text: 'Холодно носику, но тепло сердцу. Побегаем?' },
    { who: 'narrator', text: 'Вы бежали по снегу, а косточки звенели, как колокольчики.' },
  ]},
  { id: 'ch7', title: 'Звезда дворика', unlock: (s) => s.prestigeLevel >= 1 || s.stats.lifetimeBones >= 2e8, lines: [
    { who: 'narrator', text: 'На выставке блестели медальки. Но пёсик смотрел только на вас.' },
    { who: 'dog', text: 'Пусть все хвалят породу. Я хвалю своего человека.' },
    { who: 'narrator', text: 'Самая важная награда — дружба. А дворик только начинается.' },
    { who: 'dog', text: 'Гав! Ещё почесушку — ради истории?' },
  ]},
  { id: 'ch8', title: 'Гости во дворе', unlock: (s) => (s.unlockedFriends || []).length >= 1 || s.stats.lifetimeBones >= 8000, lines: [
    { who: 'narrator', text: 'За калиткой мяукнуло. Потом шуршание — и носик кролика.' },
    { who: 'dog', text: 'Друзья! Можно делиться лежачкой… почти.' },
    { who: 'narrator', text: 'Во дворике стало шумнее — и теплее.' },
  ]},
  { id: 'ch9', title: 'Альбом наклеек', unlock: (s) => (s.stickers || []).length >= 2 || Object.keys(s.storyRead || {}).length >= 4, lines: [
    { who: 'narrator', text: 'На столе появился пухлый альбом. Страницы пахли клеем и радостью.' },
    { who: 'dog', text: 'Сюда — лапки, мячик, звёздочку! Я помогу лизнуть уголок.' },
    { who: 'narrator', text: 'Каждая наклейка — маленькая память дворика.' },
  ]},
  { id: 'ch10', title: 'Игра в прятки', unlock: (s) => (s.stats.eventsDone || 0) >= 2 || s.stats.lifetimeBones >= 12000, lines: [
    { who: 'narrator', text: 'Косточка исчезла под тремя мисками. Хвостик дрожал от азарта.' },
    { who: 'dog', text: 'Угадай! Я почти не подсматривал. Честно-честно.' },
    { who: 'narrator', text: 'Вы угадали — или почти. Главное — смех.' },
  ]},
  { id: 'ch11', title: 'Осенний фестиваль', unlock: (s) => (s.acorns || 0) >= 5 || (s.unlockedYards || []).indexOf('autumn') !== -1 || s.stats.lifetimeBones >= 25000, lines: [
    { who: 'narrator', text: 'Листья закружились золотом. На заборе повесили гирлянду из жёлудей.' },
    { who: 'dog', text: 'Фестиваль! Белка зовёт на гонку. Жёлуди звенят в кармане!' },
    { who: 'narrator', text: 'Осень пришла не холодом — праздником.' },
  ]},
  { id: 'ch12', title: 'Гонка с белкой', unlock: (s) => (s.stats.eventsDone || 0) >= 5 || (s.stickers || []).indexOf('hide') !== -1, lines: [
    { who: 'narrator', text: 'Белка махнула пушистым хвостом — и сорвалась с места.' },
    { who: 'dog', text: 'Тап-тап-тап! Не отставай, человек!' },
    { who: 'narrator', text: 'Вы финишировали вместе. Белка кивнула уважительно.' },
  ]},
  { id: 'ch13', title: 'Семья дворика', unlock: (s) => ((s.stickers || []).length >= 8) || ((s.unlockedFriends || []).length >= 2 && Object.keys(s.storyRead || {}).length >= 8), lines: [
    { who: 'narrator', text: 'Вечер. На лежанке — пёс, кот, кролик и хомяк. Альбом открыт на последней странице.' },
    { who: 'dog', text: 'Смотри: мы все здесь. И ты — в центре.' },
    { who: 'narrator', text: 'Дворик вырос. Но сердце осталось тем же — тёплым и готовым к почесушке.' },
    { who: 'dog', text: 'Гав. Ещё глава? Или просто посидим…' },
  ]},
];

const QUEST_POOL = [
  { type: 'clicks', label: (n) => 'Почесать пёсика ' + n + ' раз', targets: [100, 180, 300, 500], rewardScale: 1.0 },
  { type: 'earn', label: (n) => 'Заработать ' + fmtStatic(n) + ' косточек', targets: [4000, 15000, 60000, 2.5e5, 1e6], rewardScale: 0.28 },
  { type: 'buy', label: (n) => 'Купить апгрейды: ' + n, targets: [3, 5, 8], rewardScale: 2.0 },
];

const MEDAL_SHOP = [
  { id: 'm_click', name: 'Лапки чемпиона', desc: '+6% к почесушкам за уровень', icon: '✋', maxLevel: 12, baseCost: 2, costMult: 1.75, clickMult: 0.06 },
  { id: 'm_idle', name: 'Спокойный двор', desc: '+6% к автодоходу за уровень', icon: '😴', maxLevel: 12, baseCost: 2, costMult: 1.75, idleMult: 0.06 },
  { id: 'm_energy', name: 'Выносливость', desc: '+8 макс. энергии · +8% реген', icon: '⚡', maxLevel: 8, baseCost: 2, costMult: 1.9, energyMax: 8, energyRegen: 0.08 },
  { id: 'm_offline', name: 'Сторож двора', desc: '+8% эффективности офлайна', icon: '🌙', maxLevel: 10, baseCost: 2, costMult: 1.8, offlineBonus: 0.08 },
];

const WALK_TIERS = [
  { id: 'short', name: 'Короткая', icon: '🚶', energy: 18, boneCost: 40, durationMs: 60 * 1000, rewardMult: 0.5, stickerChance: 0.08, acornChance: 0.12, unlockStage: 1 },
  { id: 'park', name: 'В парк', icon: '🌳', energy: 32, boneCost: 400, durationMs: 2.5 * 60 * 1000, rewardMult: 0.95, stickerChance: 0.14, acornChance: 0.22, unlockStage: 2 },
  { id: 'long', name: 'Дальняя', icon: '🏞️', energy: 48, boneCost: 3200, durationMs: 4 * 60 * 1000, rewardMult: 1.75, stickerChance: 0.22, acornChance: 0.35, unlockStage: 4, unlockPrestige: 1 },
];

const YARD_STAGES = [
  { level: 1, title: 'Пустой дворик', reqLifetime: 0, reqPrestige: 0, incomeMult: 1, hook: 'Первые лапки на земле.' },
  { level: 2, title: 'Уютный дворик', reqLifetime: 1.2e5, reqPrestige: 0, incomeMult: 1.03, hook: 'Появилась любимая тропинка.' },
  { level: 3, title: 'Известный двор', reqLifetime: 1.8e6, reqPrestige: 0, incomeMult: 1.07, hook: 'Соседи заглядывают через забор.' },
  { level: 4, title: 'Чемпионский', reqLifetime: 2.5e7, reqPrestige: 1, incomeMult: 1.12, hook: 'Медальки блестят на калитке.' },
  { level: 5, title: 'Легенда района', reqLifetime: 2.5e8, reqPrestige: 3, incomeMult: 1.18, hook: 'Гости приходят за почесушками.' },
  { level: 6, title: 'Эпоха дворика', reqLifetime: 2e9, reqPrestige: 6, incomeMult: 1.25, hook: 'История пишется вместе.' },
];

const DAILY_GOAL_POOL = [
  { type: 'clicks', label: (n) => 'Почесать ' + n + ' раз', targets: [180, 300, 450], rewardBones: [300, 550, 900] },
  { type: 'earn', label: (n) => 'Заработать ' + fmtStatic(n) + ' 🦴', targets: [8000, 35000, 1.5e5], rewardBones: [400, 700, 1400] },
  { type: 'walks', label: (n) => 'Завершить прогулок: ' + n, targets: [1, 2], rewardBones: [450, 850] },
  { type: 'events', label: (n) => 'Событий: ' + n, targets: [1, 2], rewardBones: [500, 1000] },
  { type: 'buy', label: (n) => 'Купить апгрейдов: ' + n, targets: [4, 7, 12], rewardBones: [350, 600, 1100] },
];

function fmtStatic(n) {
  if (!isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return Math.floor(n).toString();
}

function defaultLevels() {
  const levels = {};
  for (const id of UPGRADE_ORDER) levels[id] = 0;
  return levels;
}
function defaultTrainingLevels() {
  const levels = {};
  for (let i = 0; i < TRAINING_ORDER.length; i++) levels[TRAINING_ORDER[i]] = 0;
  return levels;
}
function defaultCardLevels() {
  const levels = {};
  for (let i = 0; i < SKILL_CARD_IDS.length; i++) levels[SKILL_CARD_IDS[i]] = 0;
  return levels;
}


  return {
    AUTOSAVE_MS,
    OFFLINE_CAP_SEC,
    OFFLINE_BED_BONUS_SEC,
    OFFLINE_BASE_EFF,
    AD_BOOST_MULT,
    AD_BOOST_DURATION_MS,
    SAVE_KEY,
    LEGACY_SAVE_KEY,
    SAVE_VERSION,
    SEASON_FORCE,
    ACORN_PER_CLICK,
    ACORN_EVENT_BASE,
    SEASON_BOOST_MULT,
    SEASON_BOOST_MS,
    HIDE_TRIES,
    RACE_DURATION_MS,
    RACE_DECAY_PER_SEC,
    RACE_TAP_GAIN,
    COMBO_WINDOW_MS,
    COMBO_MAX,
    COMBO_STEP,
    COMBO_DECAY_PER_SEC,
    WHISTLE_COMBO_MS,
    JOY_MULT,
    JOY_DURATION_MS,
    JOY_COOLDOWN_MS,
    PRESTIGE_REQ_BASE,
    PRESTIGE_REQ_SCALE,
    PRESTIGE_MEDAL_INCOME,
    BASE_CLICK,
    VIP_INCOME_MULT,
    CLICK_SOFTCAP,
    IDLE_SOFTCAP,
    SOFTCAP_POWER,
    CARD_MAX_LEVEL,
    ENERGY_MAX_BASE,
    ENERGY_PER_CLICK,
    ENERGY_REGEN_PER_SEC,
    ENERGY_TIRED_MULT,
    ENERGY_REST_GAIN,
    ENERGY_REST_COOLDOWN_MS,
    EVENT_MIN_MS,
    EVENT_MAX_MS,
    TOY_DURATION_MS,
    TOY_REWARD_PER_TAP,
    EVENT_REWARD_MULT,
    UPGRADES,
    UPGRADE_ORDER,
    SHOP_CATS,
    SHOP_CAT_IDS,
    TRAINING,
    TRAINING_ORDER,
    CARD_CATS,
    SKILL_CARDS,
    SKILL_CARD_IDS,
    SKILL_CARDS_BY_ID,
    PACK_BRANCHES,
    PACK_BRANCH_BY_ID,
    packBranchReward,
    packStarterId,
    isPackStarterCard,
    defaultPackUnlocks,
    BREEDS,
    BREED_COUNT,
    YARDS,
    FRIENDS,
    STICKERS,
    STICKER_SETS,
    SEASON_SHOP,
    GP_PRODUCTS,
    CONSUMABLES,
    ACHIEVEMENTS,
    STORY,
    QUEST_POOL,
    MEDAL_SHOP,
    WALK_TIERS,
    YARD_STAGES,
    DAILY_GOAL_POOL,
    fmtStatic,
    defaultLevels,
    defaultTrainingLevels,
    defaultCardLevels
  };
});
