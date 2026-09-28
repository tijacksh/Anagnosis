#!/bin/sh
# Installe les deux tâches launchd de la chaîne réseaux (docs/reseaux.md §4) :
# preparer.py le dimanche à 20 h, deposer.py chaque jour à 7 h 30. Un Mac endormi à
# l'heure dite les lance à son réveil.
set -eu
DEPOT=$(cd "$(dirname "$0")/.." && pwd)
MEDIAS=${ANAGNOSIS_MEDIAS:-$HOME/Anagnosis-medias}
mkdir -p "$MEDIAS/logs"
for J in preparer deposer; do
  CIBLE="$HOME/Library/LaunchAgents/fr.anagnosis.reseaux.$J.plist"
  sed -e "s#__DEPOT__#$DEPOT#g" -e "s#__MEDIAS__#$MEDIAS#g" "$DEPOT/reseaux/fr.anagnosis.reseaux.$J.plist" > "$CIBLE"
  launchctl bootout "gui/$(id -u)/fr.anagnosis.reseaux.$J" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$CIBLE"
  echo "installé : fr.anagnosis.reseaux.$J"
done
