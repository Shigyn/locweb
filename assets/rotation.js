/* =====================================================================
   LOCWEB — la fin du titre qui change.

   « Des sites qui font sonner le telephone » devient, a tour de role,
   « ... vous ramenent des clients », « ... vous donnent du serieux »...
   Le HTML porte la premiere phrase : sans ce script, ou si le visiteur
   a demande a reduire les animations, c'est elle qui reste.
   ===================================================================== */
(function () {
  'use strict';
  var hote = document.querySelector('.rotation');
  if (!hote || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var phrases = (hote.getAttribute('data-phrases') || '').split('|').filter(Boolean);
  if (phrases.length < 2) return;
  var mot = hote.firstElementChild;
  var i = 0;

  function suivant() {
    mot.classList.add('sort');
    setTimeout(function () {
      i = (i + 1) % phrases.length;
      mot.textContent = phrases[i];
      mot.classList.remove('sort');
      mot.classList.add('entre');
      /* Forcer un rendu entre les deux etats, sinon la transition saute. */
      void mot.offsetWidth;
      mot.classList.remove('entre');
    }, 380);
  }
  var minuteur = setInterval(suivant, 3200);
  document.addEventListener('visibilitychange', function () {
    clearInterval(minuteur);
    if (!document.hidden) minuteur = setInterval(suivant, 3200);
  });
})();
