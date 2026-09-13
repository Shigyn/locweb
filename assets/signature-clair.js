/* =====================================================================
   LOCWEB — la signature du hero, version claire.

   Le meme L que le signe de l'entete, mais en LAQUE ROUGE posee sur du
   blanc, comme un produit photographie en studio. Le verre de la
   version sombre ne marchait pas sur fond clair (il disparaissait) :
   ici c'est la matiere pleine et brillante qui fait l'objet, et les
   reflets doux du studio qui lui donnent son volume.

   Fond transparent : le blanc et la lueur du hero sont ceux de la page.
   Une ombre de contact sous le L le pose sur le sol.

   Rien d'indispensable ici : l'image fixe du meme objet est deja dans
   la page. La scene ne la remplace que sur ordinateur, avec WebGL, sans
   demande de reduction des animations.

   `?capture=1` rend une image et l'envoie au serveur de capture local
   (outils/capture-serveur.mjs) : c'est ainsi qu'est fabriquee l'image
   fixe `signature-clair.webp`.
   ===================================================================== */
(function () {
  'use strict';

  var hote = document.getElementById('signature');
  if (!hote) return;

  var capture = /[?&]capture=1/.test(location.search);
  var calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var grand = matchMedia('(min-width: 901px)').matches;
  if (!capture && (calme || !grand)) return;

  function webglDispo() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }
  if (!webglDispo()) return;

  function charger(src, fin) {
    var s = document.createElement('script');
    s.src = src; s.async = true; s.onload = fin;
    document.head.appendChild(s);
  }
  var lancer = function () { charger('/assets/three.min.js', demarrer); };
  if (capture) lancer();
  else if ('requestIdleCallback' in window) requestIdleCallback(lancer, { timeout: 2500 });
  else setTimeout(lancer, 1200);

  function demarrer() {
    var THREE = window.THREE;

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!capture });
    renderer.setPixelRatio(capture ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xffffff, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    /* Sans tone mapping : ACES desaturait le rouge vers l'orange brique. */
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.physicallyCorrectLights = true;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

    /* --- Le studio ------------------------------------------------------
       Une piece claire et de grands panneaux lumineux : sur la laque,
       ils deviennent de longs reflets blancs qui dessinent les aretes. */
    var pmrem = new THREE.PMREMGenerator(renderer);
    var studio = new THREE.Scene();
    var murs = new THREE.Mesh(new THREE.BoxGeometry(14, 9, 14), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide }));
    murs.material.color.setScalar(0.06);   /* piece sombre : sinon la laque se delave en rose */
    studio.add(murs);
    function panneau(w, h, x, y, z, rx, ry, intensite) {
      var m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      m.color.setScalar(intensite);
      var p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      p.position.set(x, y, z); p.rotation.set(rx, ry, 0);
      studio.add(p);
    }
    panneau(9, 2.2, 0, 4.4, 0, Math.PI / 2, 0, 2.6);          /* plafond : le grand reflet du dessus */
    panneau(1.6, 7, -6.9, 0.5, 1.2, 0, Math.PI / 2, 3.2);      /* la bande verticale a gauche */
    panneau(2.4, 5, 6.9, 0.2, -1, 0, -Math.PI / 2, 1.4);       /* le contre-jour a droite */
    panneau(6, 4, 0, 0.6, 6.9, 0, Math.PI, 0.25);            /* la face, douce */
    panneau(1.3, 8, -2.6, 0.4, 6.8, 0, Math.PI, 2.4);          /* la bande qui fait le reflet laque sur la face */
    scene.environment = pmrem.fromScene(studio, 0.035).texture;

    var cle = new THREE.DirectionalLight(0xffffff, 1.1);
    cle.position.set(-3, 5, 4);
    scene.add(cle);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a0d0a, 0.35));
    var appoint = new THREE.DirectionalLight(0xffe8e4, 0.7);   /* debouche le flanc droit */
    appoint.position.set(5, 1, 2);
    scene.add(appoint);

    /* --- Le L --------------------------------------------------------- */
    var W = 2.4, H = 3.2, ep = W * 0.4, pied = H * 0.38;
    var forme = new THREE.Shape();
    forme.moveTo(-W / 2, -H / 2);
    forme.lineTo(W / 2, -H / 2);
    forme.lineTo(W / 2, -H / 2 + pied);
    forme.lineTo(-W / 2 + ep, -H / 2 + pied);
    forme.lineTo(-W / 2 + ep, H / 2);
    forme.lineTo(-W / 2, H / 2);
    forme.lineTo(-W / 2, -H / 2);
    var geo = new THREE.ExtrudeGeometry(forme, {
      depth: 0.8, bevelEnabled: true, bevelThickness: 0.34, bevelSize: 0.3, bevelSegments: 20, curveSegments: 24
    });
    geo.center();

    var laque = new THREE.MeshPhysicalMaterial({
      color: 0xe31b10, metalness: 0, roughness: 0.3,
      clearcoat: 1, clearcoatRoughness: 0.06,
      envMapIntensity: 1
    });
    /* Couleur donnee en sRGB, convertie en lineaire : sans ca, cette
       version de Three.js prend l'hexa pour du lineaire et le rouge
       ressort delave, orange brique. */
    if (laque.color.convertSRGBToLinear) laque.color.convertSRGBToLinear();
    var L = new THREE.Mesh(geo, laque);

    /* --- L'ombre de contact : un degrade radial sous l'objet --------- */
    var ombre = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 4.4),
      new THREE.MeshBasicMaterial({ map: textureOmbre(THREE), transparent: true, depthWrite: false, toneMapped: false })
    );
    ombre.rotation.x = -Math.PI / 2;
    ombre.position.y = -2.05;

    var groupe = new THREE.Group();
    groupe.add(L);
    scene.add(groupe, ombre);

    var canvas = renderer.domElement;
    hote.appendChild(canvas);

    function taille() {
      var r = hote.getBoundingClientRect();
      var w = capture ? 1200 : Math.max(1, r.width), h = capture ? 1200 : Math.max(1, r.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      var recul = camera.aspect < 1 ? 12.5 / camera.aspect : 12.5;
      camera.position.set(0, 1.6, recul);
      camera.lookAt(0, -0.35, 0);
      camera.updateProjectionMatrix();
    }
    taille();

    function poser(s, mx, my) {
      groupe.rotation.y = -0.62 + Math.sin(s * 0.32) * 0.2 + mx * 0.35;
      groupe.rotation.x = -0.08 + Math.cos(s * 0.26) * 0.04 + my * 0.12;
      groupe.rotation.z = 0.04;
      var flotte = Math.sin(s * 0.7) * 0.12;
      groupe.position.y = 0.05 + flotte;
      /* L'ombre respire avec l'objet : plus il monte, plus elle s'etale
         et s'eclaircit. */
      var k = 1 + flotte * 0.9;
      ombre.scale.set(k, k, 1);
      ombre.material.opacity = 0.9 - flotte * 1.4;
    }

    if (capture) {
      poser(0.9, 0, 0);
      renderer.render(scene, camera);
      renderer.render(scene, camera);
      fetch('/capture?nom=signature-clair', { method: 'POST', body: canvas.toDataURL('image/webp', 0.92) })
        .then(function (r) { document.title = 'capture ' + (r.ok ? 'ok' : 'erreur ' + r.status); })
        .catch(function (e) { document.title = 'capture erreur ' + e.message; });
      return;
    }

    var cible = { x: 0, y: 0 }, courant = { x: 0, y: 0 };
    window.addEventListener('pointermove', function (e) {
      cible.x = (e.clientX / window.innerWidth - 0.5);
      cible.y = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    var visible = true, actif = false, t0 = performance.now();
    function boucle(t) {
      if (!visible || document.hidden) { actif = false; return; }
      courant.x += (cible.x - courant.x) * 0.045;
      courant.y += (cible.y - courant.y) * 0.045;
      poser((t - t0) / 1000 + 0.9, courant.x, courant.y);
      renderer.render(scene, camera);
      requestAnimationFrame(boucle);
    }
    function relancer() { if (!actif && visible && !document.hidden) { actif = true; requestAnimationFrame(boucle); } }
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; relancer(); }).observe(hote);
    document.addEventListener('visibilitychange', relancer);
    window.addEventListener('resize', taille);

    poser(0.9, 0, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(function () { hote.setAttribute('data-mode', 'scene'); relancer(); });
  }

  function textureOmbre(THREE) {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(70,18,14,0.30)');
    g.addColorStop(0.3, 'rgba(70,18,14,0.14)');
    g.addColorStop(0.7, 'rgba(70,18,14,0.03)');
    g.addColorStop(1, 'rgba(70,18,14,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
})();
