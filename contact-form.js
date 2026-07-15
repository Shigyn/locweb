// Remplace Netlify Forms : écrit directement dans la table `contacts_locweb` Supabase.
// Ne touche pas au design ni aux champs existants (prénom, téléphone, RGPD).
(function () {
  const SUPABASE_URL = 'https://ibqawtgnucakzdldnitj.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_rpLrUo4Cqnfl8zSohDqO0A_Q5Vkj2Hk';

  document.querySelectorAll('form[data-netlify]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      const originalLabel = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';

      const payload = {
        prenom: form.querySelector('[name=prenom]').value,
        telephone: form.querySelector('[name=telephone]').value,
        rgpd: form.querySelector('[name=rgpd]').checked,
        source: form.getAttribute('name')
      };

      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts_locweb`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Supabase ' + res.status);
        btn.textContent = 'Merci, on vous rappelle vite !';
        form.reset();
      } catch (err) {
        btn.textContent = "Erreur, réessayez ou appelez-nous";
        btn.disabled = false;
        console.error(err);
      }
    });
  });
})();
