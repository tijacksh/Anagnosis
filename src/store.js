/**
 * Accès disque à la base de connaissance.
 *
 * Une fiche = un fichier JSON sous content/concepts/<discipline>/<slug>.json.
 * Écriture atomique (tmp + rename) : l'outil Admin écrit pendant qu'un
 * `npm run validate` peut tourner en parallèle.
 */
import { readFile, writeFile, readdir, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');
export const CONTENT_DIR = path.join(ROOT, 'content', 'concepts');

/** @returns {Promise<string[]>} chemins absolus de toutes les fiches */
export async function listFichePaths() {
  if (!existsSync(CONTENT_DIR)) return [];
  const out = [];
  for (const discipline of await readdir(CONTENT_DIR, { withFileTypes: true })) {
    if (!discipline.isDirectory()) continue;
    const dir = path.join(CONTENT_DIR, discipline.name);
    for (const f of await readdir(dir)) {
      if (f.endsWith('.json')) out.push(path.join(dir, f));
    }
  }
  return out.sort();
}

export async function loadAll() {
  const paths = await listFichePaths();
  const fiches = [];
  for (const p of paths) {
    try {
      const fiche = JSON.parse(await readFile(p, 'utf8'));
      fiche._path = p;
      fiches.push(fiche);
    } catch (err) {
      // Un JSON cassé ne doit pas faire tomber tout l'outil : on le remonte
      // comme une fiche en erreur pour qu'il soit visible dans la file.
      fiches.push({
        id: path.basename(p, '.json'),
        titre: `⚠ JSON illisible : ${path.basename(p)}`,
        _path: p,
        _parseError: err.message,
        statut: 'brouillon',
        discipline: path.basename(path.dirname(p)),
      });
    }
  }
  return fiches;
}

export async function loadById(id) {
  const all = await loadAll();
  return all.find((f) => f.id === id) ?? null;
}

export async function save(fiche) {
  const target = fiche._path ?? path.join(CONTENT_DIR, fiche.discipline, `${fiche.slug}.json`);
  await mkdir(path.dirname(target), { recursive: true });

  const { _path, _parseError, ...clean } = fiche;
  const tmp = `${target}.tmp`;
  await writeFile(tmp, `${JSON.stringify(clean, null, 2)}\n`, 'utf8');
  await rename(tmp, target);

  return { ...clean, _path: target };
}

/**
 * Applique une décision de relecture et journalise la transition.
 * L'historique reste dans la fiche : lisible en diff git, pas de table à part.
 */
export function appliquerDecision(fiche, { statut, action, note, par, quand }) {
  const validation = fiche.validation ?? { decide_par: null, decide_le: null, historique: [] };
  const historique = [...(validation.historique ?? [])];

  historique.push({
    action,
    de: fiche.statut,
    vers: statut,
    par: par || 'admin',
    le: quand,
    ...(note ? { note } : {}),
  });

  return {
    ...fiche,
    statut,
    validation: { decide_par: par || 'admin', decide_le: quand, historique },
  };
}

export function motsDe(texte = '') {
  return texte
    // Marqueurs de ligne : toujours suivis d'un espace, on les remplace par un espace.
    .replace(/[#>]/g, ' ')
    // Marqueurs d'emphase : collés au mot. Les remplacer par un espace couperait
    // « l'*italique* » en deux mots et gonflerait le décompte.
    .replace(/[*_`]/g, '')
    .split(/\s+/)
    .filter(Boolean).length;
}
