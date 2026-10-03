/* =====================================================================
   LOCWEB — « Composer mon offre » : le total en direct, puis l'envoi.

   Les prix sont dans les attributs data-une (une fois) et data-mois
   (par mois) des cases : ce script additionne, il ne connait aucun
   tarif. Deux regles seulement, qui ne tiennent pas dans une case :
     - boutique ou commande en ligne : l'abonnement passe a 79 €/mois ;
     - la formule sans abonnement n'existe que pour le site vitrine.

   L'envoi ecrit dans la table `leads`, comme le formulaire de contact :
   la selection arrive dans le tableau de bord avec son detail chiffre.
   ===================================================================== */
(function () {
  'use strict';

  var form = document.getElementById('composer-offre');
  if (!form) return;
  var config = window.LOCWEB_CONFIG || {};
  var $ = function (s) { return form.querySelector(s); };
  var euros = function (n) { return n.toLocaleString('fr-FR') + ' €'; };

  var blocSuivi = $('[data-si-site]');
  var radioSans = $('input[name="suivi"][value="sans"]');
  var noteSans = $('[data-sans-indispo]');
  var noteMois = $('[data-mois-boutique]');
  var commande = $('input[name="commande"]');

  function valeur(nom) {
    var c = form.querySelector('input[name="' + nom + '"]:checked');
    return c ? c.value : '';
  }

  function calculer() {
    var site = valeur('site');
    var avecSite = site && site !== 'aucun' && site !== 'mesure';
    var lignes = [];
    var une = 0, mois = 0;

    // Le site
    var cSite = form.querySelector('input[name="site"]:checked');
    if (site === 'mesure') lignes.push(['Projet sur mesure', 'sur devis', '']);
    else if (avecSite) {
      une += +cSite.dataset.une;
      lignes.push([cSite.dataset.libelle, euros(+cSite.dataset.une), '']);
    }

    // La commande en ligne n'a de sens que pour le restaurant.
    commande.closest('.co-option').hidden = site !== 'restaurant';
    var avecCommande = site === 'restaurant' && commande.checked;
    if (avecCommande) { une += 200; lignes.push(['Prise de commande en ligne', euros(200), '']); }

    // Le suivi : seulement s'il y a un site a suivre.
    blocSuivi.hidden = !avecSite;
    var vitrine = site === 'vitrine';
    radioSans.disabled = !vitrine;
    noteSans.hidden = vitrine || !avecSite;
    if (!vitrine && radioSans.checked) form.querySelector('input[name="suivi"][value="abonnement"]').checked = true;
    var grandAbo = site === 'boutique' || avecCommande;
    noteMois.hidden = !grandAbo;

    if (avecSite) {
      if (valeur('suivi') === 'sans') {
        // Une seule ligne, au prix reel : « Site vitrine sans abonnement — 290 € ».
        une += 200;
        lignes[0] = ['Site vitrine sans abonnement', euros(290), ''];
        lignes.push(['Modifications ensuite', '', '30 € l’intervention']);
      } else {
        var abo = grandAbo ? 79 : 49;
        mois += abo;
        lignes.push(['Abonnement du site', '', euros(abo) + '/mois']);
      }
    }

    // La fiche Google
    var cFiche = form.querySelector('input[name="fiche"]:checked');
    if (cFiche && (+cFiche.dataset.une || +cFiche.dataset.mois)) {
      une += +cFiche.dataset.une;
      mois += +cFiche.dataset.mois;
      lignes.push([cFiche.dataset.libelle === 'Création + gestion' ? 'Fiche Google : création + gestion' : 'Fiche Google : création',
        euros(+cFiche.dataset.une), +cFiche.dataset.mois ? euros(+cFiche.dataset.mois) + '/mois' : '']);
    }

    // L'impression
    var imp = $('input[name="impression"]');
    if (imp.checked) { une += 149; lignes.push(['Pack impression', euros(149), '']); }

    // Affichage
    var ul = document.getElementById('co-lignes');
    ul.innerHTML = '';
    if (!lignes.length) {
      var vide = document.createElement('li');
      vide.className = 'co-vide';
      vide.textContent = 'Rien de sélectionné pour l’instant.';
      ul.appendChild(vide);
    }
    lignes.forEach(function (l) {
      var li = document.createElement('li');
      var a = document.createElement('span'); a.textContent = l[0];
      var b = document.createElement('b'); b.textContent = [l[1], l[2]].filter(Boolean).join(' + ');
      li.appendChild(a); li.appendChild(b);
      ul.appendChild(li);
    });
    document.getElementById('co-une').textContent = site === 'mesure' && une === 0 ? 'sur devis' : euros(une);
    document.getElementById('co-mois').textContent = mois ? euros(mois) : 'aucun';
    // Le bandeau du bas, sur telephone : le total reste sous les yeux
    // pendant qu'on coche, alors que le recapitulatif est tout en bas.
    document.getElementById('co-mini-une').textContent = document.getElementById('co-une').textContent;
    document.getElementById('co-mini-mois').textContent = document.getElementById('co-mois').textContent;

    return { lignes: lignes, une: une, mois: mois };
  }

  form.addEventListener('change', calculer);
  calculer();

  /* ---------- l'envoi ---------- */
  var etat = document.getElementById('co-etat');
  var dire = function (t, type) { etat.textContent = t; etat.setAttribute('data-etat', type || ''); };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    if (d.get('site_web')) { dire('Merci, votre demande est bien partie.', 'ok'); return; }

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
      r.lignes.map(function (l) { return '• ' + l[0] + ' — ' + [l[1], l[2]].filter(Boolean).join(' + '); }).join('\n'),
      '',
      'Une fois : ' + euros(r.une) + ' · Par mois : ' + (r.mois ? euros(r.mois) : 'aucun'),
      d.get('message') ? '\nMessage : ' + d.get('message') : '',
    ].filter(function (x) { return x !== ''; }).join('\n');

    var bouton = document.querySelector('.co-envoyer');
    bouton.disabled = true;
    dire('Envoi en cours…');

    fetch(config.supabaseUrl + '/rest/v1/leads', {
      method: 'POST',
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: 'Bearer ' + config.supabaseAnonKey,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        client_id: config.clientId,
        nom: nom,
        telephone: tel,
        ville: String(d.get('ville') || '').trim() || null,
        besoin: 'Composer mon offre',
        message: texte
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        dire('Merci ! Votre sélection est bien partie. Nous vous envoyons votre devis rapidement.', 'ok');
        if (window.gtag) window.gtag('event', 'envoi_formulaire', { formulaire: 'composer_offre' });
      })
      .catch(function () {
        dire('L’envoi n’a pas fonctionné. Appelez-nous directement au 07 45 53 14 34.', 'erreur');
      })
      .then(function () { bouton.disabled = false; });
  });
})();
