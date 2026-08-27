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
 *
 * **Pourquoi une limite de débit.** Ce jeton partagé est extractible de l'APK, la
 * passation le dit explicitement : il ne prouve rien face à quelqu'un décidé à le sortir
 * du binaire. Sans plafond, ce même jeton rejoué à haut débit épuise le quota Cloudflare
 * et la facture qui va avec, jusqu'à rendre l'échange indisponible pour les vrais
 * lecteurs. Le binding `LIMITEUR` (`wrangler-codes.toml`) borne chaque IP appelante à dix
 * requêtes par minute, avant même la vérification de méthode : aucune requête ne doit
 * pouvoir coûter plus qu'un appel à `limit()`.
 *
 * **Pourquoi la réponse est signée.** Sans signature, quiconque intercepte le trafic de
 * sa propre app — une simple app de proxy, sans jailbreak ni root — peut réécrire
 * `{"jours":30}` en `{"jours":99999}` en clair, et l'app n'a aucun moyen de faire la
 * différence entre ça et une vraie réponse. La signature Ed25519 ferme exactement ce
 * chemin-là : falsifier la réponse demande la clé privée, qui ne quitte jamais ce Worker.
 *
 * Elle ne ferme **pas** tout : un appareil débridé ou un binaire repatché peuvent
 * toujours s'accorder Premium sans jamais appeler ce Worker — même limite que documentée
 * dans `Atelier.swift` pour la bascule de démonstration. Ce n'est pas une frontière de
 * sécurité contre un appareil hostile, seulement ce qui rend un plafond de distribution
 * réel plutôt qu'indicatif face à l'attaque la plus accessible : intercepter et modifier
 * sa propre requête réseau.
 */
export default {
  async fetch(request, env) {
    // Voir « Pourquoi une limite de débit » en tête de fichier. La clé est l'IP et non
    // le jeton partagé : deux appelants qui partagent le même jeton (extrait du même
    // APK) restent deux débits distincts, alors que grouper sur le jeton aurait plafonné
    // tous les lecteurs légitimes ensemble à dix requêtes par minute, tous appareils
    // confondus.
    const ip = request.headers.get('CF-Connecting-IP') || 'sans-ip';
    const { success } = await env.LIMITEUR.limit({ key: ip });
    if (!success) {
      return reponse({ erreur: 'trop de requêtes' }, 429);
    }

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

    // `JSON.parse('null')` réussit et renvoie `null` : un corps JSON syntaxiquement
    // valide mais qui n'est pas un objet. Sans cette garde, `corps.code` deux lignes
    // plus bas lève une TypeError non rattrapée et le client reçoit un 500 là où un
    // simple 400 est la bonne réponse à un corps mal formé.
    if (typeof corps !== 'object' || corps === null) {
      return reponse({ erreur: 'corps invalide' }, 400);
    }

    // Tirets et espaces retirés avant la comparaison : la doc de création
    // (`passation-codes.md`) donne « ANAG-XXXX-XXXX » comme convention de lecture, et
    // ni l'app iOS ni l'app Android ne les retirent avant d'envoyer la saisie du
    // lecteur. Le code stocké en base ne contient jamais ces caractères non plus (même
    // doc) : la forme canonique est décidée par le Worker, pas par la saisie, et la
    // comparaison SQL plus bas reste une égalité exacte sur une seule forme, pas une
    // recherche sur deux.
    const code = String(corps.code || '')
      .trim()
      .toUpperCase()
      .replace(/[\s-]/g, '');
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

    const horodatage = Math.floor(Date.now() / 1000);
    const signature = await signer(env, `${code}|${ligne.jours}|${horodatage}`);

    return reponse({ jours: ligne.jours, horodatage, signature }, 200);
  },
};

/**
 * Signe `code|jours|horodatage` en Ed25519. L'horodatage entre dans le message pour
 * une seule raison : sans lui, une réponse valide capturée une fois — sur un réseau
 * public, par exemple, sans accès à l'appareil qui l'a reçue — resterait rejouable pour
 * toujours. L'app refuse un horodatage trop ancien (`CodePromo`, des deux côtés).
 *
 * La clé privée (PKCS8 DER, base64) vit dans `~/.anagnosis/signature-codes-privee.pem`
 * et dans ce seul secret Cloudflare — jamais dans un dépôt.
 */
async function signer(env, message) {
  const derBrut = Uint8Array.from(atob(env.CLE_SIGNATURE), (c) => c.charCodeAt(0));
  const cle = await crypto.subtle.importKey(
    'pkcs8', derBrut, { name: 'Ed25519' }, false, ['sign']);
  const signature = await crypto.subtle.sign(
    'Ed25519', cle, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function reponse(corps, status) {
  return new Response(JSON.stringify(corps), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
