/**
 * Requêtes partielles (`Range`) pour les vidéos de la vitrine.
 *
 * Les fichiers statiques de Workers répondent 200 avec le fichier entier même quand le
 * navigateur demande une plage ; Safari sur iPhone refuse alors de lire la vidéo (il
 * exige un 206). Les MP4 passent donc par le Worker (`run_worker_first`), qui découpe
 * lui-même la plage dans le fichier servi par ASSETS. Les vidéos font quelques Mo :
 * les charger en mémoire pour en rendre un morceau reste raisonnable.
 */

/**
 * `bytes=a-b`, `bytes=a-` ou `bytes=-n` → [début, fin] inclusifs ; `'hors'` si la plage
 * tombe hors du fichier (416) ; null si l'en-tête est illisible ou multi-plages, auquel
 * cas la norme (RFC 9110 §14.2) demande de l'ignorer et de rendre le fichier entier.
 */
export function lirePlage(entete, taille) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((entete ?? '').trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let debut;
  let fin;
  if (m[1] === '') {
    const n = Number(m[2]);
    if (n === 0) return 'hors';
    debut = Math.max(0, taille - n);
    fin = taille - 1;
  } else {
    debut = Number(m[1]);
    fin = m[2] === '' ? taille - 1 : Math.min(Number(m[2]), taille - 1);
    if (m[2] !== '' && Number(m[2]) < debut) return null;
  }
  return debut <= fin && debut < taille ? [debut, fin] : 'hors';
}

/**
 * Rend `reponse` (fichier entier) telle quelle, ou la plage demandée en 206 / 416.
 * `If-Range` qui ne correspond plus à l'ETag (vidéo remplacée en cours de lecture) :
 * fichier entier, pour ne jamais recoller des morceaux de deux versions.
 */
export async function servirPlage(request, reponse) {
  const headers = new Headers(reponse.headers);
  headers.set('Accept-Ranges', 'bytes');
  const entete = request.headers.get('Range');
  const siPlage = request.headers.get('If-Range');
  const perime = siPlage !== null && siPlage !== reponse.headers.get('ETag');
  if (!entete || perime || reponse.status !== 200) {
    return new Response(reponse.body, { status: reponse.status, headers });
  }
  const octets = await reponse.arrayBuffer();
  const taille = octets.byteLength;
  const plage = lirePlage(entete, taille);
  if (plage === null) {
    return new Response(request.method === 'HEAD' ? null : octets, { status: 200, headers });
  }
  headers.delete('Content-Encoding');
  if (plage === 'hors') {
    headers.set('Content-Range', `bytes */${taille}`);
    headers.delete('Content-Length');
    return new Response(null, { status: 416, headers });
  }
  const [debut, fin] = plage;
  headers.set('Content-Range', `bytes ${debut}-${fin}/${taille}`);
  headers.set('Content-Length', String(fin - debut + 1));
  const corps = request.method === 'HEAD' ? null : octets.slice(debut, fin + 1);
  return new Response(corps, { status: 206, headers });
}
