/**
 * Échange un code promotionnel contre des jours de Premium, une fois pour chaque
 * utilisation autorisée — jamais plus.
 *
 * **Pourquoi un Worker et pas un mécanisme purement local.** Un plafond d'utilisations
 * n'a de sens que compté à travers tous les appareils à la fois : aucune app installée
 * isolément ne peut savoir combien de fois un code a déjà servi ailleurs. La seule façon
 * de le garantir est un compteur unique, quelque part, incrémenté de façon atomique.
 *
 * **Pourquoi D1 et pas KV pour ce compteur.** KV ne offre aucune opération
 * lire-puis-écrire atomique : deux requêtes simultanées liraient toutes deux
 * `utilises = max - 1`, l'accepteraient toutes deux, et le plafond serait dépassé de un.
 * D1 est du vrai SQL — `UPDATE ... WHERE utilises < max` n'affecte jamais plus de lignes
 * que le plafond ne l'autorise, même sous deux tentatives au même instant. C'est ce qui
 * rend la limite réelle, et pas seulement probable la plupart du temps.
 *
 * **Le même jeton partagé que `audio.js`** (`X-Anagnosis-Cle`) : pas une preuve d'identité,
 * seulement ce qui distingue une requête venue de l'app d'un scan anonyme. Les codes
 * eux-mêmes sont la vraie protection — assez longs et aléatoires pour ne pas se deviner.
 */
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('méthode refusée', { status: 405 });
    }

    const cle = request.headers.get('X-Anagnosis-Cle');
    if (!cle || cle !== env.CLE_PARTAGEE) {
      return new Response('non autorisé', { status: 401 });
    }

    let corps;
    try {
      corps = await request.json();
    } catch {
      return reponse({ erreur: 'corps invalide' }, 400);
    }

    const code = String(corps.code || '').trim().toUpperCase();
    // La forme est vérifiée avant l'appel D1 : un essai au hasard qui ne ressemble à
    // rien de connu n'a aucune raison de toucher la base.
    if (!/^[A-Z0-9]{6,20}$/.test(code)) {
      return reponse({ erreur: 'invalide' }, 400);
    }

    const ligne = await env.DB.prepare(
      'SELECT max, utilises, jours FROM codes WHERE code = ?'
    ).bind(code).first();

    if (!ligne) return reponse({ erreur: 'inconnu' }, 404);
    if (ligne.utilises >= ligne.max) return reponse({ erreur: 'epuise' }, 410);

    const resultat = await env.DB.prepare(
      'UPDATE codes SET utilises = utilises + 1 WHERE code = ? AND utilises < max'
    ).bind(code).run();

    // Personne d'autre n'a pu passer entre la lecture et l'écriture : la clause WHERE
    // porte la garantie, pas la vérification qui précède — celle-ci n'est là que pour
    // répondre vite dans le cas courant.
    if (resultat.meta.changes === 0) return reponse({ erreur: 'epuise' }, 410);

    return reponse({ jours: ligne.jours }, 200);
  },
};

function reponse(corps, status) {
  return new Response(JSON.stringify(corps), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
