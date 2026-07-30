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
//
// Fluidité mobile : la mise à jour est cadencée par requestAnimationFrame (un seul
// calcul par frame, jamais plusieurs par évènement scroll) et le déplacement utilise
// translate3d (accélération GPU) — évite le saccadé observé avec translateX seul
// sur mobile, notamment en scroll rapide au doigt.

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

      track.style.backfaceVisibility = 'hidden';

      let ticking = false;
      function update() {
        const rect = wrap.getBoundingClientRect();
        const scrollable = wrap.offsetHeight - window.innerHeight;
        if (scrollable > 0) {
          const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
          const maxTranslate = track.scrollWidth - sticky.offsetWidth;
          track.style.transform = `translate3d(-${progress * maxTranslate}px,0,0)`;
        }
        ticking = false;
      }
      function onScroll() {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      update();
    });
  }

  window.GalerieHorizontale = { init };
})();
