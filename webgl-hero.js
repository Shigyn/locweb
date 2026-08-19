// Hero du site principal — "le signal" : un nuage de points épars (business pas
// encore en ligne) qui se rassemble en une sphère qui s'allume progressivement en
// rouge LocWeb au fil du scroll dans #hero, et réagit légèrement à la souris.
// Three.js pur (géométrie procédurale, aucun modèle .glb/décodeur requis).
// Nécessite three.min.js chargé avant ce script. Si WebGL indispo ou
// prefers-reduced-motion, ne fait rien : le fond CSS (.hero-vignette/.hero-glow)
// reste le rendu, jamais un écran vide.

(function () {
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('hero-canvas');
  const heroEl = document.getElementById('hero');
  if (!canvas || !heroEl || reduced || !window.THREE) return;

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
  const NB = isTouch ? 420 : 900;

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

  const positions = new Float32Array(NB * 3);
  const scattered = new Float32Array(NB * 3);
  const target = new Float32Array(NB * 3);
  const colors = new Float32Array(NB * 3);

  const COL_OFF = new THREE.Color(0x3a3a42);
  const COL_ON = new THREE.Color(0xE8281E);

  for (let i = 0; i < NB; i++) {
    const ix = i * 3;
    scattered[ix] = (Math.random() - 0.5) * 15;
    scattered[ix + 1] = (Math.random() - 0.5) * 9;
    scattered[ix + 2] = (Math.random() - 0.5) * 6;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 2.1 + Math.random() * 0.35;
    target[ix] = r * Math.sin(phi) * Math.cos(theta);
    target[ix + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.82;
    target[ix + 2] = r * Math.cos(phi) * 0.6;

    positions[ix] = scattered[ix];
    positions[ix + 1] = scattered[ix + 1];
    positions[ix + 2] = scattered[ix + 2];
    colors[ix] = COL_OFF.r; colors[ix + 1] = COL_OFF.g; colors[ix + 2] = COL_OFF.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: isTouch ? 0.16 : 0.11,
    map: makeDotTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Composition éditoriale : le titre occupe la gauche, le signal se forme à droite.
  // Sur petit écran il n'y a pas la place — on recentre et on laisse le texte passer
  // par-dessus.
  function placeSignal() {
    const wide = heroEl.offsetWidth > 900;
    points.position.x = wide ? 2.6 : 0;
    mat.opacity = wide ? 1 : 0.5;
  }

  function resize() {
    const w = heroEl.offsetWidth, h = heroEl.offsetHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / (h || 1);
    camera.updateProjectionMatrix();
    placeSignal();
  }

  // Le signal s'assemble à l'ARRIVÉE dans le hero : progress 0 quand le hero pointe
  // juste sous le viewport (points épars, éteints), 1 quand il est calé en haut de
  // l'écran (sphère formée, rouge). #hero faisant exactement 100svh, un progress basé
  // sur son propre défilement interne resterait bloqué à 0.
  let progress = 0;
  function updateProgress() {
    const top = heroEl.getBoundingClientRect().top;
    progress = Math.min(1, Math.max(0, 1 - top / (window.innerHeight || 1)));
  }

  const mouse = { x: 0, y: 0 };
  if (!isTouch) {
    heroEl.addEventListener('mousemove', (e) => {
      const r = heroEl.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
  }

  const posAttr = geo.getAttribute('position');
  const colAttr = geo.getAttribute('color');
  const tmpColor = new THREE.Color();

  function tick() {
    requestAnimationFrame(tick);
    const eased = progress * progress * (3 - 2 * progress);
    const t = performance.now() * 0.0004;
    for (let i = 0; i < NB; i++) {
      const ix = i * 3;
      const sx = scattered[ix], sy = scattered[ix + 1], sz = scattered[ix + 2];
      const tx = target[ix], ty = target[ix + 1], tz = target[ix + 2];
      let x = sx + (tx - sx) * eased;
      let y = sy + (ty - sy) * eased;
      let z = sz + (tz - sz) * eased;
      x += Math.sin(t + i) * 0.03 * eased;
      y += Math.cos(t * 1.3 + i) * 0.03 * eased;
      posAttr.array[ix] = x; posAttr.array[ix + 1] = y; posAttr.array[ix + 2] = z;

      tmpColor.copy(COL_OFF).lerp(COL_ON, eased);
      colAttr.array[ix] = tmpColor.r; colAttr.array[ix + 1] = tmpColor.g; colAttr.array[ix + 2] = tmpColor.b;
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.y * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    points.rotation.y += 0.0009 + eased * 0.0012;

    renderer.render(scene, camera);
  }

  resize();
  updateProgress();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', updateProgress, { passive: true });
  requestAnimationFrame(tick);
})();
