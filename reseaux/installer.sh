#!/bin/sh
# Installe les trois tâches launchd de la chaîne réseaux (docs/reseaux.md §4) :
# preparer.py le dimanche à 20 h, deposer.py chaque jour à 7 h 30 et 18 h 30, verifier.py chaque
# jour à 9 h et 20 h 30, et le dimanche à 21 h 30. Un Mac endormi à l'heure dite les lance à son réveil.
set -eu
DEPOT=$(cd "$(dirname "$0")/.." && pwd)
# Les journaux et le dossier de travail restent **sur le disque interne** : depuis que les
# dépôts vivent sur le SSD externe (2026-10-21), launchd refuse de lancer une tâche dont le
# journal ou le dossier de travail est sur un volume externe (« spawn failed », code 78), alors
# que python3, lui, y lit sans peine. Les scripts passent leur `cwd` eux-mêmes.
LOGS=$HOME/Library/Logs/anagnosis-reseaux
mkdir -p "$LOGS"
for J in preparer deposer verifier; do
  CIBLE="$HOME/Library/LaunchAgents/fr.anagnosis.reseaux.$J.plist"
  sed -e "s#__DEPOT__#$DEPOT#g" -e "s#__LOGS__#$LOGS#g" "$DEPOT/reseaux/fr.anagnosis.reseaux.$J.plist" > "$CIBLE"
  launchctl bootout "gui/$(id -u)/fr.anagnosis.reseaux.$J" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$CIBLE"
  echo "installé : fr.anagnosis.reseaux.$J"
done
