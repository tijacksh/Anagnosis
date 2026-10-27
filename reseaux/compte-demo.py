#!/usr/bin/env python3
"""Compte de démonstration pour le tournage : état du lecteur écrit dans le simulateur.

    compte-demo.py preparer   Premium, six disciplines, début six semaines plus tôt,
                              programme effacé pour que l'app le recalcule au lancement
    compte-demo.py lire       remplit le journal : chaque jour du programme lu, sauf deux,
                              quiz fait un jour sur deux

N'écrit que dans le simulateur de tournage (~/.anagnosis/tournage.env), jamais dans l'app.
"""
import json, subprocess, sys, datetime as dt, pathlib
SIM = dict(l.split('=', 1) for l in (pathlib.Path.home()/'.anagnosis/tournage.env').read_text().split())['TOURNAGE_SIM']
ID, CLE = 'com.tijack.anagnosis', 'anagnosis.etat.v1'

import plistlib
# Les préférences de l'app vivent dans son conteneur, pas dans le domaine global du
# simulateur. On écrit le fichier app arrêtée, puis on redémarre le simulateur : cfprefsd
# garde sinon sa propre copie et réécrirait par-dessus (CLAUDE.md de l'app).
def fichier():
    c = subprocess.run(['xcrun','simctl','get_app_container',SIM,ID,'data'],capture_output=True,text=True,check=True).stdout.strip()
    return pathlib.Path(c)/'Library/Preferences'/f'{ID}.plist'

def lire():
    return json.loads(plistlib.loads(fichier().read_bytes())[CLE])

def ecrire(etat):
    subprocess.run(['xcrun','simctl','terminate',SIM,ID],capture_output=True)
    f = fichier(); d = plistlib.loads(f.read_bytes())
    d[CLE] = json.dumps(etat, ensure_ascii=False).encode()
    subprocess.run(['xcrun','simctl','shutdown',SIM],capture_output=True)
    f.write_bytes(plistlib.dumps(d, fmt=plistlib.FMT_BINARY))
    # Laissé éteint : le tournage le rallume, et allumé pour rien il garde mémoire et processeur.

subprocess.run(['xcrun','simctl','boot',SIM],capture_output=True)   # le conteneur ne se lit qu'allumé
subprocess.run(['xcrun','simctl','bootstatus',SIM],capture_output=True)
e = lire()
if sys.argv[1] == 'preparer':
    e.update(premium=True, onboarde=True, materiau='riso',
             disciplines=['philosophie','psychologie','physique','biologie','histoire','litterature'],
             debut=(dt.date.today()-dt.timedelta(days=41)).isoformat())
    e['programme'] = {}; e['journal'] = {}
else:
    prog = sorted(i for i in e['programme'].items() if i[0] >= e['debut'])
    manques = {prog[len(prog)//3][0], prog[2*len(prog)//3][0]}
    e['journal'] = {j: {'conceptID': c, 'quiz': i % 2} for i, (j, c) in enumerate(prog)
                    if j not in manques and e['debut'] <= j <= dt.date.today().isoformat()}
    e['record'] = 19
ecrire(e)
print(sys.argv[1], 'jours au programme :', len(e.get('programme', {})), 'lus :', len(e.get('journal', {})))
