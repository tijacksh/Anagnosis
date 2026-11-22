#!/usr/bin/env python3
"""Verifie que chaque texte francais d'un fragment existait tel quel dans le code d'origine (pas de faute de recopie).
Usage : verifier_fr.py <fragment.json> <depot iOS> <depot Android> [<reference git, defaut feat/langue-anglais>]
Lit les sources de la REFERENCE git (pas l'arbre de travail) ; un texte avec jetons {x} est coupe aux jetons, chaque morceau de 3 caracteres ou plus doit se trouver dans les sources."""
import sys, json, re, subprocess
frag, ios, android = sys.argv[1:4]; ref = sys.argv[4] if len(sys.argv) > 4 else 'i18n-base'
def corpus(repo, exts):
    files = subprocess.run(['git', '-C', repo, 'ls-tree', '-r', '--name-only', ref], capture_output=True, text=True).stdout.split()
    out = []
    for f in files:
        if f.endswith(exts) and 'Chaines' not in f:
            out.append(subprocess.run(['git', '-C', repo, 'show', f'{ref}:{f}'], capture_output=True, text=True).stdout)
    t = "\n".join(out)
    t = t.replace('\\"', '"').replace("\\'", "'").replace('\\n', '\n').replace('\\u2019', '’').replace('\\u00a0', ' ')
    # interpolations : \(x) Swift, ${x} et $x Kotlin -> coupure
    t = re.sub(r'\\\([^)]*\)|\$\{[^}]*\}|\$[A-Za-z_]\w*', '\x00', t)
    return t
c = corpus(ios, ('.swift',)) + "\n" + corpus(android, ('.kt',))
d = json.load(open(frag)); mauvais = 0
for k, v in d.items():
    if k.startswith('_'): continue
    fr = v['fr']; textes = list(fr.values()) if isinstance(fr, dict) else [fr]
    for t in textes:
        for morceau in re.split(r'\{[^}]*\}', t):
            m = morceau.strip()
            if len(m) >= 3 and m not in c:
                print(f"ABSENT du code d'origine : {k} : {m!r}"); mauvais += 1
print("fragment", frag, ":", "OK" if not mauvais else f"{mauvais} texte(s) à revoir")
sys.exit(1 if mauvais else 0)
