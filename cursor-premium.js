// Curseur personnalisé (tier 2 "light" = point qui suit la souris, tier 3 "complet"
// = + labels contextuels sur les éléments marqués data-cursor-label="Voir le chantier").
// Se désactive automatiquement sur tactile (pas de souris = pas de curseur perso).
// Usage : <script src="cursor-premium.js" defer></script>
//   <script>CursorPremium.init({ mode: 'light' });</script>  // ou mode: 'full'

(function () {
  function init(options) {
    const opts = Object.assign({ mode: 'light' }, options || {});
    if (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches) return; // tactile : rien

    const dot = document.createElement('div');
    dot.setAttribute('aria-hidden', 'true');
    Object.assign(dot.style, {
      position: 'fixed', zIndex: '9999', pointerEvents: 'none',
      width: '10px', height: '10px', borderRadius: '50%',
      background: 'var(--cursor-color, #fff)',
      transform: 'translate(-50%,-50%)', transition: 'width .2s,height .2s,opacity .2s',
      opacity: '0',
    });
    document.body.appendChild(dot);

    let label = null;
    if (opts.mode === 'full') {
      label = document.createElement('div');
      Object.assign(label.style, {
        position: 'fixed', zIndex: '9999', pointerEvents: 'none',
        background: 'var(--cursor-color, #fff)', color: 'var(--cursor-text, #000)',
        font: '600 12px/1 system-ui, sans-serif', padding: '8px 14px', borderRadius: '100px',
        transform: 'translate(-50%,-50%)', opacity: '0', transition: 'opacity .2s', whiteSpace: 'nowrap',
      });
      document.body.appendChild(label);
    }

    document.addEventListener('mousemove', (e) => {
      dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; dot.style.opacity = '1';
      if (label) { label.style.left = e.clientX + 'px'; label.style.top = e.clientY + 'px'; }
    });
    document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; if (label) label.style.opacity = '0'; });

    if (opts.mode === 'full') {
      document.querySelectorAll('[data-cursor-label]').forEach((el) => {
        el.addEventListener('mouseenter', () => {
          label.textContent = el.getAttribute('data-cursor-label');
          label.style.opacity = '1'; dot.style.width = '4px'; dot.style.height = '4px';
        });
        el.addEventListener('mouseleave', () => {
          label.style.opacity = '0'; dot.style.width = '10px'; dot.style.height = '10px';
        });
      });
    }
  }

  window.CursorPremium = { init };
})();
