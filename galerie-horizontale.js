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

      // Sur mobile, un flick au doigt couvre la même distance de scroll bien plus vite
      // qu'un geste de molette souris — même piste (en vh) = translation ressentie comme
      // trop rapide. On allonge simplement la piste sur mobile (plus de scroll vertical
      // nécessaire pour la même traversée horizontale), sans toucher au comportement desktop.
      if (window.innerWidth < 760) {
        const hauteurActuelle = parseFloat(wrap.style.height) || 200;
        wrap.style.height = (hauteurActuelle * 1.65) + 'vh';
      }

      track.style.backfaceVisibility = 'hidden';

      // Lissage (lerp) : la position affichée rattrape la cible au lieu de s'y caler
      // au pixel près à chaque frame — c'est ce petit temps de retard qui donne la
      // sensation de fluidité "premium" plutôt qu'un défilement mécanique 1:1. Boucle
      // rAF continue (plutôt que déclenchée par scroll) : nécessaire pour que le
      // rattrapage se termine même une fois le scroll arrêté.
      let current = 0;
      function frame() {
        const rect = wrap.getBoundingClientRect();
        const scrollable = wrap.offsetHeight - window.innerHeight;
        if (scrollable > 0) {
          const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
          const maxTranslate = track.scrollWidth - sticky.offsetWidth;
          const target = progress * maxTranslate;
          current += (target - current) * 0.14;
          if (Math.abs(target - current) < 0.05) current = target;
          track.style.transform = `translate3d(-${current}px,0,0)`;
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  window.GalerieHorizontale = { init };
})();
