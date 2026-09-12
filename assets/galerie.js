/* LOCWEB — les filtres de la galerie. Sans ce script, tous les
   exemples restent affiches : le filtre est un confort, pas un
   passage oblige. Charge seulement quand la galerie a des exemples. */
(function () {
  'use strict';
  var boutons = document.querySelectorAll('.filtre');
  if (!boutons.length) return;
  var cartes = document.querySelectorAll('.exemple');
  Array.prototype.forEach.call(boutons, function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filtre');
      Array.prototype.forEach.call(boutons, function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      Array.prototype.forEach.call(cartes, function (c) {
        c.hidden = f !== 'tous' && c.getAttribute('data-type') !== f;
      });
    });
  });
})();
