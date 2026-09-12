/* =====================================================================
   LOCWEB — la signature du hero.

   Un L en verre epais, traverse par une lumiere rouge. C'est le signe
   du logo, en volume : on le reconnait sans qu'il soit ecrit.

   CE SCRIPT NE PORTE RIEN D'INDISPENSABLE. L'image fixe du meme objet
   est deja dans la page, chargee avec le HTML ; la scene 3D ne la
   remplace que sur ordinateur, avec WebGL, et si le visiteur n'a pas
   demande a reduire les animations. Sur telephone on garde l'image :
   600 Ko de Three.js pour un objet qui tourne doucement, ce n'est pas
   un echange raisonnable sur une connexion mobile.

   L'OBJET VIT DANS UN PANNEAU SOMBRE, quel que soit le theme du site.
   Essaye aussi sur fond blanc : un verre clair y disparait, et le
   meme L teinte en gris ressemblait a une lettre en plastique. Le
   verre n'est beau que sur du noir ; c'est donc le noir qui vient a
   lui, dans un cadre.

   `?capture=1` rend une seule image et l'envoie au petit serveur de
   capture : c'est ainsi qu'est fabriquee l'image fixe. Sans ce
   parametre, rien de ce mode ne s'execute.
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

  /* Three.js n'est demande qu'une fois la page affichee et au repos :
     il ne dispute jamais le premier rendu au texte du hero. */
  var lancer = function () { charger('/assets/three.min.js', demarrer); };
  if (capture) lancer();
  else if ('requestIdleCallback' in window) requestIdleCallback(lancer, { timeout: 2500 });
  else setTimeout(lancer, 1200);

  function demarrer() {
    var THREE = window.THREE;

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!capture });
    renderer.setPixelRatio(capture ? 1 : Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x0d0d10, 1);   /* la couleur du panneau */
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.physicallyCorrectLights = true;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 11);

    /* --- L'environnement : une piece de lumieres douces -------------
       Le verre ne se voit que par ce qu'il reflete et ce qu'il
       deforme. Une piece grise avec quelques panneaux lumineux suffit
       a lui donner des aretes nettes, sans charger d'image HDR. */
    var pmrem = new THREE.PMREMGenerator(renderer);
    var piece = new THREE.Scene();
    var murs = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 12), new THREE.MeshBasicMaterial({ color: 0x0c0c10, side: THREE.BackSide }));
    piece.add(murs);
    function panneau(w, h, x, y, z, ry, intensite) {
      var m = new THREE.MeshBasicMaterial({ color: 0xffffff });
      m.color.setScalar(intensite);
      var p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      p.position.set(x, y, z); p.rotation.y = ry;
      piece.add(p);
    }
    panneau(7, 0.8, 0, 3.7, -1, 0, 9);
    panneau(1.2, 6, -5.9, 0.4, 1.5, Math.PI / 2, 9);
    panneau(1.2, 6, 5.9, 0.4, -1.5, -Math.PI / 2, 6);
    panneau(4, 5, 0, 0.5, 5.9, Math.PI, 2.2);
    panneau(3, 3, 0, -3.9, 0, 0, 0.6);
    scene.environment = pmrem.fromScene(piece, 0.04).texture;

    /* --- Le L ----------------------------------------------------------
       Memes proportions que le signe de l'entete : fut a 40 % de la
       largeur, pied a 38 % de la hauteur. */
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
      depth: 0.9, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.14, bevelSegments: 10, curveSegments: 12
    });
    geo.center();

    var verre = new THREE.MeshPhysicalMaterial({
      color: 0xf1f3f6, metalness: 0, roughness: 0.05,
      transmission: 1, thickness: 1.4, ior: 1.5,
      clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.6,
      specularIntensity: 1, transparent: true
    });
    var L = new THREE.Mesh(geo, verre);

    /* --- La lumiere rouge -----------------------------------------------
       Une barre lumineuse posee DERRIERE le verre : on ne la voit
       jamais telle quelle, seulement deformee par le L. C'est elle
       qui fait du verre une signature LocWeb et non un objet de
       demonstration generique. */
    /* Une fente verticale, derriere l'arete interieure du fut : la
       lumiere semble venir de l'angle du L. Une diagonale faisait
       sabre laser ; la verticale reste calme et architecturale. */
    var barre = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 0.3),
      new THREE.MeshBasicMaterial({ map: textureLame(THREE), transparent: true, depthWrite: false })
    );
    barre.rotation.z = Math.PI / 2;
    barre.position.set(-0.66, 0.62, -0.9);
    var halo = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3.8),
      new THREE.MeshBasicMaterial({ map: textureHalo(THREE), transparent: true, depthWrite: false, opacity: 0.5 })
    );
    halo.position.set(-0.6, 0.45, -1.4);

    var groupe = new THREE.Group();
    groupe.add(halo, barre, L);
    groupe.rotation.set(-0.12, -0.5, 0.03);

    scene.add(groupe);

    renderer.toneMappingExposure = 1.05;
    halo.material.opacity = 0.65;
    verre.envMapIntensity = 1.2;

    var canvas = renderer.domElement;
    hote.appendChild(canvas);

    function taille() {
      var r = hote.getBoundingClientRect();
      var w = capture ? 1000 : Math.max(1, r.width), h = capture ? 1250 : Math.max(1, r.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      /* Sur un cadre plus large que haut, on recule pour que le L tienne
         entier en hauteur. */
      camera.position.z = camera.aspect < 1 ? 11 / camera.aspect : 11;
      camera.updateProjectionMatrix();
    }
    taille();

    /* --- Le mode capture : une image, puis on s'arrete ---------------- */
    if (capture) {
      renderer.render(scene, camera);
      renderer.render(scene, camera);
      var donnees = canvas.toDataURL('image/webp', 0.92);
      fetch('/capture?nom=signature', { method: 'POST', body: donnees })
        .then(function (r) { document.title = 'capture ' + (r.ok ? 'ok' : 'erreur ' + r.status); })
        .catch(function (e) { document.title = 'capture erreur ' + e.message; });
      return;
    }

    /* --- L'animation ------------------------------------------------------
       Une respiration lente, et le L suit un peu la souris. Elle
       s'arrete des que le hero sort de l'ecran ou que l'onglet est en
       arriere-plan : aucun calcul pour rien. */
    var cible = { x: 0, y: 0 }, courant = { x: 0, y: 0 };
    window.addEventListener('pointermove', function (e) {
      cible.x = (e.clientX / window.innerWidth - 0.5);
      cible.y = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    var visible = true, actif = false, t0 = performance.now();
    function boucle(t) {
      if (!visible || document.hidden) { actif = false; return; }
      var s = (t - t0) / 1000;
      courant.x += (cible.x - courant.x) * 0.045;
      courant.y += (cible.y - courant.y) * 0.045;
      groupe.rotation.y = -0.5 + Math.sin(s * 0.35) * 0.16 + courant.x * 0.3;
      groupe.rotation.x = -0.12 + Math.cos(s * 0.28) * 0.05 + courant.y * 0.16;
      groupe.position.y = Math.sin(s * 0.6) * 0.08;
      renderer.render(scene, camera);
      requestAnimationFrame(boucle);
    }
    function relancer() { if (!actif && visible && !document.hidden) { actif = true; requestAnimationFrame(boucle); } }

    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; relancer(); }).observe(hote);
    document.addEventListener('visibilitychange', relancer);
    window.addEventListener('resize', taille);

    /* La scene prend le relais de l'image seulement une fois la premiere
       image calculee : jamais de trou entre les deux. */
    renderer.render(scene, camera);
    requestAnimationFrame(function () { hote.setAttribute('data-mode', 'scene'); relancer(); });
  }

  /* La lame : un trait rouge au coeur blanc-chaud, qui s'eteint vers
     ses deux bouts et ses deux bords. */
  function textureLame(THREE) {
    var c = document.createElement('canvas');
    c.width = 512; c.height = 64;
    var x = c.getContext('2d');
    var long = x.createLinearGradient(0, 0, 512, 0);
    long.addColorStop(0, 'rgba(255,40,30,0)');
    long.addColorStop(0.2, 'rgba(255,40,30,1)');
    long.addColorStop(0.8, 'rgba(255,40,30,1)');
    long.addColorStop(1, 'rgba(255,40,30,0)');
    x.fillStyle = long; x.fillRect(0, 0, 512, 64);
    x.globalCompositeOperation = 'destination-in';
    var large = x.createLinearGradient(0, 0, 0, 64);
    large.addColorStop(0, 'rgba(0,0,0,0)');
    large.addColorStop(0.5, 'rgba(0,0,0,1)');
    large.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = large; x.fillRect(0, 0, 512, 64);
    x.globalCompositeOperation = 'lighter';
    var coeur = x.createLinearGradient(0, 26, 0, 38);
    coeur.addColorStop(0, 'rgba(255,190,170,0)');
    coeur.addColorStop(0.5, 'rgba(255,200,180,0.55)');
    coeur.addColorStop(1, 'rgba(255,190,170,0)');
    x.fillStyle = coeur; x.fillRect(90, 26, 332, 12);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  /* Un halo radial, dessine une fois dans un canvas. */
  function textureHalo(THREE) {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,50,40,0.9)');
    g.addColorStop(0.35, 'rgba(255,40,30,0.35)');
    g.addColorStop(1, 'rgba(255,40,30,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
})();
