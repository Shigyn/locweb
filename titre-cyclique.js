// Titre qui cycle entre plusieurs accroches (tier 2+, optionnel — utile si plusieurs
// services à mettre en avant à poids égal). Vanilla JS, aucune dépendance.
//
// Structure HTML attendue :
//   <span class="titre-cyclique" data-mots='["exceptionnelle","sur mesure","durable"]'>exceptionnelle</span>
// Le premier mot doit être dans le HTML en dur (fallback JS-off) ET dans data-mots.
// Usage : <script src="titre-cyclique.js" defer></script>
//   <script>TitreCyclique.init('.titre-cyclique', { intervalle: 2600 });</script>

(function () {
  function init(selector, options) {
    const opts = Object.assign({ intervalle: 2600 }, options || {});
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // reste sur le 1er mot

    document.querySelectorAll(selector).forEach((el) => {
      let mots;
      try { mots = JSON.parse(el.getAttribute('data-mots')); } catch (e) { return; }
      if (!Array.isArray(mots) || mots.length < 2) return;

      let i = 0;
      el.style.display = 'inline-block';
      el.style.transition = 'opacity .4s, transform .4s, filter .4s';

      setInterval(() => {
        el.style.opacity = '0'; el.style.transform = 'translateY(8px) scale(.92)'; el.style.filter = 'blur(6px)';
        setTimeout(() => {
          i = (i + 1) % mots.length;
          el.textContent = mots[i];
          el.style.opacity = '1'; el.style.transform = 'translateY(0) scale(1)'; el.style.filter = 'blur(0px)';
        }, 380);
      }, opts.intervalle);
    });
  }

  window.TitreCyclique = { init };
})();
