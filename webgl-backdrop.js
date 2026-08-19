// Décor WebGL de toute la page (pas seulement du hero) : un seul nuage de points
// qui se re-forme au fil du scroll — c'est lui qui donne la continuité "un seul
// espace traversé" plutôt qu'une pile de sections empilées.
//
// États successifs, pilotés par la progression de scroll dans le document :
//   0. dispersé/éteint  — avant que quoi que ce soit n'existe en ligne
//   1. sphère rouge     — "le signal" : la présence en ligne se forme (hero)
//   2. anneau           — les réalisations qui gravitent (réalisations)
//   3. grille           — l'échelle des tiers, ordonnée (tiers / support)
//   4. colonne montante — l'élan final (tarifs / contact)
//
// Three.js pur, géométrie procédurale : aucun modèle .glb, donc aucun décodeur
// Draco/KTX2 à héberger. Nécessite three.min.js chargé avant.
// Si WebGL est indisponible ou prefers-reduced-motion actif, ce script ne fait
// rien : le fond CSS reste le rendu, jamais un écran vide.

(function () {
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('backdrop-canvas');
  if (!canvas || reduced || !window.THREE) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (e) {
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const isTouch = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const NB = isTouch ? 500 : 1300;

  function makeDotTexture() {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }

  // ── Les formes successives, calculées une seule fois au démarrage ──
  function shapeScatter() {
    const a = new Float32Array(NB * 3);
    for (let i = 0; i < NB; i++) {
      a[i * 3] = (Math.random() - 0.5) * 18;
      a[i * 3 + 1] = (Math.random() - 0.5) * 11;
      a[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    return a;
  }
  function shapeSphere() {
    const a = new Float32Array(NB * 3);
    for (let i = 0; i < NB; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.1 + Math.random() * 0.3;
      a[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      a[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.85;
      a[i * 3 + 2] = r * Math.cos(phi) * 0.65;
    }
    return a;
  }
  function shapeRing() {
    const a = new Float32Array(NB * 3);
    for (let i = 0; i < NB; i++) {
      const t = Math.random() * Math.PI * 2;
      const tube = 0.34 + Math.random() * 0.3;
      const s = Math.random() * Math.PI * 2;
      const R = 3.1;
      a[i * 3] = (R + tube * Math.cos(s)) * Math.cos(t);
      a[i * 3 + 1] = (R + tube * Math.cos(s)) * Math.sin(t) * 0.42;
      a[i * 3 + 2] = tube * Math.sin(s);
    }
    return a;
  }
  function shapeGrid() {
    const a = new Float32Array(NB * 3);
    const cols = Math.ceil(Math.sqrt(NB * 1.7));
    const rows = Math.ceil(NB / cols);
    for (let i = 0; i < NB; i++) {
      const cx = i % cols, cy = Math.floor(i / cols);
      a[i * 3] = (cx / (cols - 1) - 0.5) * 11;
      a[i * 3 + 1] = (cy / (rows - 1) - 0.5) * 6.2;
      a[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    return a;
  }
  function shapeColumn() {
    const a = new Float32Array(NB * 3);
    for (let i = 0; i < NB; i++) {
      const t = i / NB;
      const ang = t * Math.PI * 14 + Math.random() * 0.5;
      const r = 0.4 + (1 - t) * 2.4;
      a[i * 3] = Math.cos(ang) * r;
      a[i * 3 + 1] = (t - 0.5) * 12;
      a[i * 3 + 2] = Math.sin(ang) * r * 0.6;
    }
    return a;
  }

  const SHAPES = [shapeScatter(), shapeSphere(), shapeRing(), shapeGrid(), shapeColumn()];
  const TINTS = [
    new THREE.Color(0x3a3a42), // éteint
    new THREE.Color(0xE8281E), // rouge LocWeb — le signal
    new THREE.Color(0xE8281E),
    new THREE.Color(0xC9A961), // or — l'échelle des tiers
    new THREE.Color(0xE8281E)
  ];

  const positions = new Float32Array(NB * 3);
  const colors = new Float32Array(NB * 3);
  positions.set(SHAPES[0]);
  for (let i = 0; i < NB; i++) {
    colors[i * 3] = TINTS[0].r; colors[i * 3 + 1] = TINTS[0].g; colors[i * 3 + 2] = TINTS[0].b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: isTouch ? 0.15 : 0.1,
    map: makeDotTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / (h || 1);
    camera.updateProjectionMatrix();
  }

  // Progression sur TOUT le document : c'est ce qui fait que le décor raconte une
  // seule traversée continue et non un effet par section.
  let progress = 0;
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }

  const mouse = { x: 0, y: 0 };
  if (!isTouch) {
    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  const posAttr = geo.getAttribute('position');
  const colAttr = geo.getAttribute('color');
  const tmp = new THREE.Color();
  const smooth = (t) => t * t * (3 - 2 * t);

  // La position affichée rattrape la cible au lieu de s'y caler au pixel près :
  // c'est ce léger retard qui donne la fluidité "premium" plutôt qu'un
  // défilement mécanique 1:1 (même principe que l'ancienne galerie horizontale).
  let shown = 0;

  function tick() {
    requestAnimationFrame(tick);
    shown += (progress - shown) * 0.06;

    const seg = shown * (SHAPES.length - 1);
    const idx = Math.min(SHAPES.length - 2, Math.floor(seg));
    const blend = smooth(Math.min(1, Math.max(0, seg - idx)));
    const from = SHAPES[idx], to = SHAPES[idx + 1];
    tmp.copy(TINTS[idx]).lerp(TINTS[idx + 1], blend);

    const t = performance.now() * 0.0004;
    for (let i = 0; i < NB; i++) {
      const ix = i * 3;
      posAttr.array[ix] = from[ix] + (to[ix] - from[ix]) * blend + Math.sin(t + i) * 0.035;
      posAttr.array[ix + 1] = from[ix + 1] + (to[ix + 1] - from[ix + 1]) * blend + Math.cos(t * 1.3 + i) * 0.035;
      posAttr.array[ix + 2] = from[ix + 2] + (to[ix + 2] - from[ix + 2]) * blend;
      colAttr.array[ix] = tmp.r; colAttr.array[ix + 1] = tmp.g; colAttr.array[ix + 2] = tmp.b;
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    camera.position.x += (mouse.x * 0.7 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.y * 0.45 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    points.rotation.y += 0.0008;

    renderer.render(scene, camera);
  }

  resize();
  updateProgress();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', updateProgress, { passive: true });
  requestAnimationFrame(tick);
})();
