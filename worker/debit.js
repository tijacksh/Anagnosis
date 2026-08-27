/**
 * Compte-tours par IP et par portée, en D1 — remplace le binding `Rate Limit` natif de
 * Cloudflare.
 *
 * **Pourquoi pas le binding natif.** Écrit et configuré à la lettre de la documentation
 * (`env.LIMITEUR.limit({ key })`, `[[ratelimits]]` dans `wrangler.toml`), il ne limitait
 * pourtant rien : `wrangler tail` montre `success: true` sur quinze requêtes envoyées en
 * cinq secondes, et encore après cinq minutes d'attente. Le code et la configuration
 * suivent le contrat documenté ; la panne est côté plateforme, constatée en direct, pas
 * une erreur d'implémentation ici. Le mécanisme qui suit reprend le motif déjà éprouvé
 * du compteur d'usage des codes (`codes.js` : `UPDATE ... WHERE utilises < max`,
 * atomique) : une fenêtre fixe, un compteur en D1, la même base de données que `codes`.
 *
 * **Fenêtre fixe, pas glissante.** Un lecteur peut donc consommer son quota juste avant
 * la fin d'une fenêtre et de nouveau juste après — un débit instantané un peu plus haut
 * que `limite / periode` au moment de la bascule. Sans conséquence ici : la vraie
 * protection reste la longueur et le hasard des codes eux-mêmes, ceci n'est qu'une
 * défense contre l'épuisement de quota par rejeu du jeton partagé, pas la barrière
 * principale.
 */
export async function autorise(env, portee, ip, limite, periode) {
  const fenetre = Math.floor(Date.now() / 1000 / periode);
  const cle = `${portee}:${ip}`;
  const ligne = await env.DB.prepare(
    `INSERT INTO debit (cle, fenetre, compte) VALUES (?, ?, 1)
     ON CONFLICT(cle) DO UPDATE SET
       compte = CASE WHEN debit.fenetre = ? THEN debit.compte + 1 ELSE 1 END,
       fenetre = ?
     RETURNING compte`
  ).bind(cle, fenetre, fenetre, fenetre).first();
  return ligne.compte <= limite;
}
