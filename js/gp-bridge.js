/**
 * GamePush bridge — cloud save, ads, payments with local fallbacks.
 * In this web build the SDK is optional: we start in local mode immediately
 * so a missing/slow GamePush script cannot freeze the first 10 seconds or
 * overwrite clicks made before the save loaded.
 */
const PROJECT_ID = '30253';
const PUBLIC_TOKEN = 'JBeptGYdA0CM3JtUuacEIwxxyIED8FIU';

const LOCAL_KEY = 'dog-yard-clicker-v1';
const LEGACY_LOCAL_KEY = 'ore-mine-clicker-v1';
const BACKUP_KEY = 'dog-yard-clicker-v1-bak';
const GP_READY_TIMEOUT_MS = 400;
const FULLSCREEN_COOLDOWN_MS = 180 * 1000;

let _gp = null;
let _readyPromise = null;
let _lastFullscreenAt = 0;
let _saveChain = Promise.resolve();
const _status = {
  sdk: 'local',
  cloudSave: 'local',
  ads: 'local',
  payments: 'local',
  lastError: '',
};

function isPlaceholder(v) {
  if (!v) return true;
  const s = String(v);
  return (
    s === 'YOUR_PROJECT_ID' ||
    s === 'YOUR_PUBLIC_TOKEN' ||
    s.indexOf('REPLACE') !== -1 ||
    s.indexOf('xxx') === 0
  );
}

function getGp() {
  return _gp || (typeof window !== 'undefined' && window.__gp) || null;
}

function askConfirm(message) {
  if (typeof window !== 'undefined' && typeof window.__dvorikConfirm === 'function') {
    return Promise.resolve(window.__dvorikConfirm(message));
  }
  try {
    return Promise.resolve(window.confirm(message));
  } catch (_) {
    return Promise.resolve(false);
  }
}

/**
 * Wait for GamePush SDK or resolve local immediately.
 * Never block gameplay: if the SDK is not already present, local mode wins.
 */
function waitForGp(timeoutMs = GP_READY_TIMEOUT_MS) {
  if (_readyPromise) return _readyPromise;

  _readyPromise = new Promise((resolve) => {
    const existing = getGp();
    if (existing) {
      _gp = existing;
      _status.sdk = 'ready';
      resolve(_gp);
      return;
    }

    const hasSdkScript =
      typeof document !== 'undefined' &&
      !!document.querySelector('script[src*="gamepush"], script[src*="game-score.js"]');
    if (!hasSdkScript) {
      _status.sdk = 'local';
      _status.cloudSave = 'local';
      _status.ads = 'local';
      _status.payments = 'local';
      resolve(null);
      return;
    }

    let settled = false;
    const finish = (gp) => {
      if (settled) return;
      settled = true;
      _gp = gp || null;
      _status.sdk = _gp ? 'ready' : 'local';
      if (!_gp) {
        _status.cloudSave = 'local';
        _status.ads = 'local';
        _status.payments = 'local';
      }
      resolve(_gp);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('gp-ready', () => finish(window.__gp), { once: true });
    }
    // Tiny grace period in case the SDK is about to fire; never the old 10s stall.
    setTimeout(() => finish(getGp()), Math.min(timeoutMs, GP_READY_TIMEOUT_MS));
  });

  return _readyPromise;
}

function readLocalRaw() {
  try {
    let raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_LOCAL_KEY);
      if (raw) {
        try {
          localStorage.setItem(LOCAL_KEY, raw);
        } catch (_) {}
      }
    }
    if (!raw) {
      raw = localStorage.getItem(BACKUP_KEY);
    }
    return raw;
  } catch (_) {
    return null;
  }
}

function writeLocalRaw(json) {
  try {
    const prev = localStorage.getItem(LOCAL_KEY);
    if (prev && prev !== json) {
      try {
        localStorage.setItem(BACKUP_KEY, prev);
      } catch (_) {}
    }
    localStorage.setItem(LOCAL_KEY, json);
    return true;
  } catch (e) {
    console.warn('[gp-bridge] local save failed', e);
    _status.lastError = (e && e.message) || 'local_save_failed';
    return false;
  }
}

async function loadCloudSave() {
  await waitForGp();
  const gp = getGp();
  let cloud = null;

  if (gp && gp.player) {
    try {
      await gp.player.ready;
      const raw = gp.player.get('save');
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          cloud = parsed;
          _status.cloudSave = 'ready';
        }
      }
    } catch (e) {
      _status.cloudSave = 'error';
      _status.lastError = (e && e.message) || 'cloud_load_failed';
      console.warn('[gp-bridge] cloud load failed, using local', e);
    }
  }

  let local = null;
  try {
    const raw = readLocalRaw();
    if (raw) local = JSON.parse(raw);
  } catch (_) {}

  const cloudAt = cloud && Number(cloud.lastSaveAt) ? Number(cloud.lastSaveAt) : 0;
  const localAt = local && Number(local.lastSaveAt) ? Number(local.lastSaveAt) : 0;
  if (cloud && cloudAt > localAt + 1000) {
    try {
      writeLocalRaw(JSON.stringify(cloud));
    } catch (_) {}
    _status.cloudSave = 'ready';
    return cloud;
  }
  if (local) {
    if (!gp) _status.cloudSave = 'local';
    else if (!cloud) _status.cloudSave = 'local';
    return local;
  }
  if (cloud) return cloud;
  return null;
}

async function saveCloudSave(state) {
  if (!state || typeof state !== 'object') return;

  let json;
  try {
    json = JSON.stringify(state);
    if (!writeLocalRaw(json)) return;
  } catch (e) {
    console.warn('[gp-bridge] local save failed', e);
    return;
  }

  _saveChain = _saveChain.catch(function () {}).then(async function () {
    const gp = getGp();
    if (!gp || !gp.player) {
      _status.cloudSave = 'local';
      return;
    }
    try {
      await gp.player.ready;
      gp.player.set('save', json);
      await gp.player.sync();
      _status.cloudSave = 'ready';
    } catch (e) {
      _status.cloudSave = 'error';
      _status.lastError = (e && e.message) || 'cloud_save_failed';
      console.warn('[gp-bridge] cloud save failed', e);
    }
  });
  return _saveChain;
}

function isRewardedAvailable() {
  const gp = getGp();
  if (!gp || !gp.ads) {
    _status.ads = 'local';
    return true;
  }
  try {
    if (typeof gp.ads.isRewardedAvailable === 'boolean') {
      _status.ads = gp.ads.isRewardedAvailable ? 'ready' : 'unavailable';
      return gp.ads.isRewardedAvailable;
    }
    if (typeof gp.ads.isRewardedAvailable === 'function') {
      const ok = !!gp.ads.isRewardedAvailable();
      _status.ads = ok ? 'ready' : 'unavailable';
      return ok;
    }
  } catch (_) {}
  return true;
}

async function showRewarded() {
  await waitForGp();
  const gp = getGp();

  if (gp && gp.ads && typeof gp.ads.showRewardedVideo === 'function') {
    try {
      if (!isRewardedAvailable()) {
        console.warn('[gp-bridge] rewarded not available');
        return false;
      }
      const result = await gp.ads.showRewardedVideo();
      _status.ads = 'ready';
      if (result === true) return true;
      if (result && (result.success || result.rewarded || result.isRewarded)) return true;
      return !!result;
    } catch (e) {
      _status.ads = 'error';
      _status.lastError = (e && e.message) || 'rewarded_failed';
      console.warn('[gp-bridge] rewarded failed', e);
      return false;
    }
  }

  if (gp) return false;

  return askConfirm(
    (window.I18n && window.I18n.t)
      ? window.I18n.t('ad_confirm')
      : 'Локальный режим — без видео.\nПолучить двойные косточки (x2 почесушка + автодоход 60 с)?'
  );
}

async function showFullscreen(force) {
  await waitForGp();
  const now = Date.now();
  if (!force && now - _lastFullscreenAt < FULLSCREEN_COOLDOWN_MS) return false;

  const gp = getGp();
  if (gp && gp.ads && typeof gp.ads.showFullscreen === 'function') {
    try {
      _lastFullscreenAt = now;
      await gp.ads.showFullscreen();
      return true;
    } catch (e) {
      console.warn('[gp-bridge] fullscreen failed', e);
      return false;
    }
  }
  _lastFullscreenAt = now;
  return false;
}

function isPaymentsAvailable() {
  const gp = getGp();
  if (!gp || !gp.payments) {
    _status.payments = 'local';
    return false;
  }
  try {
    if (typeof gp.payments.isAvailable === 'boolean') {
      _status.payments = gp.payments.isAvailable ? 'ready' : 'unavailable';
      return gp.payments.isAvailable;
    }
    if (typeof gp.payments.isAvailable === 'function') {
      const ok = !!gp.payments.isAvailable();
      _status.payments = ok ? 'ready' : 'unavailable';
      return ok;
    }
    const ok = typeof gp.payments.purchase === 'function';
    _status.payments = ok ? 'ready' : 'unavailable';
    return ok;
  } catch (_) {
    return false;
  }
}

async function purchase(tag) {
  await waitForGp();
  if (!tag) return { ok: false, error: 'no_tag' };

  const gp = getGp();
  if (gp && gp.payments && typeof gp.payments.purchase === 'function' && isPaymentsAvailable()) {
    try {
      const result = await gp.payments.purchase({ tag });
      if (result === false) return { ok: false, error: 'cancelled' };
      return { ok: true, product: result || { tag } };
    } catch (e) {
      console.warn('[gp-bridge] purchase failed', e);
      return { ok: false, error: (e && e.message) || 'purchase_failed' };
    }
  }

  const ok = await askConfirm(
    (window.I18n && window.I18n.t)
      ? window.I18n.t('buy_sim', { tag: tag })
      : ('Локальный режим — симулировать покупку «' + tag + '»?')
  );
  return ok ? { ok: true, product: { tag, stub: true } } : { ok: false, error: 'cancelled' };
}

async function hasPurchase(tag) {
  await waitForGp();
  const gp = getGp();
  if (gp && gp.payments) {
    try {
      if (typeof gp.payments.has === 'function') return !!(await gp.payments.has({ tag }));
      if (typeof gp.payments.has === 'boolean') return false;
    } catch (e) {
      console.warn('[gp-bridge] hasPurchase failed', e);
    }
  }
  return false;
}

async function consume(tag) {
  await waitForGp();
  const gp = getGp();
  if (gp && gp.payments && typeof gp.payments.consume === 'function') {
    try {
      await gp.payments.consume({ tag });
      return true;
    } catch (e) {
      console.warn('[gp-bridge] consume failed', e);
      return false;
    }
  }
  return true;
}

async function fetchProducts() {
  await waitForGp();
  const gp = getGp();
  if (gp && gp.payments && typeof gp.payments.fetchProducts === 'function') {
    try {
      const list = await gp.payments.fetchProducts();
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.warn('[gp-bridge] fetchProducts failed', e);
    }
  }
  return [];
}

function hideSticky() {
  const gp = getGp();
  if (!gp || !gp.ads) return;
  try {
    if (typeof gp.ads.closeSticky === 'function') gp.ads.closeSticky();
    else if (typeof gp.ads.hideSticky === 'function') gp.ads.hideSticky();
  } catch (_) {}
}

function isGpConnected() {
  return !!getGp();
}

function getStatus() {
  return Object.assign({}, _status, { connected: isGpConnected() });
}

function getProjectConfig() {
  return {
    PROJECT_ID,
    PUBLIC_TOKEN,
    isPlaceholder: isPlaceholder(PROJECT_ID) || isPlaceholder(PUBLIC_TOKEN),
  };
}

function exportSaveRaw() {
  try {
    return localStorage.getItem(LOCAL_KEY) || '';
  } catch (_) {
    return '';
  }
}

function importSaveRaw(raw) {
  if (!raw || typeof raw !== 'string') return false;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
    return writeLocalRaw(JSON.stringify(parsed));
  } catch (_) {
    return false;
  }
}

function clearSaves() {
  try {
    localStorage.removeItem(LOCAL_KEY);
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem(LEGACY_LOCAL_KEY);
  } catch (_) {}
}

const GPBridge = {
  PROJECT_ID,
  PUBLIC_TOKEN,
  LOCAL_KEY,
  BACKUP_KEY,
  waitForGp,
  loadCloudSave,
  saveCloudSave,
  showRewarded,
  showFullscreen,
  isRewardedAvailable,
  isPaymentsAvailable,
  purchase,
  hasPurchase,
  consume,
  fetchProducts,
  hideSticky,
  isGpConnected,
  getStatus,
  getProjectConfig,
  exportSaveRaw,
  importSaveRaw,
  clearSaves,
};

if (typeof window !== 'undefined') window.GPBridge = GPBridge;

