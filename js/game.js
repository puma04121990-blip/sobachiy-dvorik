(function () {
  try {
    var b64 = (window.__GPARTS || []).join('');
    if (!b64) { console.error('[game] missing packs'); return; }
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var src = new TextDecoder('utf-8').decode(bytes);
    (0, eval)(src);
  } catch (e) {
    console.error('[game pack]', e);
  }
})();
