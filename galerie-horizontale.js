// Galerie en scroll horizontal, pilotée par le scroll vertical (tier 2+, uniquement
// si le métier a un vrai contenu visuel/portfolio — voir GRILLE-TIERS-ANIMATION.md).
// Vanilla JS, aucune dépendance (fonctionne avec ou sans GSAP présent sur la page).
//
// Structure HTML attendue :
//   <div class="galerie-horiz-wrap" style="height: 300vh;">   <!-- hauteur = piste de scroll -->
//     <div class="galerie-horiz-sticky" style="position:sticky; top:0; overflow:hidden;">
//       <div class="galerie-horiz-track" style="display:flex;">
//         <div class="galerie-horiz-item">...</div>
//         ...
//       </div>
//     </div>
//   </div>
// Usage : <script src="galerie-horizontale.js" defer></script>
//   <script>GalerieHorizontale.init('.galerie-horiz-wrap');</script>

(function () {
  function init(selector) {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll(selector).forEach((wrap) => {
      const sticky = wrap.querySelector('.galerie-horiz-sticky');
      const track = wrap.querySelector('.galerie-horiz-track');
      if (!sticky || !track) return;

      if (reduced) {
        // Repli accessible : scroll horizontal natif au doigt/molette, pas de pilotage JS
        sticky.style.overflowX = 'auto';
        track.style.width = 'max-content';
        return;
      }

      function update() {
        const rect = wrap.getBoundingClientRect();
        const scrollable = wrap.offsetHeight - window.innerHeight;
        if (scrollable <= 0) return;
        const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
        const maxTranslate = track.scrollWidth - sticky.offsetWidth;
        track.style.transform = `translateX(-${progress * maxTranslate}px)`;
      }
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    });
  }

  window.GalerieHorizontale = { init };
})();
