/**
 * GamePush bridge — cloud save, ads, payments with local fallbacks.
 * projectId 30253 wired; player field `save`.
 */
const PROJECT_ID = '30253';
const PUBLIC_TOKEN = 'JBeptGYdA0CM3JtUuacEIwxxyIED8FIU';

const LOCAL_KEY = 'dog-yard-clicker-v1';
const LEGACY_LOCAL_KEY = 'ore-mine-clicker-v1';
const GP_READY_TIMEOUT_MS = 10000;
const FULLSCREEN_COOLDOWN_MS = 90 * 1000;

let _gp = null;
let _readyPromise = null;
let _lastFullscreenAt = 0;

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
  return _gp || window.__gp || null;
}

/**
 * Wait for GamePush SDK (gp-ready event) or timeout → local mode.
 */
function waitForGp(timeoutMs = GP_READY_TIMEOUT_MS) {
  if (_readyPromise) return _readyPromise;

  _readyPromise = new Promise((resolve) => {
    if (window.__gp) {
      _gp = window.__gp;
      resolve(_gp);
      return;
    }

    let settled = false;
    const finish = (gp) => {
      if (settled) return;
      settled = true;
      _gp = gp || null;
      resolve(_gp);
    };

    window.addEventListener('gp-ready', () => finish(window.__gp), { once: true });
    setTimeout(() => finish(getGp() || window.__gp || null), timeoutMs);
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
    return raw;
  } catch (_) {
    return null;
  }
}

/**
 * Load save: cloud (gp.player.get('save')) then localStorage merge fallback.
 */
async function loadCloudSave() {
  await waitForGp();
  const gp = getGp();

  if (gp && gp.player) {
    try {
      await gp.player.ready;
      const raw = gp.player.get('save');
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === 'object') {
          try {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(parsed));
          } catch (_) {}
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[gp-bridge] cloud load failed, using local', e);
    }
  }

  try {
    const local = readLocalRaw();
    if (local) return JSON.parse(local);
  } catch (_) {}
  return null;
}

/**
 * Save: localStorage always; cloud when gp available.
 */
async function saveCloudSave(state) {
  if (!state || typeof state !== 'object') return;

  let json;
  try {
    json = JSON.stringify(state);
    localStorage.setItem(LOCAL_KEY, json);
  } catch (e) {
    console.warn('[gp-bridge] local save failed', e);
    return;
  }

  const gp = getGp();
  if (gp && gp.player) {
    try {
      await gp.player.ready;
      gp.player.set('save', json);
      await gp.player.sync();
    } catch (e) {
      console.warn('[gp-bridge] cloud save failed', e);
    }
  }
}

function isRewardedAvailable() {
  const gp = getGp();
  if (!gp || !gp.ads) return true; // local stub always "available"
  try {
    if (typeof gp.ads.isRewardedAvailable === 'boolean') return gp.ads.isRewardedAvailable;
    if (typeof gp.ads.isRewardedAvailable === 'function') return !!gp.ads.isRewardedAvailable();
  } catch (_) {}
  return true;
}

/**
 * Show rewarded video. Real GP when available; else confirm stub for local testing.
 * @returns {Promise<boolean>} true if reward should be granted
 */
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
      if (result === true) return true;
      if (result && (result.success || result.rewarded || result.isRewarded)) return true;
      return !!result;
    } catch (e) {
      console.warn('[gp-bridge] rewarded failed', e);
      return false;
    }
  }

  const ok = window.confirm(
    'Режим без GamePush.\nСимулировать просмотр видео и получить двойные косточки?'
  );
  return ok;
}

/**
 * Optional fullscreen interstitial (prestige / event breaks). Rate-limited.
 * @returns {Promise<boolean>}
 */
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
  // Local: silent no-op (avoid nagging confirms on every prestige)
  _lastFullscreenAt = now;
  return false;
}

function isPaymentsAvailable() {
  const gp = getGp();
  if (!gp || !gp.payments) return false;
  try {
    if (typeof gp.payments.isAvailable === 'boolean') return gp.payments.isAvailable;
    if (typeof gp.payments.isAvailable === 'function') return !!gp.payments.isAvailable();
    return typeof gp.payments.purchase === 'function';
  } catch (_) {
    return false;
  }
}

/**
 * Purchase product by tag. Local stub: confirm → success.
 * @returns {Promise<{ok:boolean, product?:object, error?:string}>}
 */
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

  const ok = window.confirm(
    'Режим без платежей GamePush.\nСимулировать покупку «' + tag + '»?'
  );
  return ok ? { ok: true, product: { tag, stub: true } } : { ok: false, error: 'cancelled' };
}

/**
 * Check ownership (permanent products). Also checks local stub map if provided via window.
 */
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

/**
 * Consume a consumable purchase after grant.
 */
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
  return true; // local stub: always ok
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

/** Best-effort hide sticky banner (NO_ADS). */
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

function getProjectConfig() {
  return {
    PROJECT_ID,
    PUBLIC_TOKEN,
    isPlaceholder: isPlaceholder(PROJECT_ID) || isPlaceholder(PUBLIC_TOKEN),
  };
}

window.GPBridge = {
  PROJECT_ID,
  PUBLIC_TOKEN,
  LOCAL_KEY,
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
  getProjectConfig,
};
