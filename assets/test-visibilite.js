/* LOCWEB — le test de visibilite Google. Tout se calcule ici, dans le
   navigateur : aucune reponse n'est envoyee ni enregistree. Sans ce
   script, la page reste une check-list lisible avec tous les conseils. */
(function () {
  'use strict';
  var form = document.getElementById('test-visibilite');
  if (!form) return;
  var resultat = document.getElementById('test-resultat');
  var manque = document.getElementById('test-manque');
  var questions = form.querySelectorAll('.test-q');

  //  Avec le script, les conseils se cachent jusqu'au resultat.
  form.classList.add('test-actif');

  function verdict(score) {
    if (score >= 85) return 'Très bonne base. Votre entreprise a tout pour bien apparaître : entretenez la fiche et les avis chaque mois.';
    if (score >= 60) return 'Des fondations correctes, mais quelques manques vous font perdre des clients face aux concurrents mieux installés.';
    if (score >= 35) return 'Visibilité fragile : une bonne partie des clients qui vous cherchent tombent sur un concurrent. Les conseils ci-dessous sont prioritaires.';
    return 'Votre entreprise est très peu visible sur Google aujourd’hui. Bonne nouvelle : les premières corrections donnent souvent des résultats rapides.';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var score = 0, reponses = 0;
    Array.prototype.forEach.call(questions, function (q) {
      var choix = q.querySelector('input:checked');
      q.classList.remove('test-ok', 'test-ko');
      if (!choix) return;
      reponses++;
      if (choix.value === 'oui') { score += Number(q.getAttribute('data-poids')); q.classList.add('test-ok'); }
      else q.classList.add('test-ko');
    });
    if (reponses < questions.length) {
      manque.hidden = false;
      var premiere = Array.prototype.find.call(questions, function (q) { return !q.querySelector('input:checked'); });
      if (premiere) premiere.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    manque.hidden = true;
    form.classList.add('test-fini');
    document.getElementById('test-score').textContent = score;
    document.getElementById('test-verdict').textContent = verdict(score);
    resultat.hidden = false;
    resultat.focus();
    resultat.scrollIntoView({ behavior: 'smooth', block: 'start' });
    //  Mesure : combien de visiteurs vont au bout, et avec quel score.
    try { if (window.gtag) window.gtag('event', 'test_visibilite', { score: score }); } catch (err) {}
  });

  document.getElementById('test-recommencer').addEventListener('click', function () {
    form.reset();
    form.classList.remove('test-fini');
    Array.prototype.forEach.call(questions, function (q) { q.classList.remove('test-ok', 'test-ko'); });
    resultat.hidden = true;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
