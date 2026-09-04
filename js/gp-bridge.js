/**
 * GamePush bridge — cloud save + rewarded ads with local fallback.
 * Paste real values from GamePush panel → Install Code.
 */
const PROJECT_ID = '30253';
const PUBLIC_TOKEN = 'JBeptGYdA0CM3JtUuacEIwxxyIED8FIU';

const LOCAL_KEY = 'dog-yard-clicker-v1';
const LEGACY_LOCAL_KEY = 'ore-mine-clicker-v1';
const GP_READY_TIMEOUT_MS = 10000;

let _gp = null;
let _readyPromise = null;

function isPlaceholder(v) {
  return !v || v === '30253' || v === 'JBeptGYdA0CM3JtUuacEIwxxyIED8FIU';
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

/**
 * Show rewarded video. Real GP when available; else confirm stub for local testing.
 * @returns {Promise<boolean>} true if reward should be granted
 */
async function showRewarded() {
  await waitForGp();
  const gp = getGp();

  if (gp && gp.ads && typeof gp.ads.showRewardedVideo === 'function') {
    try {
      const result = await gp.ads.showRewardedVideo();
      // SDK may return boolean or object with success/rewarded
      if (result === true) return true;
      if (result && (result.success || result.rewarded || result.isRewarded)) return true;
      return !!result;
    } catch (e) {
      console.warn('[gp-bridge] rewarded failed', e);
      return false;
    }
  }

  // Local / placeholder stub
  const ok = window.confirm(
    'Режим без GamePush.\nСимулировать просмотр видео и получить двойные косточки?'
  );
  return ok;
}

function isGpConnected() {
  return !!getGp();
}

function getProjectConfig() {
  return { PROJECT_ID, PUBLIC_TOKEN, isPlaceholder: isPlaceholder(PROJECT_ID) || isPlaceholder(PUBLIC_TOKEN) };
}

window.GPBridge = {
  PROJECT_ID,
  PUBLIC_TOKEN,
  LOCAL_KEY,
  waitForGp,
  loadCloudSave,
  saveCloudSave,
  showRewarded,
  isGpConnected,
  getProjectConfig,
};
