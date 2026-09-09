/**
 * RU / EN localization. GamePush language + manual override.
 */
(function (root) {
  'use strict';
  var KEY = 'dvorik-lang';
  var lang = 'ru';
  var listeners = [];

  var UI = {
    ru: {
      title: 'Собачий дворик',
      boot: 'Будим хвостики…',
      help: 'Как играть',
      settings: 'Настройки',
      sound: 'Звук',
      sound_on: 'Выключить звук',
      sound_off: 'Включить звук',
      bones: 'Косточки',
      ops: 'Кост./сек',
      pets: 'Почесушки',
      acorns: 'Жёлуди',
      stats: 'Статистика',
      medals: 'Медальки выставки',
      boost: 'x2 буст',
      item: 'Предмет',
      pet_aria: 'Почесать пёсика',
      pet_btn: 'ПОЧЕСАТЬ',
      first_hint: 'Нажмите на пёсика — или пробел',
      energy: 'Энергия',
      energy_aria: 'Энергия пса',
      joy: 'Радость x2 · 10с',
      walk: 'Прогулка',
      rest: 'Отдых',
      event: 'Событие',
      ad_video: 'Видео: двойные косточки',
      ad_noads: 'Бонус без рекламы (NO_ADS)',
      save: 'Сохранить',
      walk_meta: '1–4 мин · энергия',
      sections: 'Разделы',
      tab_shop: 'Магазин',
      tab_cards: 'Стая',
      tab_training: 'Дрессировка',
      tab_breeds: 'Породы',
      tab_yard: 'Двор',
      tab_more: 'Ещё',
      more_title: 'Ещё разделы',
      tab_gpshop: 'Покупки',
      tab_friends: 'Друзья',
      tab_album: 'Альбом',
      tab_season: 'Сезон',
      tab_quests: 'Квесты',
      tab_achievements: 'Достижения',
      tab_ach_short: 'Достиж.',
      tab_story: 'История',
      tab_prestige: 'Выставка',
      close: 'Закрыть',
      shop_h: 'Магазин',
      shop_hint: 'Три полки с прокачками. Тап по карточке — купить уровень.',
      shop_cat_paws: 'Лапы',
      shop_cat_tails: 'Хвостики',
      shop_cat_cozy: 'Уют',
      shop_lbl_now: 'сейчас',
      shop_lbl_next: 'после',
      shop_lbl_delta: 'прирост',
      shop_lbl_share: 'доля',
      shop_lbl_pay: 'окуп.',
      shop_lbl_hour: 'в час',
      shop_lbl_cap: 'кап',
      shop_lbl_taps: 'тапов',
      shop_sum_tap: 'тап',
      shop_sum_idle: 'авто',
      shop_sum_hour: 'час',
      shop_sum_off: 'офлайн',
      shop_sum_combo: 'комбо',
      payback_taps: '~{n} тапов',
      cards_h: 'Стая дворика',
      cards_hint: 'Собирайте стаю. Без одних дел не откроются другие — иногда в соседнем меню. Макс. 20 ур.',
      cat_crew: 'Команда',
      cat_district: 'Район',
      cat_special: 'Особые',
      pack_kicker: 'Разовая покупка · автодоход сильнее магазина',
      pack_offer_h: 'Ветка «{name}»',
      pack_offer_max: '{count} карточек · на 20 ур. всех карт до {n} кост./сек',
      pack_buy: '💎 Купить ветку',
      pack_later: 'Позже',
      pack_buy_h: 'Открыть «{name}»',
      pack_buy_p: 'Первая карточка уже доступна. Покупка откроет остальные в «{name}».',
      pack_locked_cta: '🔒 Открыть',
      pack_preview: 'награда ветки',
      pack_card_max: 'макс. {n}/с',
      pack_chip_lock: '🔒 до {n}/с',
      pack_chip_open: 'до {n}/с',
      pack_need_branch: 'Сначала откройте ветку',
      combo_h: 'Комбо дня',
      combo_go: 'Прокачайте все три сегодня',
      combo_done: 'Комбо собрано ✓',
      combo_claim: 'Забрать комбо',
      plus_ops: '+{n}/с',
      plus_ops_lvl: '+{n}/с за уровень',
      stat_now: '{n} сейчас',
      plus_lvl: '+{n} за уровень',
      pct_now: '+{n}% сейчас',
      plus_pct_lvl: '+{n}% за уровень',
      plus_pets_lvl: '+{n} к почесушкам / ур',
      plus_pct_pets_lvl: '+{n}% к почесушкам / ур',
      plus_pct_idle_lvl: '+{n}% к автодоходу / ур',
      plus_combo_lvl: '+{n} мс комбо / ур',
      offline_eff_arrow: 'офлайн {a}% → {b}%',
      offline_cap_arrow: 'кап {a} → {b}',
      dur_hm: '{h} ч {m} мин',
      dur_h: '{n} ч',
      dur_m: '{n} мин',
      ms: 'мс',
      card_now: '{n}/с сейчас',
      payback_s: '~{n} с',
      payback_m: '~{n} мин',
      payback_h: '~{n} ч',
      maxed: 'МАКС',
      items_h: 'Предметы',
      items_hint: 'Расходники: один активный буст за раз.',
      training_h: 'Дрессировка',
      training_hint: 'Цепочка команд: купите предыдущую, чтобы открыть следующую.',
      breeds_h: 'Породы дворика',
      breeds_hint: 'Выберите пёсика — получите маленький бонус.',
      friends_h: 'Друзья дворика',
      friends_hint: 'Откройте друга за косточки. Один активный друг даёт бонус и сидит рядом.',
      yard_h: 'Двор',
      yard_hint: 'Этапы двора, фоны и бонусы. Открывайте этап кнопкой, когда готовы.',
      album_h: 'Альбом наклеек',
      album_hint: 'Собирайте наклейки из достижений, событий и друзей.',
      season_h: 'Осенний фестиваль',
      season_hint: 'Собирайте жёлуди кликами и мини-играми.',
      season_inline: 'Фестиваль активен! Жёлуди капают с почесушек.',
      quests_h: 'Квесты и цели',
      quests_hint: 'Ежедневные цели (Владивосток) и квесты. Серия сбрасывается, если день пропущен.',
      ach_h: 'Достижения',
      ach_hint: 'Заберите награду один раз.',
      story_h: 'История дворика',
      story_hint: 'Короткие главы открываются по прогрессу.',
      prestige_h: 'Выставка',
      prestige_hint: 'Сбросятся уровни апгрейдов, стаи и текущие косточки. Останутся дрессировка, породы, двор, друзья, альбом, этапы, медаль-апгрейды, достижения и медальки.',
      prestige_btn: 'Устроить выставку',
      gpshop_h: 'Магазин · Покупки',
      gpshop_hint: 'В локальном режиме покупка спрашивает подтверждение. На GamePush — настоящие платежи.',
      iap_cost: '💎',
      offline_title: 'Пока вас не было',
      offline_claim: 'Забрать косточки',
      prestige_q: 'Выставка?',
      prestige_no: 'Ещё погуляем',
      prestige_yes: 'На выставку!',
      event_bang: 'Событие!',
      play: 'Играть',
      toy_title: 'Пропала игрушка!',
      toy_hint: 'Тапайте быстро — 10 секунд!',
      toy_taps: 'Тапов:',
      toy_find: 'НАЙТИ!',
      toy_reward: 'Награда = число тапов × бонус',
      train_title: 'Дрессировка',
      train_hint: 'Запомните команду и повторите!',
      story_ch: 'Глава',
      next: 'Далее',
      hide_title: 'Прятки',
      hide_hint: 'Найди косточку среди карточек!',
      hide_tries: 'Попыток:',
      walk_sheet: 'Прогулка',
      walk_sheet_hint: 'Тратит энергию и косточки. Идёт в фоне по таймеру.',
      race_title: 'Гонка за белкой',
      race_hint: 'Тапайте в ритме 5 секунд — заполните полоску!',
      race_score: 'Ритм:',
      race_tap: 'ТАП!',
      race_keep: 'Держите темп — не слишком редко!',
      help_1: 'Почешите пёсика — падают косточки. Пробел тоже работает.',
      help_2: 'Энергия падает от кликов. «Отдых» или подождите.',
      help_3: 'Магазин, стая и дрессировка усиливают почесушки и автодоход — кости капают сами, даже без кликов.',
      help_4: 'Прогулка идёт в фоне. События — мини-игры с наградой.',
      help_5: 'Выставка сбрасывает апгрейды за медальки навсегда.',
      help_6: 'Стая — три платные ветки. До покупки видно, сколько кост./сек даст каждая карточка. Поздние карты кормят лучше ранних.',
      help_ok: 'Понятно',
      settings_hint: 'Сохранение лежит в этом браузере. Сделайте копию, если дорожите прогрессом.',
      export: 'Скачать сохранение',
      import: 'Загрузить сохранение',
      reset: 'Сбросить прогресс',
      language: 'Язык',
      locked: 'Закрыто',
      need: 'Нужно',
      lvl: 'ур.',
      lifetime: 'за жизнь',
      claim: 'Забрать',
      claimed: 'Получено ✓',
      buy: 'Купить',
      bought: 'Куплено ✓',
      use: 'Использовать',
      active: 'Активно',
      selected: 'Выбран',
      open: 'Открыть',
      choose: 'Выбрать',
      rest_full: 'Отдых',
      wait: 'Подождите…',
      local: 'Локально',
      cloud_ok: 'Cloud ок',
      cloud_err: 'Cloud ошибка',
      sticker_got: 'Наклейка: {icon} {name}!',
      gate_life: 'жизнь 🦴 {n}',
      gate_shows: 'выставок {n}',
      gate_stage: 'этап двора {n}',
      need_colon: 'Нужно: {parts}',
      buy_cost: 'Купить · 🦴 {n}',
      active_sec: 'Активно · {n}с',
      item_inv: '{name} в инвентаре! 🍀',
      item_on: '{name} активна! x{mult} на {n}с ✨',
      unlock_cost: 'Открыть · 🦴 {n}',
      breed_on: 'Активна 🐾',
      breed_in: '{name} теперь в дворике! 🐕',
      breed_set: 'Порода: {name} 🐾',
      activate: 'Активировать',
      unequip: 'Снять',
      nearby: 'Рядом 🐾',
      friend_now: '{name} теперь друг дворика! 🐾',
      friend_rest: 'Друг отдыхает 🐾',
      with_you: 'С вами: {name}',
      claim_cost: 'Забрать · 🦴 {n}',
      reward_got: 'Награда получена ✓',
      reward_bones: 'награда 🦴 {n}',
      album_empty: 'Пока пусто — открывайте наклейки в достижениях, событиях и у друзей.',
      not_open: 'Ещё не открыто',
      set_incomplete: 'Набор ещё неполный 🐾',
      set_done: 'Набор «{name}»! +{n} 🦴',
      season_acorns: 'Жёлудей: {n}. Клики и события дают жёлуди.',
      season_closed: 'Осенний фестиваль закрыт. Загляните с сентября по ноябрь — жёлуди, гонки и сезонный двор.',
      season_sleep: 'Фестиваль спит до осени. Собирайте косточки — и возвращайтесь в сентябре за желудями.',
      owned_ok: 'Есть ✓',
      autumn_yard: 'Осенний двор открыт! 🍂',
      autumn_charge: 'Осенний заряд x1.25 на 60с! ⚡',
      season_only: 'Только в сезоне 🍂',
      yard_on: 'Активен 🌅',
      open_in_season: 'Откройте во вкладке «Сезон» 🍂',
      yard_open: 'Двор «{name}» открыт! 🌄',
      yard_set: 'Двор: {name}',
      quest_streak: 'Серия квестов: {n} дн.! 🔥',
      quest_done: 'Квест выполнен! +{n} 🦴',
      ach_done: 'Достижение! +{n} 🦴',
      story_new: 'Новое',
      story_reread: 'Прочитано — можно снова',
      story_tap: 'Нажмите, чтобы прочитать',
      story_locked: 'Ещё закрыто',
      story_read_btn: 'Читать',
      story_reread_btn: 'Перечитать',
      who_dog: 'Пёсик',
      who_narr: 'Рассказчик',
      chapter_read: 'Глава прочитана 📖',
      event_running: 'Идёт событие…',
      event_ready: 'Событие готово!',
      event_cd: 'Событие ~{n}м',
      event_not_ready: 'Событие ещё не готово 🐾',
      toy_found: 'Игрушка найдена! +{n} 🦴 ({taps} тапов)',
      toy_miss: 'Игрушка укатилась… 🐾',
      cmd_sit: 'Сидеть 🪑',
      cmd_paw: 'Лапу 🐾',
      cmd_spin: 'Крутись 🔄',
      cmd_speak: 'Голос 📣',
      train_step: 'Шаг {n}/5',
      train_watch: 'Смотрите команду…',
      train_turn: 'Ваш ход!',
      train_pick: 'Выберите правильную команду',
      train_miss: 'Мимо! Попробуем ещё раз 🐾',
      train_win: 'Дрессировка на ура! +{n} 🦴',
      hide_pick: 'Выберите карточку',
      hide_tries_n: 'Попыток: {n}',
      hide_win: 'Нашли косточку! +{n} 🦴',
      hide_miss: 'Косточка спряталась… 🐾',
      race_win: 'Догнали белку! +{n} 🦴 ({pct}%)',
      race_miss: 'Белка ускакала… {pct}% 🐾',
      pay_ok: 'Платежи GamePush доступны.',
      pay_na: 'GamePush подключён, но платежи на этой платформе недоступны.',
      pay_local: 'Локальный режим: покупка через подтверждение.',
      buy_fail: 'Не удалось купить',
      buy_cancel: 'Покупка отменена',
      pay_now_na: 'Платежи сейчас недоступны',
      bones_plus: '+{n} косточек! 🦴',
      product_on: '{name} активировано! ✨',
      rest_after: 'Отдых после прогулки',
      claim_walk: 'Заберите прогулку',
      rest_cd: 'Отдых {n}с',
      rest_plus: 'Отдых +{n}',
      walk_busy: 'Пёсик ещё на прогулке 🐕‍🦺',
      claim_walk_first: 'Сначала заберите прогулку 🐾',
      rest_busy: 'Пёсик ещё отдыхает 🐾',
      energy_full: 'Энергия полная!',
      rest_toast: 'Отдых! Энергия +{n} 😴',
      already_walk: 'Уже на прогулке…',
      need_stage: 'Нужен этап двора {n}',
      need_stage_show: 'Нужен этап двора {n} и выставка',
      low_energy: 'Мало энергии ⚡',
      walk_start: '{icon} Прогулка «{name}» · {mins} мин',
      sticker_bang: 'наклейка!',
      walk_back: 'Вернулись с прогулки! +{n} 🦴',
      walking: 'На прогулке… {clock}',
      still_walk: 'Ещё гуляем…',
      walk_row: '{mins} мин · ⚡{energy} · 🦴 {cost}',
      walk_stage: 'этап {n}',
      stage_max: 'Макс. этап',
      stage_to: 'До этапа {n}: жизнь 🦴 {have} / {need}',
      stage_shows: 'выставок {have}/{need}',
      yard_stage_title: 'Этап двора {n} · {title}',
      income_bonus: 'бонус дохода x{n}',
      open_stage: 'Открыть этап {n}',
      too_soon: 'Ещё рано',
      already_max: 'Уже максимум!',
      need_more_bones: 'Нужно больше косточек за жизнь',
      need_more_shows: 'Нужно больше выставок',
      stage_unlock: 'Этап {n}: {title}! 🏡',
      daily_done: 'Цель дня! +{n} 🦴',
      daily_all: 'Все цели дня! Серия: {n} 🔥',
      daily_h: 'Цели дня',
      max_lvl: 'Макс. уровень',
      few_medals: 'Мало медалек 🏅',
      medal_lvl: '{name} ур.{n}!',
      prestige_info: 'Медальки: <strong>{medals}</strong> · выставок: <strong>{shows}</strong><br>Плоский бонус: <strong>+{flat}%</strong> + магазин медалек<br>За жизнь: <strong>{life}</strong> / нужно <strong>{need}</strong><br>Этап двора: <strong>{stage}</strong> · офлайн: <strong>{off}%</strong> · кап <strong>{cap} ч</strong>',
      hold_show_plus: 'Устроить выставку (+{n} 🏅)',
      need_life_bones: 'Нужно {n} косточек за жизнь',
      medal_shop_h: 'Магазин медалек',
      medal_shop_hint: 'Тратьте 🏅 на постоянные бонусы. Плоский +{pct}% за медальку остаётся.',
      prestige_soon: 'Ещё рано для выставки 🐾',
      prestige_confirm_text: 'Сбросить апгрейды и текущие косточки, получить +{gain} медальки (+{pct}% плоско + магазин 🏅)? Породы, двор, друзья, альбом, этапы, медаль-апгрейды и достижения сохранятся.',
      prestige_toast: 'Выставка! +{n} 🏅 Медальки: {total}',
      click_ready: 'x2 почесушка готова 🐾',
      idle_x2: 'x2 автодоход {n}с',
      joy_x2n: 'Радость x2 {n}с',
      autumn_xn: 'Осень x1.25 {n}с',
      item_x2: '🍀 x2 · {n}с',
      combo_x: 'Комбо x{n}',
      joy_on: 'Радость… {n}с',
      joy_cd: 'Радость через {n}с',
      double_used: 'Двойная почесушка использована! 🦴',
      joy_rest: 'Радость ещё отдыхает 🐾',
      joy_toast: 'Радость! Почесушки x2 на 10 секунд 💖',
      video_skip: 'Видео не просмотрено',
      noads_bonus: 'Бонус NO_ADS! x2 почесушка + автодоход 60с 🐕',
      ad_bonus: 'Ура! x2 почесушка + автодоход 60с 🐕',
      saved: 'Сохранено 💾',
      quest_fallback: 'Квест',
      goal_fallback: 'Цель',
      offline_toast: 'Пока вас не было: +{n} косточек 🦴',
      offline_body: 'Пока вас не было, хвостики набрали +{n} косточек (макс. {hours} ч, эффективность офлайна {pct}% — качайте Будку и Лежанку).',
      gp_title: 'SDK: {sdk} · сохранение: {cloud} · реклама: {ads} · платежи: {pay}{err}',
      save_detail: 'Сохранение: {cloud} · реклама: {ads} · покупки: {pay}',
      sound_off_title: 'Звук выкл',
      sound_on_title: 'Звук вкл',
      save_dl: 'Сохранение скачано',
      export_fail: 'Не удалось экспортировать',
      save_loaded: 'Сохранение загружено',
      file_bad: 'Файл не подошёл',
      reset_q: 'Сбросить весь прогресс? Это нельзя отменить.',
      pet_hint_toast: 'Почешите пёсика — косточки сами посыплются',
      back_yard: 'Снова в дворике',
      per_sec: '/с',
      ad_confirm: 'Локальный режим — без видео.\nПолучить двойные косточки (x2 почесушка + автодоход 60 с)?',
      buy_sim: 'Локальный режим — симулировать покупку «{tag}»?',
      n_sec: '{n}с'
    },
    en: {
      title: 'Dog Yard',
      boot: 'Waking the tails…',
      help: 'How to play',
      settings: 'Settings',
      sound: 'Sound',
      sound_on: 'Mute sound',
      sound_off: 'Unmute sound',
      bones: 'Bones',
      ops: 'Bones/sec',
      pets: 'Pets',
      acorns: 'Acorns',
      stats: 'Stats',
      medals: 'Show medals',
      boost: 'x2 boost',
      item: 'Item',
      pet_aria: 'Pet the dog',
      pet_btn: 'PET',
      first_hint: 'Tap the dog — or press Space',
      energy: 'Energy',
      energy_aria: 'Dog energy',
      joy: 'Joy x2 · 10s',
      walk: 'Walk',
      rest: 'Rest',
      event: 'Event',
      ad_video: 'Video: double bones',
      ad_noads: 'Bonus without ads (NO_ADS)',
      save: 'Save',
      walk_meta: '1–4 min · energy',
      sections: 'Sections',
      tab_shop: 'Shop',
      tab_cards: 'Pack',
      tab_training: 'Training',
      tab_breeds: 'Breeds',
      tab_yard: 'Yard',
      tab_more: 'More',
      more_title: 'More',
      tab_gpshop: 'Purchases',
      tab_friends: 'Friends',
      tab_album: 'Album',
      tab_season: 'Season',
      tab_quests: 'Quests',
      tab_achievements: 'Achievements',
      tab_ach_short: 'Achieve.',
      tab_story: 'Story',
      tab_prestige: 'Show',
      close: 'Close',
      shop_h: 'Shop',
      shop_hint: 'Three shelves of upgrades. Tap a card to buy a level.',
      shop_cat_paws: 'Paws',
      shop_cat_tails: 'Helpers',
      shop_cat_cozy: 'Cozy',
      shop_lbl_now: 'now',
      shop_lbl_next: 'after',
      shop_lbl_delta: 'gain',
      shop_lbl_share: 'share',
      shop_lbl_pay: 'payback',
      shop_lbl_hour: 'per hour',
      shop_lbl_cap: 'cap',
      shop_lbl_taps: 'taps',
      shop_sum_tap: 'tap',
      shop_sum_idle: 'idle',
      shop_sum_hour: 'hour',
      shop_sum_off: 'offline',
      shop_sum_combo: 'combo',
      payback_taps: '~{n} taps',
      cards_h: 'Yard pack',
      cards_hint: 'Build the pack. Some stays locked until you level others — sometimes in another menu. Max level 20.',
      cat_crew: 'Crew',
      cat_district: 'District',
      cat_special: 'Specials',
      pack_kicker: 'One-time purchase · stronger idle than the shop',
      pack_offer_h: 'Branch “{name}”',
      pack_offer_max: '{count} cards · all at lv.20 up to {n} bones/sec',
      pack_buy: '💎 Buy branch',
      pack_later: 'Later',
      pack_buy_h: 'Unlock “{name}”',
      pack_buy_p: 'The first card is already yours. This purchase opens the rest of “{name}”.',
      pack_locked_cta: '🔒 Unlock',
      pack_preview: 'branch reward',
      pack_card_max: 'max {n}/s',
      pack_chip_lock: '🔒 up to {n}/s',
      pack_chip_open: 'up to {n}/s',
      pack_need_branch: 'Unlock this branch first',
      combo_h: 'Daily combo',
      combo_go: 'Level all three today',
      combo_done: 'Combo complete ✓',
      combo_claim: 'Claim combo',
      plus_ops: '+{n}/s',
      plus_ops_lvl: '+{n}/s per level',
      stat_now: '{n} now',
      plus_lvl: '+{n} per level',
      pct_now: '+{n}% now',
      plus_pct_lvl: '+{n}% per level',
      plus_pets_lvl: '+{n} per pet / lv',
      plus_pct_pets_lvl: '+{n}% pets / lv',
      plus_pct_idle_lvl: '+{n}% idle / lv',
      plus_combo_lvl: '+{n} ms combo / lv',
      offline_eff_arrow: 'offline {a}% → {b}%',
      offline_cap_arrow: 'cap {a} → {b}',
      dur_hm: '{h}h {m}m',
      dur_h: '{n}h',
      dur_m: '{n} min',
      ms: 'ms',
      card_now: '{n}/s now',
      payback_s: '~{n}s',
      payback_m: '~{n} min',
      payback_h: '~{n} h',
      maxed: 'MAX',
      items_h: 'Items',
      items_hint: 'Consumables: one active boost at a time.',
      training_h: 'Training',
      training_hint: 'Command chain: buy the previous one to unlock the next.',
      breeds_h: 'Yard breeds',
      breeds_hint: 'Pick a pup for a small bonus.',
      friends_h: 'Yard friends',
      friends_hint: 'Unlock a friend with bones. One active friend gives a bonus and sits nearby.',
      yard_h: 'Yard',
      yard_hint: 'Yard stages, backgrounds and bonuses. Open a stage when you are ready.',
      album_h: 'Sticker album',
      album_hint: 'Collect stickers from achievements, events and friends.',
      season_h: 'Autumn festival',
      season_hint: 'Collect acorns from taps and mini-games.',
      season_inline: 'Festival is on! Acorns drop from pets.',
      quests_h: 'Quests and goals',
      quests_hint: 'Daily goals (Vladivostok time) and quests. The streak resets if you skip a day.',
      ach_h: 'Achievements',
      ach_hint: 'Claim each reward once.',
      story_h: 'Yard story',
      story_hint: 'Short chapters unlock as you progress.',
      prestige_h: 'Dog show',
      prestige_hint: 'Upgrade levels, the pack and current bones reset. Training, breeds, yard, friends, album, stages, medal upgrades, achievements and medals stay.',
      prestige_btn: 'Hold a show',
      gpshop_h: 'Shop · Purchases',
      gpshop_hint: 'In local mode a purchase asks for confirmation. On GamePush you get real payments.',
      iap_cost: '💎',
      offline_title: 'While you were away',
      offline_claim: 'Collect bones',
      prestige_q: 'Hold a show?',
      prestige_no: 'Keep playing',
      prestige_yes: 'To the show!',
      event_bang: 'Event!',
      play: 'Play',
      toy_title: 'Lost toy!',
      toy_hint: 'Tap fast — 10 seconds!',
      toy_taps: 'Taps:',
      toy_find: 'FIND IT!',
      toy_reward: 'Reward = taps × bonus',
      train_title: 'Training',
      train_hint: 'Remember the command and repeat it!',
      story_ch: 'Chapter',
      next: 'Next',
      hide_title: 'Hide and seek',
      hide_hint: 'Find the bone among the cards!',
      hide_tries: 'Tries:',
      walk_sheet: 'Walk',
      walk_sheet_hint: 'Spends energy and bones. Runs in the background.',
      race_title: 'Squirrel race',
      race_hint: 'Tap in rhythm for 5 seconds — fill the bar!',
      race_score: 'Rhythm:',
      race_tap: 'TAP!',
      race_keep: 'Keep the tempo — not too slow!',
      help_1: 'Pet the dog — bones drop. Space works too.',
      help_2: 'Energy drops with clicks. Rest or wait.',
      help_3: 'Shop, pack and training boost pets and idle income — bones drip on their own, even without tapping.',
      help_4: 'Walks run in the background. Events are mini-games with rewards.',
      help_5: 'A dog show resets upgrades for permanent medals.',
      help_6: 'The pack has three paid branches. Before buying you see how many bones/sec each card will give. Later cards feed you better.',
      help_ok: 'Got it',
      settings_hint: 'The save lives in this browser. Make a copy if you care about progress.',
      export: 'Download save',
      import: 'Load save',
      reset: 'Reset progress',
      language: 'Language',
      locked: 'Locked',
      need: 'Need',
      lvl: 'lv.',
      lifetime: 'lifetime',
      claim: 'Claim',
      claimed: 'Claimed ✓',
      buy: 'Buy',
      bought: 'Owned ✓',
      use: 'Use',
      active: 'Active',
      selected: 'Selected',
      open: 'Unlock',
      choose: 'Select',
      rest_full: 'Rest',
      wait: 'Please wait…',
      local: 'Local',
      cloud_ok: 'Cloud ok',
      cloud_err: 'Cloud error',
      sticker_got: 'Sticker: {icon} {name}!',
      gate_life: 'lifetime 🦴 {n}',
      gate_shows: 'shows {n}',
      gate_stage: 'yard stage {n}',
      need_colon: 'Need: {parts}',
      buy_cost: 'Buy · 🦴 {n}',
      active_sec: 'Active · {n}s',
      item_inv: '{name} in inventory! 🍀',
      item_on: '{name} is on! x{mult} for {n}s ✨',
      unlock_cost: 'Unlock · 🦴 {n}',
      breed_on: 'Active 🐾',
      breed_in: '{name} is in the yard! 🐕',
      breed_set: 'Breed: {name} 🐾',
      activate: 'Activate',
      unequip: 'Unequip',
      nearby: 'Nearby 🐾',
      friend_now: '{name} is now a yard friend! 🐾',
      friend_rest: 'Friend is resting 🐾',
      with_you: 'With you: {name}',
      claim_cost: 'Claim · 🦴 {n}',
      reward_got: 'Reward claimed ✓',
      reward_bones: 'reward 🦴 {n}',
      album_empty: 'Empty for now — unlock stickers in achievements, events and friends.',
      not_open: 'Not unlocked yet',
      set_incomplete: 'Set is not complete yet 🐾',
      set_done: 'Set “{name}”! +{n} 🦴',
      season_acorns: 'Acorns: {n}. Taps and events give acorns.',
      season_closed: 'Autumn festival is closed. Come back from September to November — acorns, races and a seasonal yard.',
      season_sleep: 'The festival sleeps until autumn. Collect bones — and come back in September for acorns.',
      owned_ok: 'Owned ✓',
      autumn_yard: 'Autumn yard unlocked! 🍂',
      autumn_charge: 'Autumn charge x1.25 for 60s! ⚡',
      season_only: 'Season only 🍂',
      yard_on: 'Active 🌅',
      open_in_season: 'Unlock it in the Season tab 🍂',
      yard_open: 'Yard “{name}” unlocked! 🌄',
      yard_set: 'Yard: {name}',
      quest_streak: 'Quest streak: {n} days! 🔥',
      quest_done: 'Quest complete! +{n} 🦴',
      ach_done: 'Achievement! +{n} 🦴',
      story_new: 'New',
      story_reread: 'Read — tap to read again',
      story_tap: 'Tap to read',
      story_locked: 'Still locked',
      story_read_btn: 'Read',
      story_reread_btn: 'Reread',
      who_dog: 'Pup',
      who_narr: 'Narrator',
      chapter_read: 'Chapter read 📖',
      event_running: 'Event in progress…',
      event_ready: 'Event ready!',
      event_cd: 'Event ~{n}m',
      event_not_ready: 'Event is not ready yet 🐾',
      toy_found: 'Toy found! +{n} 🦴 ({taps} taps)',
      toy_miss: 'The toy rolled away… 🐾',
      cmd_sit: 'Sit 🪑',
      cmd_paw: 'Paw 🐾',
      cmd_spin: 'Spin 🔄',
      cmd_speak: 'Speak 📣',
      train_step: 'Step {n}/5',
      train_watch: 'Watch the command…',
      train_turn: 'Your turn!',
      train_pick: 'Pick the right command',
      train_miss: 'Miss! Try again 🐾',
      train_win: 'Training nailed! +{n} 🦴',
      hide_pick: 'Pick a card',
      hide_tries_n: 'Tries: {n}',
      hide_win: 'Found the bone! +{n} 🦴',
      hide_miss: 'The bone hid away… 🐾',
      race_win: 'Caught the squirrel! +{n} 🦴 ({pct}%)',
      race_miss: 'The squirrel got away… {pct}% 🐾',
      pay_ok: 'GamePush payments are available.',
      pay_na: 'GamePush is connected, but payments are unavailable on this platform.',
      pay_local: 'Local mode: purchase via confirmation.',
      buy_fail: 'Purchase failed',
      buy_cancel: 'Purchase cancelled',
      pay_now_na: 'Payments are unavailable right now',
      bones_plus: '+{n} bones! 🦴',
      product_on: '{name} activated! ✨',
      rest_after: 'Rest after walk',
      claim_walk: 'Collect the walk',
      rest_cd: 'Rest {n}s',
      rest_plus: 'Rest +{n}',
      walk_busy: 'Pup is still on a walk 🐕‍🦺',
      claim_walk_first: 'Collect the walk first 🐾',
      rest_busy: 'Pup is still resting 🐾',
      energy_full: 'Energy is full!',
      rest_toast: 'Rest! Energy +{n} 😴',
      already_walk: 'Already walking…',
      need_stage: 'Need yard stage {n}',
      need_stage_show: 'Need yard stage {n} and a show',
      low_energy: 'Not enough energy ⚡',
      walk_start: '{icon} Walk “{name}” · {mins} min',
      sticker_bang: 'sticker!',
      walk_back: 'Back from the walk! +{n} 🦴',
      walking: 'Walking… {clock}',
      still_walk: 'Still walking…',
      walk_row: '{mins} min · ⚡{energy} · 🦴 {cost}',
      walk_stage: 'stage {n}',
      stage_max: 'Max stage',
      stage_to: 'To stage {n}: lifetime 🦴 {have} / {need}',
      stage_shows: 'shows {have}/{need}',
      yard_stage_title: 'Yard stage {n} · {title}',
      income_bonus: 'income bonus x{n}',
      open_stage: 'Unlock stage {n}',
      too_soon: 'Too soon',
      already_max: 'Already maxed!',
      need_more_bones: 'Need more lifetime bones',
      need_more_shows: 'Need more shows',
      stage_unlock: 'Stage {n}: {title}! 🏡',
      daily_done: 'Daily goal! +{n} 🦴',
      daily_all: 'All daily goals! Streak: {n} 🔥',
      daily_h: 'Daily goals',
      max_lvl: 'Max level',
      few_medals: 'Not enough medals 🏅',
      medal_lvl: '{name} lv.{n}!',
      prestige_info: 'Medals: <strong>{medals}</strong> · shows: <strong>{shows}</strong><br>Flat bonus: <strong>+{flat}%</strong> + medal shop<br>Lifetime: <strong>{life}</strong> / need <strong>{need}</strong><br>Yard stage: <strong>{stage}</strong> · offline: <strong>{off}%</strong> · cap <strong>{cap} h</strong>',
      hold_show_plus: 'Hold a show (+{n} 🏅)',
      need_life_bones: 'Need {n} lifetime bones',
      medal_shop_h: 'Medal shop',
      medal_shop_hint: 'Spend 🏅 on permanent bonuses. The flat +{pct}% per medal stays.',
      prestige_soon: 'Too soon for a show 🐾',
      prestige_confirm_text: 'Reset upgrades and current bones, get +{gain} medals (+{pct}% flat + medal shop 🏅)? Breeds, yard, friends, album, stages, medal upgrades and achievements stay.',
      prestige_toast: 'Show! +{n} 🏅 Medals: {total}',
      click_ready: 'x2 pet ready 🐾',
      idle_x2: 'x2 idle income {n}s',
      joy_x2n: 'Joy x2 {n}s',
      autumn_xn: 'Autumn x1.25 {n}s',
      item_x2: '🍀 x2 · {n}s',
      combo_x: 'Combo x{n}',
      joy_on: 'Joy… {n}s',
      joy_cd: 'Joy in {n}s',
      double_used: 'Double pet used! 🦴',
      joy_rest: 'Joy is still resting 🐾',
      joy_toast: 'Joy! Pets x2 for 10 seconds 💖',
      video_skip: 'Video was not watched',
      noads_bonus: 'NO_ADS bonus! x2 pet + idle income 60s 🐕',
      ad_bonus: 'Yay! x2 pet + idle income 60s 🐕',
      saved: 'Saved 💾',
      quest_fallback: 'Quest',
      goal_fallback: 'Goal',
      offline_toast: 'While you were away: +{n} bones 🦴',
      offline_body: 'While you were away, the tails gathered +{n} bones (max {hours} h, offline efficiency {pct}% — upgrade Kennel and Dog bed).',
      gp_title: 'SDK: {sdk} · save: {cloud} · ads: {ads} · payments: {pay}{err}',
      save_detail: 'Save: {cloud} · ads: {ads} · purchases: {pay}',
      sound_off_title: 'Sound off',
      sound_on_title: 'Sound on',
      save_dl: 'Save downloaded',
      export_fail: 'Export failed',
      save_loaded: 'Save loaded',
      file_bad: 'That file did not work',
      reset_q: 'Reset all progress? This cannot be undone.',
      pet_hint_toast: 'Pet the dog — bones will start dropping',
      back_yard: 'Back in the yard',
      per_sec: '/s',
      ad_confirm: 'Local mode — no video.\nGet double bones (x2 pet + idle income 60s)?',
      buy_sim: 'Local mode — simulate purchase “{tag}”?',
      n_sec: '{n}s'
    }
  };

  var CAT = {
    pickaxe: { name: 'Treat', desc: '+0.7 per pet per level' },
    miner: { name: 'Puppy helper', desc: '+0.30 bones/sec per level' },
    ball: { name: 'Ball', desc: '+2.5 per pet per level' },
    drill: { name: 'Trainer', desc: '+1.8 bones/sec per level' },
    walk: { name: 'Walks', desc: '+7 bones/sec per level' },
    warehouse: { name: 'Kennel', desc: '+7% idle income per level · offline' },
    groomer: { name: 'Groomer', desc: '+10% idle income per level' },
    kennel: { name: 'Cattery', desc: '+20 bones/sec per level' },
    collar: { name: 'Collar', desc: '+2% pets per level' },
    frisbee: { name: 'Frisbee', desc: '+1.2 bones/sec per level' },
    bed: { name: 'Dog bed', desc: '+30 min offline cap per level · offline %' },
    whistle: { name: 'Whistle', desc: '+40 ms combo window per level' },
    clickWhistle: { name: 'Click whistle', desc: '+3% pets per level' },
    treatBag: { name: 'Treat stash', desc: '+4.5 per pet per level' },
    volunteers: { name: 'Volunteers', desc: '+3.5 bones/sec per level' },
    autofeeder: { name: 'Auto-feeder', desc: '+8% idle income per level' },
    kennelPlus: { name: 'Cattery+', desc: '+45 bones/sec per level' },
    squeaky: { name: 'Squeaky toy', desc: '+1.4 per pet per level' },
    bandana: { name: 'Bandana', desc: '+2.5% pets per level' },
    leash: { name: 'Leash', desc: '+3.6 per pet per level' },
    rubber: { name: 'Rubber bone', desc: '+8 per pet per level' },
    bowls: { name: 'Bowls', desc: '+0.55 bones/sec per level' },
    kids: { name: 'Yard kids', desc: '+2.4 bones/sec per level' },
    mailman: { name: 'Mailman', desc: '+5.5 bones/sec per level' },
    night: { name: 'Night yard', desc: '+11 bones/sec per level' },
    park: { name: 'Playground', desc: '+30 bones/sec per level' },
    heater: { name: 'Heater', desc: '+4% idle income per level' },
    blanket: { name: 'Blanket', desc: '+5% idle income per level' },
    lamp: { name: 'Lantern', desc: '+6% idle income per level' },
    radio: { name: 'Radio', desc: '+9% idle income per level' },
    PACK_CREW: { name: 'Pack · Crew', desc: 'Unlocks the Crew branch: 6 idle cards' },
    PACK_DISTRICT: { name: 'Pack · District', desc: 'Unlocks the District branch: 6 idle cards' },
    PACK_SPECIAL: { name: 'Pack · Specials', desc: 'Unlocks the Specials branch: 6 idle cards' },
    sit: { name: 'Sit', desc: '+2.5% pets per level' },
    heel: { name: 'Heel', desc: '+7% energy regen per level' },
    paw: { name: 'Paw', desc: '+35 ms combo window per level' },
    voice: { name: 'Speak', desc: '+6% walk reward per level' },
    fetch: { name: 'Fetch', desc: '+4% idle income per level' },
    trick: { name: 'Trick', desc: '+3% offline · +12% show medals per level' },
    champ: { name: 'Champion', desc: '+1.5% all income per level' },
    lab: { name: 'Labrador', desc: 'Balanced start' },
    corgi: { name: 'Corgi', desc: '+5% pets' },
    husky: { name: 'Husky', desc: '+5% idle income' },
    dachshund: { name: 'Dachshund', desc: '+200 ms combo window' },
    shiba: { name: 'Shiba', desc: '+4% pets and +2% idle income' },
    poodle: { name: 'Poodle', desc: '+8% idle income' },
    beagle: { name: 'Beagle', desc: '+6% pets · +80 ms combo' },
    sunny: { name: 'Sunny', desc: 'A warm day in the yard' },
    evening: { name: 'Evening', desc: 'Soft sunset' },
    winter: { name: 'Winter', desc: 'Snowy yard' },
    autumn: { name: 'Autumn', desc: 'Golden festival leaves' },
    cat: { name: 'Kitty', desc: '+3% pets' },
    rabbit: { name: 'Bunny', desc: '+3% idle income' },
    hamster: { name: 'Hamster', desc: '+2% pets · +2% idle income' },
    boneBoost: { name: 'Lucky bone', desc: 'x2 bones for 30 sec' },
    BONES_PACK_S: { name: 'Bone handful', desc: '+2,500 bones' },
    BONES_PACK_M: { name: 'Bone sack', desc: '+25,000 bones' },
    NO_ADS: { name: 'No ads', desc: 'Rewards without video · hide sticky' },
    VIP_TREATS: { name: 'VIP treats', desc: '+15% all income forever' },
    m_click: { name: 'Champion paws', desc: '+6% pets per level' },
    m_idle: { name: 'Calm yard', desc: '+6% idle income per level' },
    m_energy: { name: 'Stamina', desc: '+8 max energy · +8% regen' },
    m_offline: { name: 'Yard watch', desc: '+8% offline efficiency' },
    short: { name: 'Short' },
    park: { name: 'Park' },
    long: { name: 'Long' },
    yard_autumn: { name: 'Autumn yard', desc: 'Autumn background forever' },
    sticker_acorn: { name: 'Acorn sticker', desc: 'Festival exclusive' },
    temp_boost: { name: 'Autumn charge', desc: 'x1.25 bones for 60s' },
    yard_life: { name: 'Yard life' },
    pals: { name: 'Pals' },
    festival: { name: 'Festival' },
    champions: { name: 'Champions' },
    neighbor: { name: 'Neighbor', desc: '+0.25 bones/sec per level' },
    walker: { name: 'Walker', desc: '+0.80 bones/sec per level' },
    sitter: { name: 'Sitter', desc: '+2.5 bones/sec per level' },
    groom_team: { name: 'Groomer crew', desc: '+8 bones/sec per level' },
    rescue: { name: 'Yard rescue', desc: '+26 bones/sec per level' },
    pack_leader: { name: 'Pack leader', desc: '+90 bones/sec per level' },
    kiosk: { name: 'Kiosk', desc: '+0.32 bones/sec per level' },
    skver: { name: 'Green square', desc: '+1.0 bones/sec per level' },
    vet: { name: 'Vet', desc: '+3.2 bones/sec per level' },
    cafe: { name: 'Paw cafe', desc: '+10 bones/sec per level' },
    stadium: { name: 'Yard field', desc: '+34 bones/sec per level' },
    mayor: { name: 'District mayor', desc: '+120 bones/sec per level' },
    poster: { name: 'Yard poster', desc: '+0.40 bones/sec per level' },
    mascot: { name: 'Mascot', desc: '+1.4 bones/sec per level' },
    cup: { name: 'Yard cup', desc: '+4.5 bones/sec per level' },
    legend: { name: 'District legend', desc: '+15 bones/sec per level' },
    dynasty: { name: 'Dynasty', desc: '+50 bones/sec per level' },
    throne: { name: 'Yard throne', desc: '+180 bones/sec per level' }
  };

  var STICKER_EN = {
    paw: { name: 'Paws', how: 'Achievement “First paws”' },
    bone: { name: 'Bone', how: 'Achievement “Bone in paw”' },
    heart: { name: 'Heart', how: 'Read 3 chapters' },
    ball: { name: 'Ball', how: 'Event “Lost toy”' },
    star: { name: 'Star', how: 'Event “Training”' },
    medal: { name: 'Medal', how: 'Hold a show' },
    cat: { name: 'Kitty', how: 'Unlock friend Kitty' },
    rabbit: { name: 'Bunny', how: 'Unlock friend Bunny' },
    hamster: { name: 'Hamster', how: 'Unlock friend Hamster' },
    leaf: { name: 'Leaf', how: 'Autumn festival' },
    acorn: { name: 'Acorn', how: 'Buy in the season shop' },
    hide: { name: 'Hide and seek', how: 'Win Hide and seek' }
  };

  var ACH_EN = {
    clicks_50: { name: 'First paws', desc: 'Pet 50 times' },
    clicks_500: { name: 'Favorite', desc: 'Pet 500 times' },
    clicks_5k: { name: 'Petting champ', desc: 'Pet 5,000 times' },
    clicks_25k: { name: 'Endless cuddles', desc: 'Pet 25,000 times' },
    bones_1k: { name: 'Bone in paw', desc: 'Earn 1,000 bones' },
    bones_100k: { name: 'Bone chest', desc: 'Earn 100,000 bones' },
    bones_1m: { name: 'Yard millionaire', desc: 'Earn 1,000,000 bones' },
    bones_100m: { name: 'Bone tycoon', desc: 'Earn 100,000,000 bones' },
    bones_1b: { name: 'Bone legend', desc: 'Earn 1,000,000,000 bones' },
    upgrades_10: { name: 'Caring owner', desc: 'Buy 10 upgrades' },
    upgrades_50: { name: 'Dream kennel', desc: 'Buy 50 upgrades' },
    upgrades_200: { name: 'Care empire', desc: 'Buy 200 upgrades' },
    prestige_1: { name: 'Show star', desc: 'Hold a show 1 time' },
    prestige_5: { name: 'Ring master', desc: 'Hold a show 5 times' },
    prestige_10: { name: 'All-time champ', desc: 'Hold a show 10 times' },
    breed_1: { name: 'New friend', desc: 'Unlock any breed' },
    breed_all: { name: 'Dog family', desc: 'Unlock all breeds' },
    yard_1: { name: 'New view', desc: 'Unlock a yard background' },
    event_3: { name: 'Toy hunter', desc: 'Finish 3 events' },
    event_25: { name: 'Yard hero', desc: 'Finish 25 events' },
    walks_10: { name: 'Walker', desc: 'Finish 10 walks' },
    walks_50: { name: 'Trail dog', desc: 'Finish 50 walks' },
    yard_stage_3: { name: 'Stage III', desc: 'Reach yard stage 3' },
    yard_stage_5: { name: 'Stage V', desc: 'Reach yard stage 5' },
    daily_streak_7: { name: 'Week of care', desc: '7-day daily-goal streak' },
    story_3: { name: 'Storyteller', desc: 'Read 3 chapters' }
  };

  var STAGE_EN = {
    1: { title: 'Empty yard', hook: 'First paws on the ground.' },
    2: { title: 'Cozy yard', hook: 'A favorite path appears.' },
    3: { title: 'Known yard', hook: 'Neighbors peek over the fence.' },
    4: { title: 'Champion yard', hook: 'Medals shine on the gate.' },
    5: { title: 'Neighborhood legend', hook: 'Guests come for pets.' },
    6: { title: 'Yard era', hook: 'The story is written together.' }
  };

  var STORY_EN = {
    ch1: { title: 'First meeting', lines: [
      { who: 'narrator', text: 'A tiny tail appeared in a quiet yard, eyes shining at you.' },
      { who: 'dog', text: 'Woof! Are you… my person? Scratch behind the ear?' },
      { who: 'narrator', text: 'Friendship began with one pet and one bone.' }
    ]},
    ch2: { title: 'Favorite bone', lines: [
      { who: 'narrator', text: 'Bones piled up faster than paws. The pup hid the best one under the bed.' },
      { who: 'dog', text: 'This one is special! We earned it together. We will not eat it… yet.' },
      { who: 'narrator', text: 'You smiled. The yard felt a little cozier.' }
    ]},
    ch3: { title: 'New friends', lines: [
      { who: 'narrator', text: 'A new nose arrived. Tails wagged hard enough to make wind.' },
      { who: 'dog', text: 'Look, a friend! Now there are two of us. Pets for everyone!' },
      { who: 'narrator', text: 'Joy really did double.' }
    ]},
    ch4: { title: 'Missing ball', lines: [
      { who: 'narrator', text: 'One morning the ball was gone. The yard went quiet… almost.' },
      { who: 'dog', text: 'Toyyyy! Help find it — I will be very brave!' },
      { who: 'narrator', text: 'You searched together. A reward waited for the fastest paws.' },
      { who: 'dog', text: 'Found it! You are the best. Woof-woof!' }
    ]},
    ch5: { title: 'Evening yard', lines: [
      { who: 'narrator', text: 'Sunset painted the fence peach. The pup lay down beside you.' },
      { who: 'dog', text: 'On evenings like this bones taste better… and you are even kinder.' },
      { who: 'narrator', text: 'The yard learned to be beautiful — not only useful.' }
    ]},
    ch6: { title: 'Winter walk', lines: [
      { who: 'narrator', text: 'Snow covered the paths. Pawprints led to you.' },
      { who: 'dog', text: 'Nose is cold, heart is warm. Shall we run?' },
      { who: 'narrator', text: 'You ran through snow while bones chimed like bells.' }
    ]},
    ch7: { title: 'Yard star', lines: [
      { who: 'narrator', text: 'Medals sparkled at the show. The pup looked only at you.' },
      { who: 'dog', text: 'Let them praise the breed. I praise my person.' },
      { who: 'narrator', text: 'The real prize is friendship. And the yard is only beginning.' },
      { who: 'dog', text: 'Woof! One more pet — for the story?' }
    ]},
    ch8: { title: 'Guests in the yard', lines: [
      { who: 'narrator', text: 'A meow at the gate. Then a rustle — and a bunny nose.' },
      { who: 'dog', text: 'Friends! We can share the bed… almost.' },
      { who: 'narrator', text: 'The yard got louder — and warmer.' }
    ]},
    ch9: { title: 'Sticker album', lines: [
      { who: 'narrator', text: 'A chubby album appeared on the table, smelling of glue and joy.' },
      { who: 'dog', text: 'Paws, ball, a star — here! I can lick the corner.' },
      { who: 'narrator', text: 'Each sticker is a tiny yard memory.' }
    ]},
    ch10: { title: 'Hide and seek', lines: [
      { who: 'narrator', text: 'The bone vanished under three bowls. The tail shook with excitement.' },
      { who: 'dog', text: 'Guess! I almost did not peek. Honest.' },
      { who: 'narrator', text: 'You guessed — or almost. The laugh mattered more.' }
    ]},
    ch11: { title: 'Autumn festival', lines: [
      { who: 'narrator', text: 'Leaves spun gold. An acorn garland hung on the fence.' },
      { who: 'dog', text: 'Festival! The squirrel calls for a race. Acorns jingle in the pocket!' },
      { who: 'narrator', text: 'Autumn arrived as a party, not as cold.' }
    ]},
    ch12: { title: 'Race with a squirrel', lines: [
      { who: 'narrator', text: 'The squirrel flicked its tail — and bolted.' },
      { who: 'dog', text: 'Tap-tap-tap! Do not fall behind, human!' },
      { who: 'narrator', text: 'You finished together. The squirrel nodded with respect.' }
    ]},
    ch13: { title: 'Yard family', lines: [
      { who: 'narrator', text: 'Evening. Dog, cat, bunny and hamster on the bed. Album open on the last page.' },
      { who: 'dog', text: 'Look: we are all here. And you are in the center.' },
      { who: 'narrator', text: 'The yard grew. The heart stayed the same — warm and ready for a pet.' },
      { who: 'dog', text: 'Woof. Another chapter? Or we just sit…' }
    ]}
  };

  function fmtTpl(s, vars) {
    if (!vars) return s;
    return String(s).replace(/\{(\w+)\}/g, function (_, k) {
      return vars[k] == null ? '' : String(vars[k]);
    });
  }

  function t(key, vars) {
    var pack = UI[lang] || UI.ru;
    var s = (pack && pack[key]) || (UI.ru && UI.ru[key]) || key;
    return fmtTpl(s, vars);
  }

  function catField(id, field, fallback) {
    if (lang !== 'en') return fallback;
    var row = CAT[id] || STICKER_EN[id] || ACH_EN[id];
    if (row && row[field]) return row[field];
    return fallback;
  }

  function itemName(item) {
    if (!item) return '';
    var id = item.id || item.tag;
    return catField(id, 'name', item.name || '');
  }
  function itemDesc(item) {
    if (!item) return '';
    var id = item.id || item.tag;
    return catField(id, 'desc', item.desc || '');
  }
  function stickerHow(st) {
    if (!st) return '';
    if (lang === 'en' && STICKER_EN[st.id] && STICKER_EN[st.id].how) return STICKER_EN[st.id].how;
    return st.how || '';
  }
  function stageTitle(st) {
    if (!st) return '';
    if (lang === 'en' && STAGE_EN[st.level]) return STAGE_EN[st.level].title;
    return st.title || '';
  }
  function stageHook(st) {
    if (!st) return '';
    if (lang === 'en' && STAGE_EN[st.level]) return STAGE_EN[st.level].hook;
    return st.hook || '';
  }
  function storyOf(ch) {
    if (!ch) return ch;
    if (lang !== 'en' || !STORY_EN[ch.id]) return ch;
    var en = STORY_EN[ch.id];
    return { id: ch.id, title: en.title, lines: en.lines, unlock: ch.unlock };
  }
  function fmtN(n) {
    if (root.GameContent && root.GameContent.fmtStatic) return root.GameContent.fmtStatic(n);
    return String(n);
  }
  function questLabel(type, n) {
    if (lang === 'en') {
      if (type === 'clicks') return 'Pet the dog ' + n + ' times';
      if (type === 'earn') return 'Earn ' + fmtN(n) + ' bones';
      if (type === 'buy') return 'Buy upgrades: ' + n;
    }
    if (type === 'clicks') return 'Почесать пёсика ' + n + ' раз';
    if (type === 'earn') return 'Заработать ' + fmtN(n) + ' косточек';
    if (type === 'buy') return 'Купить апгрейды: ' + n;
    return String(n);
  }
  function dailyLabel(type, n) {
    if (lang === 'en') {
      if (type === 'clicks') return 'Pet ' + n + ' times';
      if (type === 'earn') return 'Earn ' + fmtN(n) + ' 🦴';
      if (type === 'walks') return 'Finish walks: ' + n;
      if (type === 'events') return 'Events: ' + n;
      if (type === 'buy') return 'Buy upgrades: ' + n;
    }
    if (type === 'clicks') return 'Почесать ' + n + ' раз';
    if (type === 'earn') return 'Заработать ' + fmtN(n) + ' 🦴';
    if (type === 'walks') return 'Завершить прогулок: ' + n;
    if (type === 'events') return 'Событий: ' + n;
    if (type === 'buy') return 'Купить апгрейдов: ' + n;
    return String(n);
  }

  function applyDom(rootEl) {
    var scope = rootEl || document;
    var nodes = scope.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
    var aria = scope.querySelectorAll('[data-i18n-aria]');
    for (var j = 0; j < aria.length; j++) {
      var a = t(aria[j].getAttribute('data-i18n-aria'));
      aria[j].setAttribute('aria-label', a);
      if (aria[j].hasAttribute('title')) aria[j].setAttribute('title', a);
    }
    var titles = scope.querySelectorAll('[data-i18n-title]');
    for (var k = 0; k < titles.length; k++) {
      titles[k].setAttribute('title', t(titles[k].getAttribute('data-i18n-title')));
    }
    if (document.documentElement) document.documentElement.lang = lang;
    var titleEl = document.querySelector('title');
    if (titleEl) titleEl.textContent = lang === 'en' ? 'Dog Yard — clicker' : 'Собачий дворик — Dog Yard Clicker';
    var ruBtn = document.getElementById('lang-ru');
    var enBtn = document.getElementById('lang-en');
    if (ruBtn) ruBtn.classList.toggle('active', lang === 'ru');
    if (enBtn) enBtn.classList.toggle('active', lang === 'en');
  }

  function detect() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'en' || q === 'ru') return q;
    } catch (_) {}
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === 'en' || saved === 'ru') return saved;
    } catch (_) {}
    try {
      var gp = root.__gp;
      var gl = gp && (gp.language || (gp.lang && gp.lang()) || (gp.platform && gp.platform.language));
      if (gl) {
        gl = String(gl).toLowerCase();
        if (gl.indexOf('ru') === 0) return 'ru';
        return 'en';
      }
    } catch (_) {}
    try {
      var nav = (navigator.language || 'ru').toLowerCase();
      if (nav.indexOf('ru') === 0) return 'ru';
      return 'en';
    } catch (_) {}
    return 'ru';
  }

  function setLang(next, persist) {
    next = next === 'en' ? 'en' : 'ru';
    if (persist !== false) {
      try { localStorage.setItem(KEY, next); } catch (_) {}
    }
    lang = next;
    applyDom();
    try {
      var gp = root.__gp;
      if (gp && typeof gp.changeLanguage === 'function') gp.changeLanguage(next);
    } catch (_) {}
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](lang); } catch (_) {}
    }
  }

  function syncFromGp() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === 'en' || saved === 'ru') return;
    } catch (_) {}
    var gp = root.__gp;
    var gl = gp && (gp.language || (gp.platform && gp.platform.language));
    if (!gl) return;
    gl = String(gl).toLowerCase();
    var next = gl.indexOf('ru') === 0 ? 'ru' : 'en';
    if (next !== lang) setLang(next, false);
  }

  function onChange(fn) { listeners.push(fn); }

  lang = detect();

  root.I18n = {
    t: t,
    get lang() { return lang; },
    setLang: setLang,
    applyDom: applyDom,
    itemName: itemName,
    itemDesc: itemDesc,
    stickerHow: stickerHow,
    stageTitle: stageTitle,
    stageHook: stageHook,
    storyOf: storyOf,
    questLabel: questLabel,
    dailyLabel: dailyLabel,
    catField: catField,
    syncFromGp: syncFromGp,
    onChange: onChange,
    detect: detect
  };
})(typeof window !== 'undefined' ? window : globalThis);
