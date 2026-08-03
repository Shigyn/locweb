// Fonds de hero animés, réutilisables sur tous les sites (tier 0 à 3, voir
// GRILLE-TIERS-ANIMATION.md pour savoir quelles techniques sont autorisées par tier).
// Aucune dépendance externe (vanilla canvas). Purement décoratif : si le script ne
// charge pas ou plante, le hero garde son fond CSS statique — le canvas doit
// toujours être posé en position:absolute, z-index sous le contenu, pointer-events:none.
//
// ⚠️ PIÈGE VÉRIFIÉ EN TEST : un <canvas> est un élément remplacé avec une taille
// intrinsèque (300×150 par défaut). `position:absolute;inset:0` seul ne l'étire PAS
// de façon fiable sur tous les navigateurs — il faut TOUJOURS ajouter explicitement
// `width:100%;height:100%` en CSS en plus de `inset:0`, sinon le canvas reste à sa
// taille par défaut et l'animation ne couvre qu'un petit coin du hero.
//
// Usage : <canvas id="hero-bg" style="position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;"></canvas>
// puis, en fin de body, après contenu-loader.js :
//   <script src="hero-backgrounds.js" defer></script>
//   <script>window.addEventListener('DOMContentLoaded', () => HeroBg.initVagues('hero-bg', 'or-emeraude-bordeaux'));</script>

(function () {
  const PALETTES = {
    'or-emeraude-bordeaux': { bg: '#0b0b0d', c: ['201,169,97', '47,79,66', '92,42,50'] },
    'glace-acier-saphir':   { bg: '#0a0d10', c: ['143,180,201', '70,90,110', '40,60,95'] },
    'argile-ocre-mousse':   { bg: '#14100c', c: ['201,138,75', '90,102,60', '139,74,59'] },
    'rose-cuivre-prune':    { bg: '#100c0e', c: ['217,159,163', '168,98,60', '90,50,74'] },
    'graphite-corail-encre':{ bg: '#0e0e0e', c: ['224,137,114', '70,70,74', '30,40,50'] },
    'bronze-aurora':        { bg: '#14110d', c: ['192,133,82', '139,74,59', '74,90,99'] },
  };

  function resolvePalette(palette) {
    if (typeof palette === 'string') return PALETTES[palette] || PALETTES['or-emeraude-bordeaux'];
    return palette; // { bg, c: [...] } fourni directement
  }

  function setupCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    let w, h;
    function resize() { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; }
    resize();
    window.addEventListener('resize', resize);
    return { canvas, ctx, get w() { return w; }, get h() { return h; } };
  }

  // Respecte prefers-reduced-motion : pas d'animation infinie pour les utilisateurs qui l'ont désactivée.
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ── VAGUES STRATIFIÉES (tier 0+, la plus sobre) ──
  function initVagues(canvasId, palette) {
    const s = setupCanvas(canvasId); if (!s) return;
    const { canvas, ctx } = s;
    const p = resolvePalette(palette);
    let t = 0;
    const layers = [
      { amp: .06, freq: 1.4, speed: .0006, base: .55, color: p.c[0], op: .16 },
      { amp: .08, freq: 2.1, speed: -.0004, base: .68, color: p.c[1], op: .18 },
      { amp: .05, freq: 1.8, speed: .0005, base: .4, color: p.c[2], op: .16 },
    ];
    function draw() {
      const w = s.w, h = s.h;
      ctx.fillStyle = p.bg; ctx.fillRect(0, 0, w, h);
      layers.forEach((L) => {
        ctx.beginPath(); ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 8) {
          const y = h * L.base + Math.sin(x * 0.004 * L.freq + t * L.speed) * h * L.amp + Math.sin(x * 0.001 + t * 0.0003) * h * 0.03;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h); ctx.closePath();
        ctx.fillStyle = `rgba(${L.color},${L.op})`; ctx.fill();
      });
      if (!reducedMotion()) t += 16;
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── AURORES VERTICALES (tier 0+, sobre) ──
  function initAurores(canvasId, palette) {
    const s = setupCanvas(canvasId); if (!s) return;
    const { ctx } = s;
    const p = resolvePalette(palette);
    let t = 0;
    const bands = [{ c: p.c[0], ph: 0 }, { c: p.c[1], ph: 2.1 }, { c: p.c[2], ph: 4.2 }, { c: p.c[0], ph: 1.3 }, { c: p.c[1], ph: 3.4 }];
    function draw() {
      const w = s.w, h = s.h;
      ctx.fillStyle = p.bg; ctx.fillRect(0, 0, w, h);
      ctx.filter = 'blur(40px)';
      bands.forEach((b) => {
        const cx = (0.2 + 0.6 * ((Math.sin(t * 0.00015 + b.ph) + 1) / 2)) * w;
        const width = w * 0.26;
        const grad = ctx.createLinearGradient(cx - width, 0, cx + width, 0);
        grad.addColorStop(0, `rgba(${b.c},0)`); grad.addColorStop(.5, `rgba(${b.c},.3)`); grad.addColorStop(1, `rgba(${b.c},0)`);
        ctx.fillStyle = grad; ctx.fillRect(cx - width, 0, width * 2, h);
      });
      ctx.filter = 'none';
      if (!reducedMotion()) t += 16;
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── MÉTABALLES FLUIDES (tier 2+, démonstrative) ──
  function initMetaballes(canvasId, palette) {
    const s = setupCanvas(canvasId); if (!s) return;
    const { canvas, ctx } = s;
    const p = resolvePalette(palette);
    let t = 0, bw, bh, img;
    const off = document.createElement('canvas');
    const octx = off.getContext('2d');
    function resizeBuf() {
      const scale = 0.22;
      bw = Math.max(1, Math.floor(s.w * scale)); bh = Math.max(1, Math.floor(s.h * scale));
      img = ctx.createImageData(bw, bh);
      off.width = bw; off.height = bh;
    }
    resizeBuf(); window.addEventListener('resize', resizeBuf);
    const cols = [p.c[0], p.c[1], p.c[2], p.c[0]].map((c) => c.split(',').map(Number));
    const blobs = [{ r: 70 }, { r: 55 }, { r: 60 }, { r: 45 }];
    function draw() {
      const data = img.data;
      const centers = blobs.map((b, i) => ({
        x: (0.3 + 0.22 * Math.sin(t * 0.0004 + i * 2.1)) * bw + 0.15 * bw * Math.cos(t * 0.0003 + i),
        y: (0.35 + 0.25 * Math.cos(t * 0.0005 + i * 1.7)) * bh,
        r: b.r * 0.22, c: cols[i],
      }));
      for (let py = 0; py < bh; py++) {
        for (let px = 0; px < bw; px++) {
          let sum = 0, cr = 0, cg = 0, cb = 0;
          for (const b of centers) {
            const dx = px - b.x, dy = py - b.y, d2 = dx * dx + dy * dy + 1;
            const inf = (b.r * b.r) / d2;
            sum += inf; cr += b.c[0] * inf; cg += b.c[1] * inf; cb += b.c[2] * inf;
          }
          const idx = (py * bw + px) * 4;
          if (sum > 0.9) {
            const alpha = Math.min(1, (sum - 0.9) * 1.6);
            data[idx] = cr / sum; data[idx + 1] = cg / sum; data[idx + 2] = cb / sum; data[idx + 3] = alpha * 255;
          } else { data[idx + 3] = 0; }
        }
      }
      ctx.fillStyle = p.bg; ctx.fillRect(0, 0, s.w, s.h);
      ctx.imageSmoothingEnabled = true;
      octx.putImageData(img, 0, 0);
      ctx.drawImage(off, 0, 0, s.w, s.h);
      if (!reducedMotion()) t += 16;
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── FUMÉE / VOLUTES (tier 2+, démonstrative) ──
  function initFumee(canvasId, palette) {
    const s = setupCanvas(canvasId); if (!s) return;
    const { ctx } = s;
    const p = resolvePalette(palette);
    let t = 0;
    const wisps = Array.from({ length: 9 }, (_, i) => ({ seed: i * 37.1, r: .14 + Math.random() * .16, c: p.c[i % 3] }));
    function draw() {
      const w = s.w, h = s.h;
      ctx.fillStyle = p.bg; ctx.fillRect(0, 0, w, h);
      ctx.filter = 'blur(38px)';
      wisps.forEach((wi) => {
        const x = (0.5 + 0.42 * Math.sin(t * 0.00018 + wi.seed)) * w;
        const y = (0.5 + 0.4 * Math.cos(t * 0.00013 + wi.seed * 1.3)) * h;
        const r = wi.r * Math.max(w, h);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${wi.c},.14)`); grad.addColorStop(1, `rgba(${wi.c},0)`);
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      });
      ctx.filter = 'none';
      if (!reducedMotion()) t += 16;
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── GRILLE QUI RESPIRE (tier 2+, tech/minimal) ──
  function initGrille(canvasId, palette) {
    const s = setupCanvas(canvasId); if (!s) return;
    const { ctx } = s;
    const p = resolvePalette(palette);
    let t = 0;
    const step = 34;
    function draw() {
      const w = s.w, h = s.h;
      ctx.fillStyle = p.bg; ctx.fillRect(0, 0, w, h);
      for (let gy = 0; gy * step < h + step; gy++) {
        for (let gx = 0; gx * step < w + step; gx++) {
          const x0 = gx * step, y0 = gy * step;
          const wave = Math.sin((x0 + y0) * 0.012 + t * 0.0011) * 10;
          const x = x0, y = y0 + wave;
          const dist = Math.hypot(x - w / 2, y - h / 2) / Math.max(w, h);
          const alpha = Math.max(0, .22 - dist * .22) + .04;
          const size = 1.3 + Math.sin((x0 * 0.02) + (t * 0.0015)) * .9;
          ctx.beginPath(); ctx.arc(x, y, Math.max(.4, size), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.c[0]},${alpha})`; ctx.fill();
        }
      }
      if (!reducedMotion()) t += 16;
      requestAnimationFrame(draw);
    }
    draw();
  }

  window.HeroBg = { initVagues, initAurores, initMetaballes, initFumee, initGrille, PALETTES };
})();
