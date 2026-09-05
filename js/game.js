/**
 * Собачий дворик — idle/clicker (cute dogs theme) · content pack v4
 *
 * ——— BALANCE CONSTANTS (документация) ———
 * Early game snappy (~1–2 мин до первых idle), mid-game lasts.
 * Cost growth targets ~1.12–1.18 per level.
 * Prestige at 1e6 lifetime bones → +10% all income per медалька.
 * Combo window 800ms (dachshund +200ms, whistle +levels), soft-cap x3.
 * Радость: x2 click 10s, cooldown 45s.
 * Events ~3–5 min; consumable x2 bones 30s.
 */
(function () {
  'use strict';

  const AUTOSAVE_MS = 4000;
  const OFFLINE_CAP_SEC = 8 * 60 * 60;
  const OFFLINE_BED_BONUS_SEC = 30 * 60;
  const AD_BOOST_MULT = 2;
  const AD_BOOST_DURATION_MS = 60 * 1000;
  const SAVE_KEY = 'dog-yard-clicker-v1';
  const LEGACY_SAVE_KEY = 'ore-mine-clicker-v1';
  const SAVE_VERSION = 4;
  const SEASON_FORCE = true;
  const ACORN_PER_CLICK = 0.08;
  const ACORN_EVENT_BASE = 12;
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

  const PRESTIGE_REQ_LIFETIME = 1e6;
  const PRESTIGE_MEDAL_INCOME = 0.1;
  const BASE_CLICK = 1.15;
  const VIP_INCOME_MULT = 1.15;

  const EVENT_MIN_MS = 3 * 60 * 1000;
  const EVENT_MAX_MS = 5 * 60 * 1000;
  const TOY_DURATION_MS = 10 * 1000;
  const TOY_REWARD_PER_TAP = 2.5;

  const UPGRADES = {
    pickaxe: { id: 'pickaxe', name: 'Лакомство', desc: '+1 к почесушкам', baseCost: 11, costMult: 1.14, clickPower: 1, orePerSec: 0, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🦴', unlock: null },
    miner: { id: 'miner', name: 'Щенок-помощник', desc: '+0.6 кост./сек', baseCost: 36, costMult: 1.14, clickPower: 0, orePerSec: 0.6, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🐕', unlock: null },
    ball: { id: 'ball', name: 'Мячик', desc: '+4 к почесушкам', baseCost: 78, costMult: 1.15, clickPower: 4, orePerSec: 0, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🎾', unlock: { type: 'level', id: 'pickaxe', min: 3, text: 'Нужно Лакомство ур. 3' } },
    drill: { id: 'drill', name: 'Дрессировщик', desc: '+6 кост./сек', baseCost: 300, costMult: 1.15, clickPower: 0, orePerSec: 6, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🧤', unlock: { type: 'level', id: 'miner', min: 2, text: 'Нужен Щенок-помощник ур. 2' } },
    walk: { id: 'walk', name: 'Выгул', desc: '+28 кост./сек', baseCost: 1800, costMult: 1.15, clickPower: 0, orePerSec: 28, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🦮', unlock: { type: 'level', id: 'drill', min: 1, text: 'Нужен Дрессировщик ур. 1' } },
    warehouse: { id: 'warehouse', name: 'Будка', desc: '+12% к idle', baseCost: 720, costMult: 1.16, clickPower: 0, orePerSec: 0, idleMult: 0.12, clickPct: 0, comboBonusMs: 0, icon: '🏠', unlock: { type: 'level', id: 'miner', min: 5, text: 'Нужен Щенок-помощник ур. 5' } },
    groomer: { id: 'groomer', name: 'Грумер', desc: '+18% к idle', baseCost: 4500, costMult: 1.16, clickPower: 0, orePerSec: 0, idleMult: 0.18, clickPct: 0, comboBonusMs: 0, icon: '✂️', unlock: { type: 'level', id: 'warehouse', min: 2, text: 'Нужна Будка ур. 2' } },
    kennel: { id: 'kennel', name: 'Питомник', desc: '+120 кост./сек', baseCost: 14000, costMult: 1.17, clickPower: 0, orePerSec: 120, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🏡', unlock: { type: 'level', id: 'walk', min: 2, text: 'Нужен Выгул ур. 2' } },
    collar: { id: 'collar', name: 'Ошейник', desc: '+3% к почесушкам', baseCost: 200, costMult: 1.15, clickPower: 0, orePerSec: 0, idleMult: 0, clickPct: 0.03, comboBonusMs: 0, icon: '📿', unlock: { type: 'level', id: 'pickaxe', min: 2, text: 'Нужно Лакомство ур. 2' } },
    frisbee: { id: 'frisbee', name: 'Фрисби', desc: '+4.5 кост./сек', baseCost: 440, costMult: 1.15, clickPower: 0, orePerSec: 4.5, idleMult: 0, clickPct: 0, comboBonusMs: 0, icon: '🥏', unlock: { type: 'level', id: 'miner', min: 3, text: 'Нужен Щенок-помощник ур. 3' } },
    bed: { id: 'bed', name: 'Лежанка', desc: '+30 мин офлайн-капа', baseCost: 1200, costMult: 1.18, clickPower: 0, orePerSec: 0, idleMult: 0.04, clickPct: 0, comboBonusMs: 0, icon: '🛏️', unlock: { type: 'level', id: 'warehouse', min: 1, text: 'Нужна Будка ур. 1' } },
    whistle: { id: 'whistle', name: 'Свисток', desc: '+40 мс к окну комбо', baseCost: 900, costMult: 1.16, clickPower: 0, orePerSec: 0, idleMult: 0, clickPct: 0, comboBonusMs: WHISTLE_COMBO_MS, icon: '📣', unlock: { type: 'level', id: 'ball', min: 2, text: 'Нужен Мячик ур. 2' } },
  };

  const UPGRADE_ORDER = ['pickaxe','miner','collar','ball','frisbee','drill','warehouse','whistle','bed','walk','groomer','kennel'];

  const BREEDS = {
    lab: { id: 'lab', name: 'Лабрадор', desc: 'Сбалансированный старт', src: 'assets/dog-click.png', unlockCost: 0, bonuses: { clickMult: 1, idleMult: 1, comboWindowBonus: 0 }, startUnlocked: true },
    corgi: { id: 'corgi', name: 'Корги', desc: '+5% к почесушкам', src: 'assets/dog-corgi.png', unlockCost: 2500, bonuses: { clickMult: 1.05, idleMult: 1, comboWindowBonus: 0 }, startUnlocked: false },
    husky: { id: 'husky', name: 'Хаски', desc: '+5% к idle', src: 'assets/dog-husky.png', unlockCost: 8000, bonuses: { clickMult: 1, idleMult: 1.05, comboWindowBonus: 0 }, startUnlocked: false },
    dachshund: { id: 'dachshund', name: 'Такса', desc: '+200 мс к окну комбо', src: 'assets/dog-dachshund.png', unlockCost: 15000, bonuses: { clickMult: 1, idleMult: 1, comboWindowBonus: 200 }, startUnlocked: false },
    shiba: { id: 'shiba', name: 'Сиба', desc: '+4% к почесушкам и +2% idle', src: 'assets/dog-shiba.png', unlockCost: 22000, bonuses: { clickMult: 1.04, idleMult: 1.02, comboWindowBonus: 0 }, startUnlocked: false },
    poodle: { id: 'poodle', name: 'Пудель', desc: '+8% к idle', src: 'assets/dog-poodle.png', unlockCost: 35000, bonuses: { clickMult: 1, idleMult: 1.08, comboWindowBonus: 0 }, startUnlocked: false },
    beagle: { id: 'beagle', name: 'Бигль', desc: '+6% к почесушкам · +80 мс комбо', src: 'assets/dog-beagle.png', unlockCost: 48000, bonuses: { clickMult: 1.06, idleMult: 1, comboWindowBonus: 80 }, startUnlocked: false },
  };
  const BREED_COUNT = Object.keys(BREEDS).length;

  const YARDS = {
    sunny: { id: 'sunny', name: 'Солнечный', desc: 'Тёплый день во дворе', src: 'assets/yard-sunny.png', unlockCost: 0, startUnlocked: true },
    evening: { id: 'evening', name: 'Вечер', desc: 'Мягкий закат', src: 'assets/yard-evening.png', unlockCost: 5000, startUnlocked: false },
    winter: { id: 'winter', name: 'Зима', desc: 'Снежный дворик', src: 'assets/yard-winter.png', unlockCost: 18000, startUnlocked: false },
    autumn: { id: 'autumn', name: 'Осень', desc: 'Золотые листья фестиваля', src: 'assets/yard-autumn.png', unlockCost: 0, startUnlocked: false, seasonOnly: true },
  };

  const FRIENDS = {
    cat: { id: 'cat', name: 'Котик', desc: '+3% к почесушкам', src: 'assets/pet-cat.png', unlockCost: 4500, bonuses: { clickMult: 1.03, idleMult: 1 } },
    rabbit: { id: 'rabbit', name: 'Кролик', desc: '+3% к idle', src: 'assets/pet-rabbit.png', unlockCost: 6500, bonuses: { clickMult: 1, idleMult: 1.03 } },
    hamster: { id: 'hamster', name: 'Хомячок', desc: '+2% клик · +2% idle', src: 'assets/pet-hamster.png', unlockCost: 9000, bonuses: { clickMult: 1.02, idleMult: 1.02 } },
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
    { id: 'yard_autumn', name: 'Осенний двор', desc: 'Фон «Осень» навсегда', icon: '🍂', costAcorns: 40, kind: 'yard' },
    { id: 'sticker_acorn', name: 'Наклейка «Жёлудь»', desc: 'Эксклюзив фестиваля', icon: '🌰', costAcorns: 25, kind: 'sticker', stickerId: 'acorn' },
    { id: 'temp_boost', name: 'Осенний заряд', desc: 'x1.25 косточки на 60 с', icon: '⚡', costAcorns: 18, kind: 'boost' },
  ];


  const GP_PRODUCTS = [
    { tag: 'BONES_PACK_S', name: 'Горсть косточек', desc: '+2 500 косточек', icon: '🦴', kind: 'consumable', bones: 2500 },
    { tag: 'BONES_PACK_M', name: 'Мешок косточек', desc: '+25 000 косточек', icon: '🎒', kind: 'consumable', bones: 25000 },
    { tag: 'NO_ADS', name: 'Без рекламы', desc: 'Награды без видео · скрыть sticky', icon: '🚫', kind: 'permanent', flag: 'noAds' },
    { tag: 'VIP_TREATS', name: 'VIP-лакомства', desc: '+15% ко всем доходам навсегда', icon: '👑', kind: 'permanent', flag: 'vipTreats' },
  ];

  const CONSUMABLES = {
    boneBoost: { id: 'boneBoost', name: 'Косточка удачи', desc: 'x2 косточки на 30 сек', icon: '🍀', cost: 350, durationMs: 30 * 1000, mult: 2 },
  };

  const ACHIEVEMENTS = [
    { id: 'clicks_50', name: 'Первые лапки', desc: 'Почесать 50 раз', check: (s) => s.stats.totalClicks >= 50, reward: 80 },
    { id: 'clicks_500', name: 'Любимчик', desc: 'Почесать 500 раз', check: (s) => s.stats.totalClicks >= 500, reward: 400 },
    { id: 'clicks_5k', name: 'Чемпион почесушек', desc: 'Почесать 5 000 раз', check: (s) => s.stats.totalClicks >= 5000, reward: 2500 },
    { id: 'bones_1k', name: 'Косточка в лапке', desc: 'Заработать 1 000 косточек', check: (s) => s.stats.lifetimeBones >= 1e3, reward: 120 },
    { id: 'bones_100k', name: 'Сундук косточек', desc: 'Заработать 100 000 косточек', check: (s) => s.stats.lifetimeBones >= 1e5, reward: 2000 },
    { id: 'bones_1m', name: 'Миллионер дворика', desc: 'Заработать 1 000 000 косточек', check: (s) => s.stats.lifetimeBones >= 1e6, reward: 15000 },
    { id: 'upgrades_10', name: 'Заботливый хозяин', desc: 'Купить 10 апгрейдов', check: (s) => s.stats.upgradesBought >= 10, reward: 200 },
    { id: 'upgrades_50', name: 'Питомник мечты', desc: 'Купить 50 апгрейдов', check: (s) => s.stats.upgradesBought >= 50, reward: 3000 },
    { id: 'prestige_1', name: 'Звезда выставки', desc: 'Устроить выставку 1 раз', check: (s) => s.prestigeLevel >= 1, reward: 5000 },
    { id: 'breed_1', name: 'Новый друг', desc: 'Открыть любую породу', check: (s) => (s.unlockedBreeds || []).filter((b) => b !== 'lab').length >= 1, reward: 800 },
    { id: 'breed_all', name: 'Собачья семья', desc: 'Открыть все породы', check: (s) => (s.unlockedBreeds || []).length >= BREED_COUNT, reward: 20000 },
    { id: 'yard_1', name: 'Новый вид', desc: 'Открыть фон двора', check: (s) => (s.unlockedYards || []).filter((y) => y !== 'sunny').length >= 1, reward: 600 },
    { id: 'event_3', name: 'Искатель игрушек', desc: 'Завершить 3 события', check: (s) => (s.stats.eventsDone || 0) >= 3, reward: 900 },
    { id: 'story_3', name: 'Сказочник', desc: 'Прочитать 3 главы', check: (s) => Object.keys(s.storyRead || {}).length >= 3, reward: 700 },
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
    { id: 'ch7', title: 'Звезда дворика', unlock: (s) => s.prestigeLevel >= 1 || s.stats.lifetimeBones >= 1e6, lines: [
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
    { type: 'clicks', label: (n) => 'Почесать пёсика ' + n + ' раз', targets: [25, 40, 60, 100], rewardScale: 1.2 },
    { type: 'earn', label: (n) => 'Заработать ' + fmtStatic(n) + ' косточек', targets: [200, 500, 1500, 5000, 20000], rewardScale: 0.35 },
    { type: 'buy', label: () => 'Купить любой апгрейд', targets: [1], rewardScale: 2.5 },
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

  const state = {
    ore: 0,
    levels: defaultLevels(),
    lastSaveAt: Date.now(),
    adBoostUntil: 0,
    pendingClickMult: 1,
    prestigeLevel: 0,
    medals: 0,
    selectedBreed: 'lab',
    unlockedBreeds: ['lab'],
    selectedYard: 'sunny',
    unlockedYards: ['sunny'],
    stats: { totalClicks: 0, lifetimeBones: 0, upgradesBought: 0, eventsDone: 0 },
    achievementsClaimed: {},
    quests: [],
    questDaySeed: '',
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
  };

  let lastTick = performance.now();
  let toastTimer = null;
  let activeTab = 'shop';
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
      showToast('Наклейка: ' + ((st && st.icon) || '') + ' ' + ((st && st.name) || id) + '!');
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
  function getPrestigeMult() {
    const m = Number(state.medals);
    return 1 + (isFinite(m) ? m : 0) * PRESTIGE_MEDAL_INCOME;
  }
  function getVipMult() { return state.vipTreats ? VIP_INCOME_MULT : 1; }
  function getWhistleBonus() { return (state.levels.whistle || 0) * WHISTLE_COMBO_MS; }
  function getComboWindow() {
    return COMBO_WINDOW_MS + (getBreed().bonuses.comboWindowBonus || 0) + getWhistleBonus();
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
    return m;
  }
  function getClickPower() {
    let p = BASE_CLICK;
    for (const u of Object.values(UPGRADES)) p += (state.levels[u.id] || 0) * u.clickPower;
    p *= getClickPctMult();
    p *= getBreed().bonuses.clickMult || 1;
    const fr = getFriend();
    if (fr) p *= fr.bonuses.clickMult || 1;
    p *= getPrestigeMult();
    p *= getVipMult();
    p *= Math.min(COMBO_MAX, Math.max(1, state.combo));
    if (Date.now() < state.joyUntil) p *= JOY_MULT;
    p *= getItemMult();
    if (Date.now() < (state.seasonBoostUntil || 0)) p *= SEASON_BOOST_MULT;
    if (!isFinite(p) || p < 0) return BASE_CLICK;
    return p;
  }
  function getIdleMult() {
    let m = 1;
    for (const u of Object.values(UPGRADES)) m += (state.levels[u.id] || 0) * u.idleMult;
    m *= getBreed().bonuses.idleMult || 1;
    const fr = getFriend();
    if (fr) m *= fr.bonuses.idleMult || 1;
    m *= getPrestigeMult();
    m *= getVipMult();
    if (Date.now() < state.adBoostUntil) m *= AD_BOOST_MULT;
    m *= getItemMult();
    if (Date.now() < (state.seasonBoostUntil || 0)) m *= SEASON_BOOST_MULT;
    if (!isFinite(m) || m < 0) return 1;
    return m;
  }
  function getOrePerSec() {
    let r = 0;
    for (const u of Object.values(UPGRADES)) r += (state.levels[u.id] || 0) * u.orePerSec;
    const out = r * getIdleMult();
    return isFinite(out) && out > 0 ? out : 0;
  }
  function getOfflineCapSec() {
    return OFFLINE_CAP_SEC + (state.levels.bed || 0) * OFFLINE_BED_BONUS_SEC;
  }
  function upgradeCost(id) {
    const u = UPGRADES[id];
    return Math.floor(u.baseCost * Math.pow(u.costMult, state.levels[id] || 0));
  }
  function isUpgradeUnlocked(id) {
    const u = UPGRADES[id];
    if (!u.unlock) return true;
    if (u.unlock.type === 'level') return (state.levels[u.unlock.id] || 0) >= u.unlock.min;
    return true;
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

  const $ = (sel) => document.querySelector(sel);

  function showToast(msg, ms) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, ms || 3500);
  }

  function spawnPopup(x, y, text) {
    const layer = $('#popup-layer');
    if (!layer) return;
    const span = document.createElement('span');
    span.className = 'ore-popup';
    span.textContent = text;
    span.style.left = x + 'px';
    span.style.top = y + 'px';
    span.style.setProperty('--drift-x', (Math.random() * 48 - 24).toFixed(1) + 'px');
    layer.appendChild(span);
    requestAnimationFrame(function () { span.classList.add('fly'); });
    setTimeout(function () { span.remove(); }, 950);
  }

  function spawnClickFx(clientX, clientY) {
    const layer = $('#popup-layer');
    if (!layer) return;
    const hearts = ['💕', '💗', '💖', '💓', '✨', '🐾'];
    const n = 6 + Math.floor(Math.random() * 4);
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
      setTimeout(function () { el.remove(); }, 820);
    }
  }

  function setTab(tab) {
    if (tab !== activeTab && window.Sounds && window.Sounds.playUi) window.Sounds.playUi();
    activeTab = tab;
    document.querySelectorAll('.tab').forEach(function (btn) {
      const on = btn.dataset.tab === tab;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on && typeof btn.scrollIntoView === 'function') {
        try { btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } catch (_) {}
      }
    });
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
  }

  function renderActivePanel() {
    if (activeTab === 'shop') { renderShop(); renderConsumables(); }
    else if (activeTab === 'breeds') renderBreeds();
    else if (activeTab === 'friends') renderFriends();
    else if (activeTab === 'yard') renderYards();
    else if (activeTab === 'album') renderAlbum();
    else if (activeTab === 'season') renderSeason();
    else if (activeTab === 'quests') renderQuests();
    else if (activeTab === 'achievements') renderAchievements();
    else if (activeTab === 'story') renderStory();
    else if (activeTab === 'prestige') renderPrestige();
    else if (activeTab === 'gpshop') renderGpShop();
  }

  function renderShop() {
    const shop = $('#shop');
    if (!shop) return;
    shop.innerHTML = '';
    for (let i = 0; i < UPGRADE_ORDER.length; i++) {
      const id = UPGRADE_ORDER[i];
      const u = UPGRADES[id];
      const unlocked = isUpgradeUnlocked(id);
      const lvl = state.levels[id] || 0;
      const cost = upgradeCost(id);
      const canBuy = unlocked && state.ore >= cost;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'upgrade' + (canBuy ? '' : ' disabled') + (unlocked ? '' : ' locked');
      card.dataset.id = id;
      if (!unlocked) {
        card.innerHTML = '<span class="up-icon">🔒</span><span class="up-body"><span class="up-name">' + u.name + '</span><span class="up-desc">' + (u.unlock && u.unlock.text ? u.unlock.text : 'Закрыто') + '</span></span><span class="up-cost">—</span>';
      } else {
        card.innerHTML = '<span class="up-icon">' + u.icon + '</span><span class="up-body"><span class="up-name">' + u.name + ' <em>ур.' + lvl + '</em></span><span class="up-desc">' + u.desc + '</span></span><span class="up-cost">🦴 ' + fmt(cost) + '</span>';
        card.addEventListener('click', function () { buyUpgrade(id); });
      }
      shop.appendChild(card);
    }
  }

  function renderConsumables() {
    const root = $('#consumables');
    if (!root) return;
    root.innerHTML = '';
    Object.values(CONSUMABLES).forEach(function (c) {
      const qty = (state.inventory && state.inventory[c.id]) || 0;
      const card = document.createElement('div');
      card.className = 'item-card';
      const canBuy = state.ore >= c.cost;
      const active = state.activeItem && state.activeItem.id === c.id && Date.now() < state.activeItem.until;
      let actions = '<button type="button" class="btn btn-sm' + (canBuy ? '' : ' disabled') + '" data-buy-item="' + c.id + '">Купить · 🦴 ' + fmt(c.cost) + '</button>';
      if (qty > 0 && !active) {
        actions += '<button type="button" class="btn btn-sm" data-use-item="' + c.id + '">Использовать</button>';
      }
      if (active) {
        const sec = Math.ceil((state.activeItem.until - Date.now()) / 1000);
        actions = '<span class="breed-active">Активно · ' + sec + 'с</span>';
      }
      card.innerHTML = '<span class="item-icon">' + c.icon + '</span><div class="item-body"><div class="item-name">' + c.name + '</div><div class="item-desc">' + c.desc + '</div>' + actions + '</div><span class="item-qty">×' + qty + '</span>';
      root.appendChild(card);
    });
    root.querySelectorAll('[data-buy-item]').forEach(function (btn) {
      btn.addEventListener('click', function () { buyConsumable(btn.getAttribute('data-buy-item')); });
    });
    root.querySelectorAll('[data-use-item]').forEach(function (btn) {
      btn.addEventListener('click', function () { useConsumable(btn.getAttribute('data-use-item')); });
    });
  }

  function buyConsumable(id) {
    const c = CONSUMABLES[id];
    if (!c) return;
    if (state.ore < c.cost) { showToast('Маловато косточек 🐾'); return; }
    state.ore -= c.cost;
    if (!state.inventory) state.inventory = {};
    state.inventory[id] = (state.inventory[id] || 0) + 1;
    if (window.Sounds) window.Sounds.playBuy();
    showToast(c.name + ' в инвентаре! 🍀');
    renderConsumables(); renderStats(); scheduleSave();
  }

  function useConsumable(id) {
    const c = CONSUMABLES[id];
    if (!c) return;
    if (state.activeItem && Date.now() < state.activeItem.until) { showToast('Уже есть активный предмет 🐾'); return; }
    const qty = (state.inventory && state.inventory[id]) || 0;
    if (qty <= 0) { showToast('Нет в инвентаре'); return; }
    state.inventory[id] = qty - 1;
    state.activeItem = { id: id, until: Date.now() + c.durationMs };
    if (window.Sounds) window.Sounds.playBuy();
    showToast(c.name + ' активна! x' + c.mult + ' на 30с ✨');
    renderConsumables(); renderStats(); scheduleSave();
  }

  function applyBreedArt() {
    const img = $('#dogArt');
    const breed = getBreed();
    if (img && breed) img.src = breed.src;
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
      img.alt = fr.name;
      img.hidden = false;
    } else {
      img.hidden = true;
      img.alt = '';
    }
  }
  function updateSeasonUI() {
    const active = isSeasonActive();
    const acornStat = $('#acorn-stat');
    const top = $('#season-top-banner');
    const tab = $('#tab-season');
    if (acornStat) acornStat.hidden = !active;
    // Hide festival strip while event banner is up (same top slot)
    if (top) top.hidden = !active || !!state.eventReadyType;
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
        const can = state.ore >= b.unlockCost;
        actionHtml = '<button type="button" class="btn btn-sm' + (can ? '' : ' disabled') + '" data-unlock="' + b.id + '">Открыть · 🦴 ' + fmt(b.unlockCost) + '</button>';
      } else if (!selected) {
        actionHtml = '<button type="button" class="btn btn-sm" data-select="' + b.id + '">Выбрать</button>';
      } else {
        actionHtml = '<span class="breed-active">Активна 🐾</span>';
      }
      card.innerHTML = '<img class="breed-thumb" src="' + b.src + '" alt="' + b.name + '" /><div class="breed-body"><div class="breed-name">' + b.name + '</div><div class="breed-desc">' + b.desc + '</div>' + actionHtml + '</div>';
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
    if (state.ore < b.unlockCost) { showToast('Маловато косточек 🐾'); return; }
    state.ore -= b.unlockCost;
    state.unlockedBreeds.push(id);
    // first non-lab breed unlock contributes toward album (heart if story not yet)
    if (state.unlockedBreeds.filter(function (x) { return x !== 'lab'; }).length === 1) {
      grantSticker('heart', true);
    }
    if (window.Sounds) window.Sounds.playBuy();
    showToast(b.name + ' теперь в дворике! 🐕');
    checkAchievements(); maybeUnlockStory(); renderBreeds(); renderStats(); scheduleSave();
  }

  function selectBreed(id) {
    if (state.unlockedBreeds.indexOf(id) === -1) return;
    state.selectedBreed = id;
    applyBreedArt();
    showToast('Порода: ' + (BREEDS[id] && BREEDS[id].name) + ' 🐾');
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
        const can = state.ore >= f.unlockCost;
        actionHtml = '<button type="button" class="btn btn-sm' + (can ? '' : ' disabled') + '" data-unlock-friend="' + f.id + '">Открыть · 🦴 ' + fmt(f.unlockCost) + '</button>';
      } else if (!selected) {
        actionHtml = '<button type="button" class="btn btn-sm" data-select-friend="' + f.id + '">Активировать</button>';
      } else {
        actionHtml = '<button type="button" class="btn btn-sm btn-ghost" data-clear-friend="1">Снять</button> <span class="breed-active">Рядом 🐾</span>';
      }
      card.innerHTML = '<img class="breed-thumb" src="' + f.src + '" alt="' + f.name + '" /><div class="breed-body"><div class="breed-name">' + f.name + '</div><div class="breed-desc">' + f.desc + '</div>' + actionHtml + '</div>';
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
    if (state.ore < f.unlockCost) { showToast('Маловато косточек 🐾'); return; }
    state.ore -= f.unlockCost;
    if (!state.unlockedFriends) state.unlockedFriends = [];
    state.unlockedFriends.push(id);
    grantSticker(id === 'cat' ? 'cat' : id === 'rabbit' ? 'rabbit' : id === 'hamster' ? 'hamster' : null);
    if (!state.activeFriend) state.activeFriend = id;
    applyFriendArt();
    if (window.Sounds) window.Sounds.playBuy();
    showToast(f.name + ' теперь друг дворика! 🐾');
    checkAchievements(); maybeUnlockStory(); renderFriends(); renderStats(); scheduleSave();
  }

  function selectFriend(id) {
    if (id == null) {
      state.activeFriend = null;
      applyFriendArt();
      showToast('Друг отдыхает 🐾');
      renderFriends(); renderStats(); scheduleSave();
      return;
    }
    if ((state.unlockedFriends || []).indexOf(id) === -1) return;
    state.activeFriend = id;
    applyFriendArt();
    showToast('С вами: ' + (FRIENDS[id] && FRIENDS[id].name));
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
        if (complete && !claimed) btn = '<button type="button" class="btn btn-sm" data-claim-set="' + set.id + '">Забрать · 🦴 ' + fmt(set.reward) + '</button>';
        else if (claimed) btn = '<span class="breed-active">Награда получена ✓</span>';
        card.innerHTML = '<div class="album-set-title">' + set.name + '</div><div class="album-set-meta">' + owned + '/' + set.stickers.length + ' · награда 🦴 ' + fmt(set.reward) + '</div>' + btn;
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
      empty.textContent = 'Пока пусто — открывайте наклейки в достижениях, событиях, истории и у друзей.';
      grid.appendChild(empty);
    }
    STICKERS.forEach(function (st) {
      const owned = hasSticker(st.id);
      const cell = document.createElement('div');
      cell.className = 'sticker-cell' + (owned ? ' owned' : ' locked');
      cell.innerHTML = '<span class="sticker-ico">' + (owned ? st.icon : '❔') + '</span><span>' + (owned ? st.name : '???') + '</span>';
      cell.title = owned ? st.how : 'Ещё не открыто';
      grid.appendChild(cell);
    });
  }

  function claimStickerSet(id) {
    const set = STICKER_SETS.find(function (x) { return x.id === id; });
    if (!set) return;
    if (!state.stickerSetsClaimed || typeof state.stickerSetsClaimed !== 'object' || Array.isArray(state.stickerSetsClaimed)) state.stickerSetsClaimed = {};
    if (state.stickerSetsClaimed[id]) return;
    const ok = set.stickers.every(function (sid) { return hasSticker(sid); });
    if (!ok) { showToast('Набор ещё неполный 🐾'); return; }
    state.stickerSetsClaimed[id] = true;
    const reward = Math.max(0, Number(set.reward) || 0);
    state.ore += reward;
    state.stats.lifetimeBones += reward;
    if (window.Sounds) window.Sounds.playBuy();
    showToast('Набор «' + set.name + '»! +' + fmt(reward) + ' 🦴');
    renderAlbum(); renderStats(); maybeUnlockStory(); scheduleSave();
  }

  function renderSeason() {
    const root = $('#season-shop');
    const hint = $('#season-hint');
    if (hint) hint.textContent = isSeasonActive()
      ? ('Жёлудей: ' + fmt(isFinite(state.acorns) ? state.acorns : 0) + '. Клики и события дают жёлуди.')
      : 'Фестиваль сейчас не активен.';
    if (!root) return;
    root.innerHTML = '';
    if (!isSeasonActive()) {
      root.innerHTML = '<p class="panel-hint">Включите SEASON_FORCE или зайдите осенью.</p>';
      return;
    }
    SEASON_SHOP.forEach(function (item) {
      const bought = !!(state.seasonPurchases || {})[item.id];
      const card = document.createElement('div');
      card.className = 'season-card' + (bought && item.kind !== 'boost' ? ' owned' : '');
      let action = '';
      if (item.kind === 'boost') {
        const active = Date.now() < (state.seasonBoostUntil || 0);
        if (active) action = '<span class="breed-active">' + Math.ceil((state.seasonBoostUntil - Date.now()) / 1000) + 'с</span>';
        else {
          const can = (isFinite(state.acorns) ? state.acorns : 0) >= item.costAcorns;
          action = '<button type="button" class="btn btn-sm' + (can ? '' : ' disabled') + '" data-season="' + item.id + '">🌰 ' + item.costAcorns + '</button>';
        }
      } else if (bought || (item.kind === 'yard' && state.unlockedYards.indexOf('autumn') !== -1) || (item.kind === 'sticker' && hasSticker(item.stickerId))) {
        action = '<span class="breed-active">Есть ✓</span>';
      } else {
        const can = (isFinite(state.acorns) ? state.acorns : 0) >= item.costAcorns;
        action = '<button type="button" class="btn btn-sm' + (can ? '' : ' disabled') + '" data-season="' + item.id + '">🌰 ' + item.costAcorns + '</button>';
      }
      card.innerHTML = '<span class="item-icon">' + item.icon + '</span><div class="item-body"><div class="item-name">' + item.name + '</div><div class="item-desc">' + item.desc + '</div></div>' + action;
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
    if (acorns < item.costAcorns) { showToast('Маловато желудей 🍂'); return; }
    if (item.kind === 'yard') {
      if (state.unlockedYards.indexOf('autumn') !== -1) return;
      state.acorns = acorns - item.costAcorns;
      state.unlockedYards.push('autumn');
      if (!state.seasonPurchases) state.seasonPurchases = {};
      state.seasonPurchases[id] = true;
      grantSticker('leaf');
      showToast('Осенний двор открыт! 🍂');
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
      showToast('Осенний заряд x1.25 на 60с! ⚡');
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
    Object.values(YARDS).forEach(function (y) {
      const unlocked = state.unlockedYards.indexOf(y.id) !== -1;
      const selected = state.selectedYard === y.id;
      const card = document.createElement('div');
      card.className = 'yard-card' + (selected ? ' selected' : '') + (unlocked ? '' : ' locked');
      let actionHtml = '';
      if (!unlocked) {
        if (y.seasonOnly) {
          actionHtml = '<span class="breed-active">Только в сезоне 🍂</span>';
        } else {
          const can = state.ore >= y.unlockCost;
          actionHtml = '<button type="button" class="btn btn-sm' + (can ? '' : ' disabled') + '" data-unlock-yard="' + y.id + '">Открыть · 🦴 ' + fmt(y.unlockCost) + '</button>';
        }
      } else if (!selected) {
        actionHtml = '<button type="button" class="btn btn-sm" data-select-yard="' + y.id + '">Выбрать</button>';
      } else {
        actionHtml = '<span class="breed-active">Активен 🌅</span>';
      }
      card.innerHTML = '<img class="yard-thumb" src="' + y.src + '" alt="' + y.name + '" /><div class="yard-body"><div class="yard-name">' + y.name + '</div><div class="yard-desc">' + y.desc + '</div>' + actionHtml + '</div>';
      root.appendChild(card);
    });
    root.querySelectorAll('[data-unlock-yard]').forEach(function (btn) {
      btn.addEventListener('click', function () { unlockYard(btn.getAttribute('data-unlock-yard')); });
    });
    root.querySelectorAll('[data-select-yard]').forEach(function (btn) {
      btn.addEventListener('click', function () { selectYard(btn.getAttribute('data-select-yard')); });
    });
  }

  function unlockYard(id) {
    const y = YARDS[id];
    if (!y || state.unlockedYards.indexOf(id) !== -1) return;
    if (y.seasonOnly) { showToast('Откройте во вкладке «Сезон» 🍂'); return; }
    if (state.ore < y.unlockCost) { showToast('Маловато косточек 🐾'); return; }
    state.ore -= y.unlockCost;
    state.unlockedYards.push(id);
    if (window.Sounds) window.Sounds.playBuy();
    showToast('Двор «' + y.name + '» открыт! 🌄');
    checkAchievements(); maybeUnlockStory(); renderYards(); renderStats(); scheduleSave();
  }

  function selectYard(id) {
    if (state.unlockedYards.indexOf(id) === -1) return;
    state.selectedYard = id;
    applyYardArt();
    showToast('Двор: ' + (YARDS[id] && YARDS[id].name));
    renderYards(); scheduleSave();
  }

  function daySeed() {
    const d = new Date();
    return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate();
  }
  function seededRand(seed, i) {
    let h = 2166136261;
    const str = seed + ':' + i;
    for (let c = 0; c < str.length; c++) { h ^= str.charCodeAt(c); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967296;
  }
  function makeQuestReward(type, target) {
    if (type === 'clicks') return Math.floor(40 + target * 1.5);
    if (type === 'earn') return Math.floor(target * 0.25 + 50);
    if (type === 'buy') return 150 + Math.floor(state.stats.upgradesBought * 2);
    return 100;
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
      state.questDaySeed = seed;
      state.quests = generateQuests(seed);
      return;
    }
    // Drop orphan claimed rows (interrupted claim / bad save) so UI cannot stick on «Забрать»
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
    let changed = false;
    state.quests.forEach(function (q) {
      if (q.claimed || q.type !== type) return;
      q.progress = Math.min(q.target, (q.progress || 0) + amount);
      changed = true;
    });
    if (changed && activeTab === 'quests') renderQuests();
  }
  function claimQuest(id) {
    const q = state.quests.find(function (x) { return x.id === id; });
    if (!q || q.claimed || q.progress < q.target) return;
    q.claimed = true;
    const reward = Math.max(0, Number(q.reward) || 0);
    q.reward = 0;
    state.ore += reward;
    state.stats.lifetimeBones += reward;
    if (window.Sounds) window.Sounds.playBuy();
    showToast('Квест выполнен! +' + fmt(reward) + ' 🦴');
    const tpl = QUEST_POOL.find(function (t) { return t.type === q.type; }) || QUEST_POOL[0];
    const ti = Math.floor(Math.random() * tpl.targets.length);
    const target = tpl.targets[ti];
    const idx = state.quests.indexOf(q);
    state.quests[idx] = { id: daySeed() + '-r-' + Date.now() + '-' + tpl.type, type: tpl.type, target: target, progress: 0, reward: makeQuestReward(tpl.type, target), label: tpl.label(target), claimed: false };
    renderQuests(); renderStats(); checkAchievements(); maybeUnlockStory(); scheduleSave();
  }
  function renderQuests() {
    ensureQuests();
    const root = $('#quests');
    if (!root) return;
    root.innerHTML = '';
    state.quests.forEach(function (q) {
      const done = !q.claimed && q.progress >= q.target;
      const card = document.createElement('div');
      card.className = 'quest-card' + (done ? ' done' : '');
      const pct = q.target > 0 ? Math.min(100, Math.floor((q.progress / q.target) * 100)) : 0;
      card.innerHTML = '<div class="quest-title">' + q.label + '</div><div class="quest-bar"><span style="width:' + pct + '%"></span></div><div class="quest-meta">' + fmt(Math.min(q.progress, q.target)) + ' / ' + fmt(q.target) + ' · награда 🦴 ' + fmt(q.reward) + '</div>' + (done ? '<button type="button" class="btn btn-sm" data-claim="' + q.id + '">Забрать</button>' : '');
      root.appendChild(card);
    });
    root.querySelectorAll('[data-claim]').forEach(function (btn) {
      btn.addEventListener('click', function () { claimQuest(btn.getAttribute('data-claim')); });
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
    if (id === 'story_3') grantSticker('heart');
    if (id === 'prestige_1') grantSticker('medal');
    if (window.Sounds) window.Sounds.playBuy();
    showToast('Достижение! +' + fmt(a.reward) + ' 🦴');
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
      card.innerHTML = '<div class="ach-body"><div class="ach-name">' + a.name + '</div><div class="ach-desc">' + a.desc + '</div><div class="ach-reward">🦴 ' + fmt(a.reward) + '</div></div>' + (claimed ? '<span class="ach-status">✓</span>' : ready ? '<button type="button" class="btn btn-sm" data-ach="' + a.id + '">Забрать</button>' : '<span class="ach-status">…</span>');
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
      let badge = !unlocked ? '<span class="story-badge">🔒</span>' : (!read ? '<span class="story-badge">Новое</span>' : '<span class="story-badge">✓</span>');
      card.innerHTML = '<span class="item-icon">' + (idx + 1) + '</span><div class="story-body"><div class="story-name">' + ch.title + '</div><div class="story-desc">' + (unlocked ? (read ? 'Прочитано — можно снова' : 'Нажмите, чтобы прочитать') : 'Ещё закрыто') + '</div>' + (unlocked ? '<button type="button" class="btn btn-sm" data-story="' + ch.id + '">' + (read ? 'Перечитать' : 'Читать') + '</button>' : '') + '</div>' + badge;
      root.appendChild(card);
    });
    root.querySelectorAll('[data-story]').forEach(function (btn) {
      btn.addEventListener('click', function () { openStory(btn.getAttribute('data-story')); });
    });
  }

  function openStory(id) {
    const ch = STORY.find(function (x) { return x.id === id; });
    if (!ch || !isChapterUnlocked(ch)) return;
    storyPlaying = ch;
    storyLineIndex = 0;
    const modal = $('#story-modal');
    const title = $('#story-modal-title');
    if (title) title.textContent = ch.title;
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
      div.innerHTML = '<span class="who">' + (line.who === 'dog' ? 'Пёсик' : 'Рассказчик') + '</span>' + line.text;
      box.appendChild(div);
    }
    box.scrollTop = box.scrollHeight;
    if (nextBtn) nextBtn.textContent = storyLineIndex >= storyPlaying.lines.length - 1 ? 'Готово 🐾' : 'Далее';
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
      showToast('Глава прочитана 📖');
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
    if (type === 'toy') return '🧸 Пропала игрушка!';
    if (type === 'train') return '🎓 Дрессировка!';
    if (type === 'hide') return '🃏 Прятки!';
    if (type === 'race') return '🐿️ Гонка за белкой!';
    return 'Событие!';
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
    if (toyActive || trainActive || hideActive || raceActive) { btn.disabled = true; btn.textContent = 'Идёт событие…'; return; }
    if (state.eventReadyType) { btn.disabled = false; btn.textContent = 'Событие готово!'; return; }
    const left = Math.max(0, (state.nextEventAt || 0) - Date.now());
    if (left > 0) {
      btn.disabled = true;
      btn.textContent = 'Событие ~' + Math.ceil(left / 60000) + 'м';
    } else {
      btn.disabled = false;
      btn.textContent = 'Событие';
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
    showToast('Событие ещё не готово 🐾');
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
      const reward = Math.floor(taps * TOY_REWARD_PER_TAP * Math.max(1, base * 0.15));
      state.ore += reward;
      state.stats.lifetimeBones += reward;
      state.stats.eventsDone = (state.stats.eventsDone || 0) + 1;
      grantSticker('ball', true);
      addEventAcorns(0.8);
      if (window.Sounds) window.Sounds.playOffline();
      showToast('Игрушка найдена! +' + fmt(reward) + ' 🦴 (' + taps + ' тапов)');
      checkAchievements(); maybeUnlockStory();
      maybeOfferFullscreen('event');
    } else {
      showToast('Игрушка укатилась… 🐾');
    }
    scheduleNextEvent();
    renderStats(); updateEventBtn(); scheduleSave();
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
    { id: 'sit', label: 'Сидеть 🪑' },
    { id: 'paw', label: 'Лапу 🐾' },
    { id: 'spin', label: 'Крутись 🔄' },
    { id: 'speak', label: 'Голос 📣' },
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
  }
  function showTrainStep() {
    const stepEl = $('#train-step');
    const prompt = $('#train-prompt');
    const btns = $('#train-btns');
    const status = $('#train-status');
    if (stepEl) stepEl.textContent = 'Шаг ' + (trainIndex + 1) + '/5';
    if (status) status.textContent = 'Смотрите команду…';
    trainShowing = true;
    const cmd = TRAIN_CMDS.find(function (c) { return c.id === trainSeq[trainIndex]; });
    if (prompt) prompt.textContent = cmd ? cmd.label : '?';
    if (btns) btns.innerHTML = '';
    setTimeout(function () {
      if (!trainActive) return;
      if (prompt) prompt.textContent = 'Ваш ход!';
      if (status) status.textContent = 'Выберите правильную команду';
      trainShowing = false;
      if (!btns) return;
      btns.innerHTML = '';
      const shuffled = TRAIN_CMDS.slice().sort(function () { return Math.random() - 0.5; });
      shuffled.forEach(function (c) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn';
        b.textContent = c.label;
        b.addEventListener('click', function () { answerTrain(c.id); });
        btns.appendChild(b);
      });
    }, 900);
  }
  function answerTrain(id) {
    if (!trainActive || trainShowing) return;
    if (id !== trainSeq[trainIndex]) {
      if (window.Sounds) window.Sounds.playPet();
      showToast('Мимо! Попробуем ещё раз 🐾');
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
      const reward = Math.floor(80 + getOrePerSec() * 8 + getClickPower() * 12 + trainSeq.length * 25);
      state.ore += reward;
      state.stats.lifetimeBones += reward;
      state.stats.eventsDone = (state.stats.eventsDone || 0) + 1;
      grantSticker('star', true);
      addEventAcorns(1);
      if (window.Sounds) window.Sounds.playOffline();
      showToast('Дрессировка на ура! +' + fmt(reward) + ' 🦴');
      maybeOfferFullscreen('event');
    }
    scheduleNextEvent();
    checkAchievements(); maybeUnlockStory(); renderStats(); updateEventBtn(); scheduleSave();
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
    if (status) status.textContent = 'Выберите карточку';
    if (tries) tries.textContent = 'Попыток: ' + hideTriesLeft;
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
    if (tries) tries.textContent = 'Попыток: ' + hideTriesLeft;
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
      const reward = Math.floor(60 + getClickPower() * 10 + getOrePerSec() * 5);
      state.ore += reward;
      state.stats.lifetimeBones += reward;
      state.stats.eventsDone = (state.stats.eventsDone || 0) + 1;
      grantSticker('hide');
      const ac = addEventAcorns(1.1);
      if (window.Sounds) window.Sounds.playOffline();
      showToast('Нашли косточку! +' + fmt(reward) + ' 🦴' + (ac ? ' · 🌰+' + ac : ''));
      maybeOfferFullscreen('event');
    } else {
      showToast('Косточка спряталась… 🐾');
    }
    scheduleNextEvent();
    checkAchievements(); maybeUnlockStory(); renderStats(); updateEventBtn(); scheduleSave();
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
      const reward = Math.floor(50 + getClickPower() * 8 + getOrePerSec() * 6 + pct * 1.5);
      state.ore += reward;
      state.stats.lifetimeBones += reward;
      state.stats.eventsDone = (state.stats.eventsDone || 0) + 1;
      const ac = addEventAcorns(0.9 + pct / 100);
      if (window.Sounds) window.Sounds.playOffline();
      showToast('Догнали белку! +' + fmt(reward) + ' 🦴 (' + Math.floor(pct) + '%)' + (ac ? ' · 🌰+' + ac : ''));
      checkAchievements(); maybeUnlockStory();
      maybeOfferFullscreen('event');
    } else {
      showToast('Белка ускакала… ' + Math.floor(pct) + '% 🐾');
    }
    scheduleNextEvent();
    renderStats(); updateEventBtn(); scheduleSave();
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
        btn.textContent = 'Бонус без рекламы (NO_ADS)';
        btn.classList.add('no-ads');
      } else {
        btn.classList.remove('no-ads');
        if (!btn.disabled) btn.textContent = 'Видео: двойные косточки';
      }
    }
    if (state.noAds && window.GPBridge && window.GPBridge.hideSticky) {
      try { window.GPBridge.hideSticky(); } catch (_) {}
    }
  }

  function maybeOfferFullscreen(reason) {
    if (state.noAds) return;
    if (!window.GPBridge || typeof window.GPBridge.showFullscreen !== 'function') return;
    // ~35% chance after prestige / event win
    if (Math.random() > 0.35) return;
    setTimeout(function () {
      window.GPBridge.showFullscreen(false).catch(function () {});
    }, reason === 'prestige' ? 900 : 600);
  }

  function renderGpShop() {
    const root = $('#gp-shop');
    if (!root) return;
    const payHint = (window.GPBridge && window.GPBridge.isPaymentsAvailable && window.GPBridge.isPaymentsAvailable())
      ? 'Платежи GamePush доступны.'
      : 'Локальный режим: покупка через подтверждение.';
    const flags = [];
    if (state.noAds) flags.push('NO_ADS ✓');
    if (state.vipTreats) flags.push('VIP ✓');
    root.innerHTML = '<p class="panel-hint">' + payHint + (flags.length ? ' · ' + flags.join(' · ') : '') + '</p>';
    GP_PRODUCTS.forEach(function (p) {
      const card = document.createElement('div');
      card.className = 'upgrade gp-product';
      let owned = false;
      if (p.kind === 'permanent') {
        owned = p.flag === 'noAds' ? !!state.noAds : !!state.vipTreats;
      }
      let action;
      if (owned) action = '<span class="breed-active">Куплено ✓</span>';
      else action = '<button type="button" class="btn btn-sm" data-gp-buy="' + p.tag + '">Купить</button>';
      card.innerHTML = '<span class="up-icon">' + p.icon + '</span><span class="up-body"><span class="up-name">' + p.name + '</span><span class="up-desc">' + p.desc + '</span><span class="up-desc gp-tag">' + p.tag + '</span></span><span class="up-cost">' + action + '</span>';
      root.appendChild(card);
    });
    root.querySelectorAll('[data-gp-buy]').forEach(function (btn) {
      btn.addEventListener('click', function () { buyGpProduct(btn.getAttribute('data-gp-buy')); });
    });
  }

  async function buyGpProduct(tag) {
    const product = GP_PRODUCTS.find(function (p) { return p.tag === tag; });
    if (!product) return;
    if (product.kind === 'permanent') {
      if (product.flag === 'noAds' && state.noAds) { showToast('Уже куплено 🐾'); return; }
      if (product.flag === 'vipTreats' && state.vipTreats) { showToast('Уже куплено 🐾'); return; }
    }
    const bridge = window.GPBridge;
    if (!bridge || typeof bridge.purchase !== 'function') {
      showToast('Платежи недоступны');
      if (window.Sounds && window.Sounds.playError) window.Sounds.playError();
      return;
    }
    const res = await bridge.purchase(tag);
    if (!res || !res.ok) {
      showToast(res && res.error === 'cancelled' ? 'Покупка отменена' : 'Не удалось купить');
      if (window.Sounds && window.Sounds.playError) window.Sounds.playError();
      return;
    }
    if (product.kind === 'consumable') {
      const gain = Number(product.bones) || 0;
      state.ore += gain;
      state.stats.lifetimeBones += gain;
      bumpQuest('earn', gain);
      await persist();
      if (typeof bridge.consume === 'function') await bridge.consume(tag);
      if (window.Sounds && window.Sounds.playPurchase) window.Sounds.playPurchase();
      else if (window.Sounds) window.Sounds.playBuy();
      showToast('+' + fmt(gain) + ' косточек! 🦴');
    } else {
      if (product.flag === 'noAds') state.noAds = true;
      if (product.flag === 'vipTreats') state.vipTreats = true;
      applyNoAdsUi();
      await persist();
      if (window.Sounds && window.Sounds.playPurchase) window.Sounds.playPurchase();
      else if (window.Sounds) window.Sounds.playBuy();
      showToast(product.name + ' активировано! ✨');
    }
    checkAchievements();
    renderAll();
  }

  async function restoreGpPurchases() {
    const bridge = window.GPBridge;
    if (!bridge) return;
    let changed = false;
    try {
      if (typeof bridge.hasPurchase === 'function') {
        if (!state.noAds && (await bridge.hasPurchase('NO_ADS'))) { state.noAds = true; changed = true; }
        if (!state.vipTreats && (await bridge.hasPurchase('VIP_TREATS'))) { state.vipTreats = true; changed = true; }
      }
    } catch (_) {}
    applyNoAdsUi();
    if (changed) scheduleSave();
  }

  function canPrestige() { return state.stats.lifetimeBones >= PRESTIGE_REQ_LIFETIME; }

  function medalsGainOnPrestige() {
    const life = Math.max(PRESTIGE_REQ_LIFETIME, state.stats.lifetimeBones);
    return 1 + Math.max(0, Math.floor(Math.log10(life / PRESTIGE_REQ_LIFETIME)));
  }
  function renderPrestige() {
    const info = $('#prestige-info');
    const btn = $('#btn-prestige');
    if (info) {
      info.innerHTML = 'Медальки: <strong>' + state.medals + '</strong> · уровень выставок: <strong>' + state.prestigeLevel + '</strong><br>Бонус дохода: <strong>+' + Math.round(state.medals * PRESTIGE_MEDAL_INCOME * 100) + '%</strong><br>За жизнь заработано: <strong>' + fmt(state.stats.lifetimeBones) + '</strong> / нужно ' + fmt(PRESTIGE_REQ_LIFETIME) + '<br>Офлайн-кап: <strong>' + Math.round(getOfflineCapSec() / 3600) + ' ч</strong>';
    }
    if (btn) {
      btn.disabled = !canPrestige();
      btn.textContent = canPrestige() ? 'Устроить выставку (+' + medalsGainOnPrestige() + ' 🏅)' : 'Нужно ' + fmt(PRESTIGE_REQ_LIFETIME) + ' косточек за жизнь';
    }
  }
  function openPrestigeModal() {
    if (!canPrestige()) { showToast('Ещё рано для выставки 🐾'); return; }
    const modal = $('#prestige-modal');
    const text = $('#prestige-confirm-text');
    const gain = medalsGainOnPrestige();
    if (text) {
      text.textContent = 'Сбросить апгрейды и текущие косточки, получить +' + gain + ' медальки (+' + Math.round(gain * PRESTIGE_MEDAL_INCOME * 100) + '% к доходу навсегда)? Породы, двор, друзья, альбом, история и достижения сохранятся.';
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
    state.pendingClickMult = 1;
    state.adBoostUntil = 0;
    state.joyUntil = 0;
    state.joyReadyAt = 0;
    state.combo = 1;
    state.lastClickAt = 0;
    lastComboMilestone = 1;
    state.activeItem = null;
    state.seasonBoostUntil = 0;
    grantSticker('medal', true);
    if (window.Sounds && window.Sounds.playPrestige) window.Sounds.playPrestige();
    else if (window.Sounds) window.Sounds.playOffline();
    showToast('Выставка! +' + gain + ' 🏅 Медальки: ' + state.medals);
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
    if (opsEl) opsEl.textContent = fmt(getOrePerSec()) + '/с';
    if (clickEl) clickEl.textContent = fmt(getClickPower() * (state.pendingClickMult > 1 ? state.pendingClickMult : 1));
    if (medalsEl) medalsEl.textContent = String(state.medals);
    if (acornsEl) acornsEl.textContent = fmt(isFinite(state.acorns) ? state.acorns : 0);
    updateSeasonUI();
    if (boostEl) {
      const parts = [];
      if (state.pendingClickMult > 1) parts.push('x2 почесушка готова 🐾');
      if (Date.now() < state.adBoostUntil) parts.push('x2 idle ' + Math.ceil((state.adBoostUntil - Date.now()) / 1000) + 'с');
      if (Date.now() < state.joyUntil) parts.push('Радость x2 ' + Math.ceil((state.joyUntil - Date.now()) / 1000) + 'с');
      if (Date.now() < (state.seasonBoostUntil || 0)) parts.push('Осень x1.25 ' + Math.ceil((state.seasonBoostUntil - Date.now()) / 1000) + 'с');
      boostEl.hidden = parts.length === 0;
      if (parts.length) boostEl.textContent = parts.join(' · ');
    }
    if (itemEl) {
      if (state.activeItem && Date.now() < state.activeItem.until) {
        itemEl.hidden = false;
        itemEl.textContent = '🍀 x2 · ' + Math.ceil((state.activeItem.until - Date.now()) / 1000) + 'с';
      } else {
        itemEl.hidden = true;
        if (state.activeItem && Date.now() >= state.activeItem.until) state.activeItem = null;
      }
    }
    if (comboEl) {
      const c = Math.min(COMBO_MAX, state.combo);
      const show = c >= 1.15 && Date.now() - state.lastClickAt < getComboWindow() + 400;
      comboEl.hidden = !show;
      if (show) comboEl.textContent = 'Комбо x' + c.toFixed(1);
    }
    if (joyBtn) {
      const now = Date.now();
      if (now < state.joyUntil) { joyBtn.disabled = true; joyBtn.textContent = 'Радость… ' + Math.ceil((state.joyUntil - now) / 1000) + 'с'; }
      else if (now < state.joyReadyAt) { joyBtn.disabled = true; joyBtn.textContent = 'Радость через ' + Math.ceil((state.joyReadyAt - now) / 1000) + 'с'; }
      else { joyBtn.disabled = false; joyBtn.textContent = 'Радость x2 · 10с'; }
    }
  }

  function renderAll() {
    applyBreedArt();
    applyYardArt();
    applyFriendArt();
    updateSeasonUI();
    renderStats();
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
    updateCombo();
    const power = getClickPower() * state.pendingClickMult;
    state.ore += power;
    state.stats.totalClicks += 1;
    state.stats.lifetimeBones += power;
    if (isSeasonActive()) {
      const prev = isFinite(state.acorns) ? state.acorns : 0;
      state.acorns = prev + ACORN_PER_CLICK;
      if (state.stats.totalClicks % 25 === 0) maybeGrantLeafSticker();
    }
    bumpQuest('clicks', 1);
    bumpQuest('earn', power);
    if (state.pendingClickMult > 1) { state.pendingClickMult = 1; showToast('Двойная почесушка использована! 🦴'); }
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
    checkAchievements(); maybeUnlockStory(); renderStats();
  }

  function buyUpgrade(id) {
    if (!isUpgradeUnlocked(id)) {
      showToast((UPGRADES[id].unlock && UPGRADES[id].unlock.text) || 'Ещё закрыто');
      if (window.Sounds && window.Sounds.playError) window.Sounds.playError();
      return;
    }
    const cost = upgradeCost(id);
    if (state.ore < cost) {
      showToast('Маловато косточек 🐾');
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

  function activateJoy() {
    const now = Date.now();
    if (now < state.joyReadyAt || now < state.joyUntil) { showToast('Радость ещё отдыхает 🐾'); return; }
    state.joyUntil = now + JOY_DURATION_MS;
    state.joyReadyAt = state.joyUntil + JOY_COOLDOWN_MS;
    showToast('Радость! Почесушки x2 на 10 секунд 💖');
    if (window.Sounds) window.Sounds.playBuy();
    renderStats(); scheduleSave();
  }

  async function onRewarded() {
    const bridge = window.GPBridge;
    if (!bridge) return;
    let ok = false;
    if (state.noAds) {
      ok = true;
    } else {
      ok = await bridge.showRewarded();
    }
    if (!ok) {
      showToast('Видео не просмотрено');
      if (window.Sounds && window.Sounds.playError) window.Sounds.playError();
      return;
    }
    state.pendingClickMult = AD_BOOST_MULT;
    state.adBoostUntil = Date.now() + AD_BOOST_DURATION_MS;
    if (window.Sounds && window.Sounds.playReward) window.Sounds.playReward();
    else if (window.Sounds) window.Sounds.playBuy();
    showToast(state.noAds ? 'Бонус NO_ADS! x2 почесушка + idle 60с 🐕' : 'Ура! x2 почесушка + idle буст 60с 🐕');
    renderStats(); scheduleSave();
  }

  async function manualSave() { await persist(); showToast('Сохранено 💾'); }

  function serialize() {
    return {
      v: SAVE_VERSION,
      ore: state.ore,
      levels: Object.assign(defaultLevels(), state.levels),
      lastSaveAt: Date.now(),
      adBoostUntil: state.adBoostUntil,
      pendingClickMult: state.pendingClickMult,
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
      },
      achievementsClaimed: Object.assign({}, state.achievementsClaimed),
      quests: state.quests,
      questDaySeed: state.questDaySeed,
      joyUntil: state.joyUntil,
      joyReadyAt: state.joyReadyAt,
      inventory: Object.assign({ boneBoost: 0 }, state.inventory || {}),
      activeItem: state.activeItem,
      storyRead: Object.assign({}, state.storyRead || {}),
      nextEventAt: state.nextEventAt,
      eventReadyType: state.eventReadyType,
      stickers: (state.stickers || []).slice(),
      stickerSetsClaimed: Object.assign({}, state.stickerSetsClaimed || {}),
      unlockedFriends: (state.unlockedFriends || []).slice(),
      activeFriend: state.activeFriend,
      acorns: isFinite(state.acorns) ? Math.max(0, state.acorns) : 0,
      seasonBoostUntil: state.seasonBoostUntil || 0,
      seasonPurchases: Object.assign({}, state.seasonPurchases || {}),
      noAds: !!state.noAds,
      vipTreats: !!state.vipTreats,
    };
  }

  function migrateSave(data) {
    if (!data || typeof data !== 'object') return null;
    const out = Object.assign({}, data);
    const ver = Number(out.v) || 1;
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
      out.levels = Object.assign(defaultLevels(), out.levels || {});
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
      out.levels = Object.assign(defaultLevels(), out.levels || {});
    }
    if (ver < 4) {
      out.stickers = Array.isArray(out.stickers) ? out.stickers : [];
      out.stickerSetsClaimed = (out.stickerSetsClaimed && typeof out.stickerSetsClaimed === 'object' && !Array.isArray(out.stickerSetsClaimed)) ? out.stickerSetsClaimed : {};
      out.unlockedFriends = Array.isArray(out.unlockedFriends) ? out.unlockedFriends : [];
      out.activeFriend = out.activeFriend || null;
      {
        const ac = Number(out.acorns);
        out.acorns = isFinite(ac) && ac > 0 ? ac : 0;
      }
      out.seasonBoostUntil = Number(out.seasonBoostUntil) || 0;
      if (!isFinite(out.seasonBoostUntil)) out.seasonBoostUntil = 0;
      out.seasonPurchases = (out.seasonPurchases && typeof out.seasonPurchases === 'object' && !Array.isArray(out.seasonPurchases)) ? out.seasonPurchases : {};
      out.unlockedYards = Array.isArray(out.unlockedYards) ? out.unlockedYards : ['sunny'];
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
        label: typeof q.label === 'string' ? q.label : 'Квест',
        claimed: !!q.claimed,
      };
    }).filter(Boolean) : [];
    state.questDaySeed = data.questDaySeed || '';
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
    state.combo = 1;
    state.lastClickAt = 0;
    const last = Number(data.lastSaveAt) || Date.now();
    state.lastSaveAt = last;
    ensureQuests();
    // Prefer restoring a ready event over wiping it with a fresh cooldown
    if (state.eventReadyType) {
      showEventBanner(state.eventReadyType);
    } else if (!state.nextEventAt || state.nextEventAt < Date.now() - EVENT_MAX_MS) {
      scheduleNextEvent(EVENT_MIN_MS * 0.4);
    }
    const elapsedSec = Math.min(getOfflineCapSec(), Math.max(0, (Date.now() - last) / 1000));
    const boostBackup = state.adBoostUntil;
    const itemBackup = state.activeItem;
    state.adBoostUntil = 0;
    state.activeItem = null;
    const rate = getOrePerSec();
    state.adBoostUntil = boostBackup;
    state.activeItem = itemBackup;
    const gained = rate * elapsedSec;
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
    const payload = serialize();
    state.lastSaveAt = payload.lastSaveAt;
    if (window.GPBridge) await window.GPBridge.saveCloudSave(payload);
    else { try { localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); } catch (_) {} }
  }

  let saveQueued = false;
  function scheduleSave() {
    if (saveQueued) return;
    saveQueued = true;
    setTimeout(function () { saveQueued = false; persist(); }, 200);
  }

  function tick(now) {
    const dt = Math.min(0.25, (now - lastTick) / 1000);
    lastTick = now;
    if (!isFinite(state.ore) || state.ore < 0) state.ore = 0;
    if (!isFinite(state.stats.lifetimeBones) || state.stats.lifetimeBones < 0) state.stats.lifetimeBones = 0;
    if (!isFinite(state.acorns) || state.acorns < 0) state.acorns = 0;
    const gain = getOrePerSec() * dt;
    if (gain > 0 && isFinite(gain)) { state.ore += gain; state.stats.lifetimeBones += gain; bumpQuest('earn', gain); }
    decayCombo(dt);
    renderStats();
    checkEventTimer();
    requestAnimationFrame(tick);
  }

  let shopDirtyAt = 0;
  function tickShopThrottle(now) {
    if (activeTab === 'shop' && now - shopDirtyAt > 400) { shopDirtyAt = now; renderShop(); renderConsumables(); }
    else if (activeTab === 'prestige' && now - shopDirtyAt > 800) { shopDirtyAt = now; renderPrestige(); }
    else if (activeTab === 'season' && now - shopDirtyAt > 500) { shopDirtyAt = now; renderSeason(); }
    requestAnimationFrame(tickShopThrottle);
  }

  function showOfflineModal(gained) {
    const modal = $('#offline-modal');
    const text = $('#offline-text');
    const close = $('#offline-close');
    if (!modal || !text) {
      showToast('Пока вас не было: +' + fmt(gained) + ' косточек 🦴');
      if (window.Sounds) window.Sounds.playOffline();
      return;
    }
    const hours = Math.round(getOfflineCapSec() / 3600);
    text.textContent = 'Пока вас не было, хвостики набрали +' + fmt(gained) + ' косточек (макс. ' + hours + ' ч).';
    modal.hidden = false;
    const hide = function () { modal.hidden = true; if (window.Sounds) window.Sounds.playOffline(); };
    close && close.addEventListener('click', hide, { once: true });
    modal.addEventListener('click', function (e) { if (e.target === modal) hide(); }, { once: true });
  }

  async function init() {
    $('#mine-btn') && $('#mine-btn').addEventListener('click', mineClick);
    $('#btn-ad') && $('#btn-ad').addEventListener('click', onRewarded);
    $('#btn-save') && $('#btn-save').addEventListener('click', manualSave);
    $('#btn-joy') && $('#btn-joy').addEventListener('click', activateJoy);
    $('#btn-event') && $('#btn-event').addEventListener('click', onEventButton);
    $('#btn-prestige') && $('#btn-prestige').addEventListener('click', openPrestigeModal);
    $('#prestige-confirm') && $('#prestige-confirm').addEventListener('click', doPrestige);
    $('#prestige-cancel') && $('#prestige-cancel').addEventListener('click', function () { const m = $('#prestige-modal'); if (m) m.hidden = true; });
    $('#prestige-modal') && $('#prestige-modal').addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.hidden = true; });
    $('#event-banner-go') && $('#event-banner-go').addEventListener('click', function () { startEvent(state.eventReadyType); });
    $('#toy-tap') && $('#toy-tap').addEventListener('click', toyTap);
    $('#train-modal') && $('#train-modal').addEventListener('click', function (e) {
      if (e.target === e.currentTarget && trainActive) endTrainGame(false);
    });
    $('#toy-modal') && $('#toy-modal').addEventListener('click', function (e) {
      if (e.target === e.currentTarget && toyActive) endToyGame();
    });
    $('#story-next') && $('#story-next').addEventListener('click', advanceStory);
    $('#story-modal') && $('#story-modal').addEventListener('click', function (e) {
      if (e.target === e.currentTarget && storyPlaying) {
        storyPlaying = null;
        e.currentTarget.hidden = true;
      }
    });
    $('#race-tap') && $('#race-tap').addEventListener('click', raceTap);
    $('#race-modal') && $('#race-modal').addEventListener('click', function (e) {
      if (e.target === e.currentTarget && raceActive) endRaceGame(true);
    });
    $('#hide-modal') && $('#hide-modal').addEventListener('click', function (e) {
      if (e.target === e.currentTarget && hideActive) endHideGame(false);
    });
    $('#season-banner-go') && $('#season-banner-go').addEventListener('click', function () { setTab('season'); });

    document.querySelectorAll('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () { setTab(btn.dataset.tab); });
    });
    $('#mine-btn') && $('#mine-btn').addEventListener('contextmenu', function (e) { e.preventDefault(); });

    let gained = 0;
    function setGpStatus() {
      const status = $('#gp-status');
      if (!status) return;
      const connected = window.GPBridge && window.GPBridge.isGpConnected();
      status.textContent = connected ? 'GamePush' : 'Локально';
      status.classList.toggle('gp-on', !!connected);
      status.classList.toggle('gp-off', !connected);
      status.title = connected ? 'Облако GamePush' : 'Локальное сохранение';
    }

    function syncMuteBtn() {
      const btn = $('#btn-mute');
      if (!btn || !window.Sounds) return;
      const m = window.Sounds.isMuted && window.Sounds.isMuted();
      btn.textContent = m ? '🔇' : '🔊';
      btn.setAttribute('aria-label', m ? 'Включить звук' : 'Выключить звук');
      btn.title = m ? 'Звук выкл' : 'Звук вкл';
    }

    $('#btn-mute') && $('#btn-mute').addEventListener('click', function () {
      if (window.Sounds && window.Sounds.toggleMute) window.Sounds.toggleMute();
      syncMuteBtn();
    });
    syncMuteBtn();

    if (window.GPBridge) {
      await window.GPBridge.waitForGp(10000);
      const data = await window.GPBridge.loadCloudSave();
      if (data) gained = applySave(data);
      else { ensureQuests(); scheduleNextEvent(EVENT_MIN_MS * 0.35); }
    } else {
      const data = readLocalSave();
      if (data) gained = applySave(data);
      else { ensureQuests(); scheduleNextEvent(EVENT_MIN_MS * 0.35); }
    }

    applyBreedArt();
    applyYardArt();
    applyFriendArt();
    updateSeasonUI();
    renderAll();
    lastTick = performance.now();
    requestAnimationFrame(tick);
    requestAnimationFrame(tickShopThrottle);
    setInterval(function () { persist(); }, AUTOSAVE_MS);

    setGpStatus();
    applyNoAdsUi();
    restoreGpPurchases();
    window.addEventListener('gp-ready', function () {
      setGpStatus();
      restoreGpPurchases();
      showToast('GamePush подключён');
    });

    if (gained > 0.01) showOfflineModal(gained);
    else showToast('Добро пожаловать в дворик! 🐕');

    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') persist(); });
    window.addEventListener('beforeunload', function () {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(serialize())); } catch (_) {}
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
