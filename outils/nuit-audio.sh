#!/bin/zsh
# La tâche de nuit de l'audio : sonorise ce qui manque, l'héberge, publie l'index.
#
#   outils/nuit-audio.sh                    une nuit normale (launchd, fr.anagnosis.audio.nuit)
#   NUIT_SANS_PUSH=1 outils/nuit-audio.sh   une nuit de test : tout, sauf le push
#
# Variables (toutes facultatives) :
#   NUIT_DEPOT     le clone dédié à cette tâche   (~/Anagnosis/Anagnosis-audio-nuit)
#   NUIT_BRANCHE   la branche à sonoriser         (main)
#   NUIT_DISTANT   d'où la tirer                  (origin ; un chemin local pour une nuit de test)
#   NUIT_JUSQUA    heure de fin de la génération  (04:30 : Jarvis prend VoiceStudio vers 5 h)
#   NUIT_JOURNAL   le journal                     (~/.anagnosis/journal-audio.log)
#
# Garanties :
# - Un clone à elle seule : jamais le dépôt où d'autres sessions travaillent.
# - `git pull --ff-only` : jamais de fusion ni d'écrasement. Un push refusé (une routine a
#   poussé entre-temps) se rattrape par `pull --rebase` puis un nouvel essai, jamais par
#   un push forcé. Un commit resté local une nuit part au début de la suivante.
# - Rien n'est publié à moitié : une fiche n'entre dans l'index qu'une fois son master et
#   son dérivé complets ; le manifeste ne publie une voix qu'une fois téléversée, et garde
#   l'ancien son d'une fiche refaite tant que le nouveau n'est pas en ligne. Un `heberger`
#   ou un `npm test` en échec : rien n'est commité, le travail attend la nuit suivante.
# - Lancée après l'heure de fin (un Mac réveillé à 5 h rattrape le rendez-vous manqué),
#   elle ne fait rien : elle ne déborde jamais sur le créneau de Jarvis ni sur la journée.
# - OmniVoice est déchargé à la fin, même en cas d'erreur ou d'arrêt : il partage la machine.

set -u
DEPOT=${NUIT_DEPOT:-$HOME/Anagnosis/Anagnosis-audio-nuit}
BRANCHE=${NUIT_BRANCHE:-main}
DISTANT=${NUIT_DISTANT:-origin}
JUSQUA=${NUIT_JUSQUA:-04:30}
JOURNAL=${NUIT_JOURNAL:-$HOME/.anagnosis/journal-audio.log}
VERROU=${TMPDIR:-/tmp}/anagnosis-audio-nuit.verrou
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

journal() { print -r -- "$(date '+%Y-%m-%d %H:%M:%S') $*" >> "$JOURNAL"; }
echec() { journal "ÉCHEC : $*"; exit 1; }
# Les couleurs de la CLI hors du journal (le `sed` de macOS ne lit pas `\x1b`).
propre() { perl -pe 's/\e\[[0-9;]*m//g; s/^ */  /'; }

mkdir -p "$(dirname "$JOURNAL")" 2>/dev/null || { print -u2 "journal inaccessible : $JOURNAL"; exit 1; }

# Une seule nuit à la fois. Le verrou porte le PID : celui d'une nuit tuée (redémarrage,
# SIGKILL) est reconnu comme périmé et levé, au lieu de bloquer toutes les nuits suivantes.
if ! mkdir "$VERROU" 2>/dev/null; then
  ancien=$(cat "$VERROU/pid" 2>/dev/null)
  if [ -n "$ancien" ] && kill -0 "$ancien" 2>/dev/null; then
    journal "déjà en cours (PID $ancien), on ne relance pas"; exit 0
  fi
  journal "verrou périmé (PID ${ancien:-inconnu} disparu) : levé"
  rm -rf "$VERROU"; mkdir "$VERROU" || echec "verrou $VERROU"
fi
print $$ > "$VERROU/pid"

MIS_DE_COTE=
nettoyer() {
  trap - EXIT INT TERM
  pkill -TERM -P $$ 2>/dev/null
  # Un index mis de côté et pas encore repris (échec entre le stash et le pop) revient dans
  # l'arbre : laissé dans `git stash`, la nuit suivante ne le verrait jamais.
  if [ -n "$MIS_DE_COTE" ]; then
    cd "$DEPOT" 2>/dev/null && git stash pop -q 2>/dev/null || journal "l'index mis de côté reste dans git stash : à reprendre à la main"
  fi
  cd "$DEPOT" 2>/dev/null && node -e 'import("./src/voicestudio.js").then((m) => m.decharger())' >/dev/null 2>&1
  rm -rf "$VERROU"
}
trap nettoyer EXIT
trap 'journal "interrompue (signal)"; exit 2' INT TERM

journal "──── nuit de l'audio (branche $BRANCHE, fin de génération à $JUSQUA${NUIT_SANS_PUSH:+, sans push})"

# 0. La fenêtre : après l'heure de fin, on ne commence pas.
FIN=$(printf '%05s' "$JUSQUA" | tr ' ' 0)
[[ "$(date +%H:%M)" < "$FIN" ]] || { journal "lancée à $(date +%H:%M), après $FIN : rien avant la nuit prochaine"; exit 0; }

# Pousse les commits locaux. Un refus se rattrape par rebase, cinq fois au plus, jamais forcé.
pousser() {
  local essai
  for essai in 1 2 3 4 5; do
    if git push -q "$DISTANT" "HEAD:$BRANCHE"; then journal "poussé (essai $essai)"; return 0; fi
    journal "push refusé (essai $essai) : une routine a poussé entre-temps, on rattrape"
    git pull -q --rebase "$DISTANT" "$BRANCHE" || { git rebase --abort 2>/dev/null; journal "rebase impossible : à reprendre à la main, rien n'a été forcé"; return 2; }
    sleep $((essai * 20))
  done
  journal "push refusé cinq fois : le commit reste local, il partira la nuit suivante"
  return 1
}

# 1. Les disques et le dépôt.
[ -d "$DEPOT/.git" ] || echec "clone introuvable : $DEPOT (SSD 1To monté ?)"
[ -e "$HOME/.cache/huggingface/hub" ] || echec "cache des modèles introuvable (SSD 1To monté ?)"
cd "$DEPOT" || echec "cd $DEPOT"
git fetch -q "$DISTANT" "$BRANCHE" || echec "git fetch"
git checkout -q "$BRANCHE" 2>/dev/null || git checkout -q -b "$BRANCHE" FETCH_HEAD || echec "git checkout $BRANCHE"

# L'index d'une nuit qui n'a pas pu publier (test ou hébergement en échec) : gardé, mis de
# côté le temps de tirer, puis repris. Toute autre modification est anormale.
rm -f audio/index.json.*.tmp(N)   # l'écriture d'un index interrompue en route
AUTRES=$(git status --porcelain | grep -v ' audio/index.json$')
[ -z "$AUTRES" ] || echec "le clone a des modifications hors de audio/index.json, à regarder à la main : $AUTRES"
REMIS=
if ! git diff --quiet -- audio/index.json; then
  git stash push -q -m "nuit-audio $(date +%F)" -- audio/index.json || echec "git stash"
  REMIS=1; MIS_DE_COTE=1
  journal "index non publié d'une nuit précédente : mis de côté, repris après la mise à jour"
fi

# Un commit qu'une nuit précédente n'a pas pu pousser part d'abord.
EN_ATTENTE=$(git rev-list --count FETCH_HEAD..HEAD 2>/dev/null || echo 0)
if [ "$EN_ATTENTE" -gt 0 ] && [ -z "${NUIT_SANS_PUSH:-}" ]; then
  journal "$EN_ATTENTE commit(s) d'une nuit précédente à pousser"
  pousser || echec "commits précédents toujours pas poussés"
fi

git pull -q --ff-only "$DISTANT" "$BRANCHE" || echec "git pull --ff-only refusé : la branche locale a divergé, à regarder à la main"
if [ -n "$REMIS" ]; then
  MIS_DE_COTE=
  git stash pop -q || echec "l'index mis de côté ne se réapplique pas (conflit) : il reste dans git stash, à reprendre à la main"
fi
journal "dépôt à jour : $(git log --oneline -1)"

# 2. Les clés (R2) : hors du dépôt, jamais dans le journal.
[ -f "$HOME/.anagnosis/cles.env" ] && { set -a; . "$HOME/.anagnosis/cles.env"; set +a; }

# 3. VoiceStudio.
if ! curl -fs -m 5 http://127.0.0.1:3900/health >/dev/null; then
  journal "VoiceStudio fermé : ouverture"
  open -g /Applications/VoiceStudio.app
  for i in $(seq 1 60); do curl -fs -m 5 http://127.0.0.1:3900/health >/dev/null && break; sleep 5; done
fi
curl -fs -m 5 http://127.0.0.1:3900/health >/dev/null || echec "VoiceStudio ne répond pas"

# 4. La file, puis la génération jusqu'à l'heure de fin.
journal "file : $(node src/cli.js asonoriser 2>&1 | propre | grep -E 'SONORISER|RIEN À FAIRE|introuvable' | sed 's/^ *//')"
node src/cli.js sonoriser --file --jusqua "$FIN" 2>&1 | propre >> "$JOURNAL"
CODE=${pipestatus[1]}
journal "génération terminée (code $CODE)"

# 5. L'hébergement : ce qui a été produit part vers R2. Un échec : on ne publie rien.
node src/cli.js heberger 2>&1 | propre | tail -8 >> "$JOURNAL"
[ "${pipestatus[1]}" -eq 0 ] || echec "heberger en échec : l'index n'est pas publié, la nuit suivante reprendra"

# 6. Les tests, avant de publier quoi que ce soit.
if ! npm test --silent > "${TMPDIR:-/tmp}/nuit-audio-tests.log" 2>&1; then
  grep -E '^not ok|✖|Error' "${TMPDIR:-/tmp}/nuit-audio-tests.log" | head -10 | propre >> "$JOURNAL"
  echec "npm test en échec : l'index n'est pas publié"
fi

# 7. L'index : commit, puis push (sauf nuit de test).
if git diff --quiet -- audio/index.json; then
  journal "index inchangé : rien à publier"
  exit 0
fi
FAITES=$(node -e 'const a = JSON.parse(require("child_process").execSync("git show HEAD:audio/index.json")); const b = JSON.parse(require("fs").readFileSync("audio/index.json")); console.log(Object.keys(b).filter((k) => b[k].produit_le !== a[k]?.produit_le).length)')
git add audio/index.json
git commit -q -m "Audio : $FAITES fiche(s) sonorisée(s) en local

Tâche de nuit (outils/nuit-audio.sh), moteur OmniVoice, voix en rotation.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || echec "git commit"
journal "commit : $(git log --oneline -1)"

if [ -n "${NUIT_SANS_PUSH:-}" ]; then
  journal "nuit de test : pas de push"
  exit 0
fi
pousser || exit 1
