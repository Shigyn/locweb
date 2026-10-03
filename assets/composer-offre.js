/* =====================================================================
   LOCWEB — « Composer mon offre », version appli.

   Une etape par ecran, barre de progression, avance automatique quand
   on touche une carte (sauf si la carte ouvre une option), total anime
   dans le « panier » du bas, economie affichee quand le client choisit
   de faire lui-meme, ecran de fin. Sans JavaScript, toutes les etapes
   restent visibles et le formulaire marche quand meme.

   Les prix sont dans les attributs data-une / data-mois : ce script
   additionne, il ne connait aucun tarif. Deux regles seulement :
     - boutique ou commande en ligne : abonnement a 79 €/mois ;
     - la formule sans abonnement n'existe que pour le site vitrine.

   L'envoi ecrit dans la table `leads` (besoin « Composer mon offre »).
   ===================================================================== */
(function () {
  'use strict';

  var app = document.getElementById('co-app');
  var form = document.getElementById('composer-offre');
  if (!app || !form) return;
  var config = window.LOCWEB_CONFIG || {};
  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, d) { return (d || form).querySelector(s); };
  var euros = function (n) { return Math.round(n).toLocaleString('fr-FR') + ' €'; };
  var valeur = function (nom) { var c = $('input[name="' + nom + '"]:checked'); return c ? c.value : ''; };

  app.classList.add('co-js');
  var etapes = [].slice.call(form.querySelectorAll('.co-etape'));

  /* ---------- le calcul ---------- */
  function calculer() {
    var site = valeur('site');
    var avecSite = site && site !== 'aucun' && site !== 'mesure';
    var lignes = [], une = 0, mois = 0, eco = 0;

    var cSite = $('input[name="site"]:checked');
    if (site === 'mesure') lignes.push(['Projet sur mesure', 'sur devis']);
    else if (avecSite) { une += +cSite.dataset.une; lignes.push([cSite.dataset.libelle, euros(+cSite.dataset.une)]); }

    var commande = $('input[name="commande"]');
    commande.closest('.co-option').hidden = site !== 'restaurant';
    var avecCommande = site === 'restaurant' && commande.checked;
    if (avecCommande) { une += 200; lignes.push(['Prise de commande en ligne', euros(200)]); }

    var vitrine = site === 'vitrine';
    var sans = $('input[name="suivi"][value="sans"]');
    sans.disabled = !vitrine;
    $('[data-sans-indispo]').hidden = vitrine;
    if (!vitrine && sans.checked) $('input[name="suivi"][value="abonnement"]').checked = true;
    var grandAbo = site === 'boutique' || avecCommande;
    $('[data-mois-boutique]').hidden = !grandAbo;

    if (avecSite) {
      if (valeur('suivi') === 'sans') {
        une += 200;
        lignes[0] = ['Site vitrine sans abonnement', euros(290)];
        lignes.push(['Modifications ensuite', '30 € l’intervention']);
      } else {
        var abo = grandAbo ? 79 : 49;
        mois += abo;
        lignes.push(['Abonnement du site', euros(abo) + '/mois']);
      }
    }

    var cFiche = $('input[name="fiche"]:checked');
    if (cFiche) {
      if (cFiche.value === 'moi') eco += 90;
      if (+cFiche.dataset.une || +cFiche.dataset.mois) {
        une += +cFiche.dataset.une; mois += +cFiche.dataset.mois;
        lignes.push([cFiche.value === 'gestion' ? 'Fiche Google : création + gestion' : 'Fiche Google : création',
          [euros(+cFiche.dataset.une), +cFiche.dataset.mois ? euros(+cFiche.dataset.mois) + '/mois' : ''].filter(Boolean).join(' + ')]);
      }
    }

    var imp = $('input[name="impression"]');
    if (imp.checked) { une += 149; lignes.push(['Pack impression', euros(149)]); }

    // Le ticket de la derniere etape
    var ul = document.getElementById('co-lignes');
    ul.innerHTML = '';
    if (!lignes.length) {
      var vide = document.createElement('li'); vide.className = 'co-vide';
      vide.textContent = 'Rien de sélectionné pour l’instant.'; ul.appendChild(vide);
    }
    lignes.forEach(function (l) {
      var li = document.createElement('li');
      var a = document.createElement('span'); a.textContent = l[0];
      var b = document.createElement('b'); b.textContent = l[1];
      li.appendChild(a); li.appendChild(b); ul.appendChild(li);
    });
    document.getElementById('co-une').textContent = site === 'mesure' && une === 0 ? 'sur devis' : euros(une);
    document.getElementById('co-mois').textContent = mois ? euros(mois) : 'aucun';

    // Le panier du bas, avec les chiffres qui defilent
    animer(document.getElementById('co-mini-une'), une, site === 'mesure' && une === 0 ? 'sur devis' : null, '');
    animer(document.getElementById('co-mini-mois'), mois, mois ? null : 'aucun', '/mois');
    var e = document.getElementById('co-mini-eco');
    e.hidden = !eco;
    e.textContent = eco ? 'Vous économisez ' + euros(eco) : '';

    // L'etape « apres la mise en ligne » n'existe que s'il y a un site
    etapes.forEach(function (et) { if (et.hasAttribute('data-si-site')) et.dataset.saut = avecSite ? '' : '1'; });

    return { lignes: lignes, une: une, mois: mois };
  }

  var valeurs = new WeakMap();
  function animer(el, cible, texteFixe, suffixe) {
    if (texteFixe) { el.textContent = texteFixe; valeurs.set(el, 0); return; }
    var depart = valeurs.has(el) ? valeurs.get(el) : 0;
    valeurs.set(el, cible);
    if (calme || depart === cible) { el.textContent = euros(cible) + suffixe; return; }
    el.classList.remove('co-pop'); void el.offsetWidth; el.classList.add('co-pop');
    var t0 = performance.now(), duree = 450;
    (function pas(t) {
      var k = Math.min(1, (t - t0) / duree), q = 1 - Math.pow(1 - k, 3);
      el.textContent = euros(depart + (cible - depart) * q) + suffixe;
      if (k < 1) requestAnimationFrame(pas);
    })(t0);
  }

  /* ---------- les etapes ---------- */
  function visibles() { return etapes.filter(function (e) { return e.dataset.saut !== '1'; }); }
  function active() { return etapes.filter(function (e) { return e.classList.contains('co-active'); })[0]; }

  function montrer(i, versLaGauche) {
    var liste = visibles();
    var n = Math.max(0, Math.min(i, liste.length - 1));
    etapes.forEach(function (e) { e.classList.remove('co-active', 'co-depuis-gauche'); });
    // Les numeros suivent les etapes reellement presentees : sans site,
    // l'etape « apres la mise en ligne » disparait et tout se decale.
    liste.forEach(function (x, k) { x.querySelector('.co-num').textContent = k + 1; });
    var e = liste[n];
    e.classList.add('co-active');
    if (versLaGauche) e.classList.add('co-depuis-gauche');
    e.querySelector('[data-retour]').hidden = n === 0;
    document.getElementById('co-etape-n').textContent = 'Étape ' + (n + 1);
    document.getElementById('co-etape-total').textContent = liste.length;
    document.getElementById('co-barre').style.width = Math.round((n + 1) / liste.length * 100) + '%';
    var haut = app.getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > haut) window.scrollTo({ top: haut, behavior: calme ? 'auto' : 'smooth' });
    var titre = e.querySelector('legend');
    titre.setAttribute('tabindex', '-1');
    titre.focus({ preventScroll: true });
  }
  function suivante() { calculer(); var l = visibles(); montrer(l.indexOf(active()) + 1); }
  function precedente() { var l = visibles(); montrer(l.indexOf(active()) - 1, true); }

  form.addEventListener('click', function (e) {
    if (e.target.closest('[data-suivant]')) { e.preventDefault(); suivante(); }
    if (e.target.closest('[data-retour]')) { e.preventDefault(); precedente(); }
  });

  /* Toucher une carte suffit : on passe a la suite, comme dans une
     appli. Sauf si la carte ouvre une option (restaurant) ou se coche
     (impression) : le client a encore quelque chose a faire ici. */
  var minuteur = null;
  form.addEventListener('change', function (e) {
    calculer();
    var t = e.target;
    if (t.type !== 'radio' || t.hasAttribute('data-reste')) return;
    clearTimeout(minuteur);
    minuteur = setTimeout(suivante, calme ? 0 : 420);
  });

  /* Toucher la carte deja choisie (le choix par defaut) doit aussi
     faire avancer : sinon le client tape et rien ne se passe. */
  form.addEventListener('click', function (e) {
    var carte = e.target.closest('.co-carte');
    if (!carte) return;
    var r = carte.querySelector('input[type="radio"]');
    if (r && r.checked && !r.hasAttribute('data-reste') && e.target === r) {
      clearTimeout(minuteur);
      minuteur = setTimeout(suivante, calme ? 0 : 300);
    }
  });

  calculer();
  /* #fiche, #site... dans l'adresse ouvre directement cette etape :
     utile pour envoyer un lien qui va droit au sujet (ex. #fiche a un
     client qui n'a besoin que de sa fiche Google). */
  var cible = location.hash.slice(1);
  var depart = visibles().map(function (e) { return e.dataset.etape; }).indexOf(cible);
  montrer(depart > 0 ? depart : 0);

  /* ---------- l'envoi ---------- */
  var etat = document.getElementById('co-etat');
  var dire = function (t, type) { etat.textContent = t; etat.setAttribute('data-etat', type || ''); };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    if (d.get('site_web')) { fin(); return; }

    var nom = String(d.get('nom') || '').trim();
    var tel = String(d.get('telephone') || '').trim();
    if (!nom || tel.replace(/\D/g, '').length < 9) {
      dire('Indiquez votre nom et votre téléphone pour recevoir le devis.', 'erreur');
      (nom ? form.telephone : form.nom).focus();
      return;
    }

    var r = calculer();
    var texte = [
      'COMPOSER MON OFFRE',
      'Entreprise : ' + (d.get('entreprise') || '—') + ' · ' + (d.get('metier') || '—'),
      'Site actuel : ' + d.get('existant'),
      d.get('email') ? 'E-mail : ' + d.get('email') : '',
      '',
      r.lignes.map(function (l) { return '• ' + l[0] + ' — ' + l[1]; }).join('\n'),
      '',
      'Une fois : ' + euros(r.une) + ' · Par mois : ' + (r.mois ? euros(r.mois) : 'aucun'),
      d.get('message') ? '\nMessage : ' + d.get('message') : '',
    ].filter(function (x) { return x !== ''; }).join('\n');

    var bouton = $('.co-envoyer');
    bouton.disabled = true;
    dire('Envoi en cours…');

    fetch(config.supabaseUrl + '/rest/v1/leads', {
      method: 'POST',
      headers: { apikey: config.supabaseAnonKey, Authorization: 'Bearer ' + config.supabaseAnonKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ client_id: config.clientId, nom: nom, telephone: tel, ville: String(d.get('ville') || '').trim() || null, besoin: 'Composer mon offre', message: texte })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        if (window.gtag) window.gtag('event', 'envoi_formulaire', { formulaire: 'composer_offre' });
        fin();
      })
      .catch(function () { dire('L’envoi n’a pas fonctionné. Appelez-nous directement au 07 45 53 14 34.', 'erreur'); })
      .then(function () { bouton.disabled = false; });
  });

  /* L'ecran de fin, avec une pluie de confettis aux couleurs du site. */
  function fin() {
    etapes.forEach(function (e) { e.hidden = true; });
    app.querySelector('.co-progres').hidden = true;
    var merci = document.getElementById('co-merci');
    merci.hidden = false;
    merci.focus();
    if (!calme) confettis(merci);
  }

  function confettis(hote) {
    var c = document.createElement('canvas');
    c.className = 'co-confettis';
    hote.appendChild(c);
    var ctx = c.getContext('2d'), w = c.width = hote.offsetWidth, h = c.height = hote.offsetHeight + 120;
    var couleurs = ['#D42419', '#FF3B30', '#1D1D1F', '#FFB4AE', '#FF8A80'];
    var p = [];
    for (var i = 0; i < 90; i++) p.push({ x: w / 2, y: h * .35, vx: (Math.random() - .5) * 11, vy: -Math.random() * 10 - 4, r: Math.random() * 6 + 3, c: couleurs[i % couleurs.length], a: Math.random() * 6 });
    var t0 = performance.now();
    (function pas(t) {
      ctx.clearRect(0, 0, w, h);
      p.forEach(function (q) {
        q.vy += .32; q.x += q.vx; q.y += q.vy; q.a += .15;
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a);
        ctx.fillStyle = q.c; ctx.fillRect(-q.r / 2, -q.r / 4, q.r, q.r / 2); ctx.restore();
      });
      if (t - t0 < 2600) requestAnimationFrame(pas); else c.remove();
    })(t0);
  }
})();
