/* =====================================================================
   LOCWEB — le script commun.

   Trois choses seulement : le theme, le menu telephone, les
   apparitions au defilement. Rien ici n'est necessaire pour lire la
   page : sans JavaScript, le site reste entierement navigable.
   ===================================================================== */
(function () {
  'use strict';

  var racine = document.documentElement;

  /* --- Le theme ------------------------------------------------------
     Le choix est pose avant le premier rendu par le petit script de la
     tete ; ici on ne gere que le bouton. Le choix du visiteur prime sur
     celui de son systeme, et il est retenu d'une page a l'autre. */
  var bouton = document.getElementById('theme-bt');
  if (bouton) {
    bouton.addEventListener('click', function () {
      var nouveau = racine.dataset.theme === 'sombre' ? 'clair' : 'sombre';
      racine.dataset.theme = nouveau;
      try { localStorage.setItem('locweb-theme', nouveau); } catch (e) {}
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', nouveau === 'sombre' ? '#08090A' : '#FFFFFF');
    });
  }

  /* --- L'entete se pose des qu'on quitte le haut de la page ---------- */
  var entete = document.getElementById('entete');
  if (entete) {
    var sentinelle = document.createElement('div');
    sentinelle.style.cssText = 'position:absolute;top:0;height:1px;width:1px;pointer-events:none';
    document.body.prepend(sentinelle);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) entete.removeAttribute('data-pose');
        else entete.setAttribute('data-pose', '');
      }).observe(sentinelle);
    } else {
      entete.setAttribute('data-pose', '');
    }
  }

  /* --- Le menu telephone --------------------------------------------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu-mobile');
  if (burger && menu) {
    var fermer = function () {
      menu.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Ouvrir le menu');
    };
    burger.addEventListener('click', function () {
      var ouvrir = menu.hidden;
      menu.hidden = !ouvrir;
      burger.setAttribute('aria-expanded', ouvrir ? 'true' : 'false');
      burger.setAttribute('aria-label', ouvrir ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) fermer(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermer(); });
  }

  /* --- Le panneau des services se referme quand on clique ailleurs ---- */
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.nav-services[open]').forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute('open');
    });
  });

  /* --- Les apparitions ------------------------------------------------ */
  var aReveler = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Array.prototype.forEach.call(aReveler, function (e) { e.classList.add('vu'); });
  } else {
    var oeil = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('vu');
        oeil.unobserve(e.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(aReveler, function (e) { oeil.observe(e); });
  }

  var annee = document.getElementById('annee');
  if (annee) annee.textContent = new Date().getFullYear();
})();
