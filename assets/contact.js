/* =====================================================================
   LOCWEB — le formulaire de contact.

   Il ecrit directement dans la table `leads` de Supabase, comme les
   sites clients : la demande apparait dans le tableau de bord LocWeb.
   Seules les colonnes deja utilisees par les autres sites sont
   envoyees (nom, telephone, ville, besoin, message) ; l'e-mail, s'il
   est donne, est ajoute en tete du message plutot que dans une
   colonne dont l'existence n'est pas verifiee.

   En cas d'echec, le message propose le telephone : une demande perdue
   en silence est pire qu'un formulaire qui avoue ne pas avoir marche.
   ===================================================================== */
(function () {
  'use strict';

  var form = document.getElementById('form-contact');
  var etat = document.getElementById('etat-contact');
  var config = window.LOCWEB_CONFIG || {};
  if (!form) return;

  function dire(texte, type) {
    etat.textContent = texte;
    etat.setAttribute('data-etat', type || '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);

    if (d.get('site')) { dire('Merci, votre message est bien parti.', 'ok'); form.reset(); return; }

    var nom = String(d.get('nom') || '').trim();
    var tel = String(d.get('telephone') || '').trim();
    if (!nom || tel.replace(/\D/g, '').length < 9) {
      dire('Indiquez votre nom et un numéro de téléphone pour que nous puissions vous rappeler.', 'erreur');
      (nom ? form.telephone : form.nom).focus();
      return;
    }

    var email = String(d.get('email') || '').trim();
    var message = String(d.get('message') || '').trim();
    if (email) message = 'E-mail : ' + email + (message ? '\n\n' + message : '');

    var bouton = form.querySelector('button[type="submit"]');
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
        besoin: String(d.get('besoin') || '').trim() || null,
        message: message || null
      })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.reset();
        dire('Merci, votre message est bien parti. Nous vous rappelons rapidement.', 'ok');
        if (window.gtag) window.gtag('event', 'envoi_formulaire', { formulaire: 'contact' });
      })
      .catch(function () {
        dire('L’envoi n’a pas fonctionné. Appelez-nous directement au 07 45 53 14 34.', 'erreur');
      })
      .then(function () { bouton.disabled = false; });
  });
})();
