/* Temporary restore: last good game.js from 7a22a168. Replace with in-repo file after revert. */
(function () {
  var urls = [
    'https://cdn.jsdelivr.net/gh/puma04121990-blip/sobachiy-dvorik@7a22a168fa82a2b906d0a73adcebedd3c1775e63/js/game.js',
    'https://cdn.jsdelivr.net/gh/puma04121990-blip/sobachiy-dvorik@08ab9d6c1430c9c21cab757b220832cadf041988/js/game.js'
  ];
  function load(i) {
    if (i >= urls.length) { console.error('[game] restore failed'); return; }
    var s = document.createElement('script');
    s.src = urls[i];
    s.onerror = function () { load(i + 1); };
    document.head.appendChild(s);
  }
  load(0);
})();
