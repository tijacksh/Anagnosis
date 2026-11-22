#!/usr/bin/env python3
"""Genere les tables de chaines iOS (Swift) et Android/noyau (Kotlin) depuis ui/fragments/*.json.
Usage : generer.py [--ios <racine du depot iOS>] [--android <racine du depot Android>]
Format d'un fragment : {"<id>": {"fr": "...", "en": "...", "note": "contexte"}}  ou, pour un pluriel,
{"<id>": {"fr": {"un": "{n} jour", "autre": "{n} jours"}, "en": {...}, "note": "..."}}.
Jetons : {nom} remplaces a l'execution. Les ids sont uniques sur tous les fragments (erreur sinon).
Regles de pluriel : fr -> 'un' pour 0 et 1 ; en -> 'un' pour 1."""
import json, glob, os, sys, re
U = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[1:]
def opt(n):
    return args[args.index(n) + 1] if n in args else None
ios, android = opt('--ios'), opt('--android')
table = {}
for f in sorted(glob.glob(U + '/fragments/*.json')):
    for k, v in json.load(open(f)).items():
        if k.startswith('_'): continue
        if k in table: sys.exit(f"id en double : {k} ({f})")
        if not re.fullmatch(r'[a-z0-9_]+(\.[a-z0-9_]+)+', k): sys.exit(f"id invalide (minuscules, chiffres, _ et points, au moins un point) : {k}")
        for l in ('fr', 'en'):
            if l not in v: sys.exit(f"{k} : langue {l} absente")
        pl = isinstance(v['fr'], dict)
        if pl != isinstance(v['en'], dict): sys.exit(f"{k} : pluriel dans une langue seulement")
        if pl:
            for l in ('fr', 'en'):
                if set(v[l]) != {'un', 'autre'}: sys.exit(f"{k} : pluriel {l} doit avoir 'un' et 'autre'")
        table[k] = v
def sw(s): return json.dumps(s, ensure_ascii=False)
def kt(s): return json.dumps(s, ensure_ascii=False).replace('$', '\\$')
if ios:
    out = ["// GENERE par traduction-en/ui/generer.py depuis ui/fragments/*.json : ne pas modifier a la main.", "// Un id = un texte ; les pluriels portent 'un' et 'autre'. Lecture : Langue.swift (L(...)).", "enum Chaines {",
           "    static let simples: [String: (fr: String, en: String)] = ["]
    for k, v in sorted(table.items()):
        if not isinstance(v['fr'], dict): out.append(f"        {sw(k)}: (fr: {sw(v['fr'])}, en: {sw(v['en'])}),")
    out += ["    ]", "    static let pluriels: [String: (fr: (un: String, autre: String), en: (un: String, autre: String))] = ["]
    for k, v in sorted(table.items()):
        if isinstance(v['fr'], dict):
            out.append(f"        {sw(k)}: (fr: (un: {sw(v['fr']['un'])}, autre: {sw(v['fr']['autre'])}), en: (un: {sw(v['en']['un'])}, autre: {sw(v['en']['autre'])})),")
    out += ["    ]", "}", ""]
    d = os.path.join(ios, 'Anagnosis/Langue'); os.makedirs(d, exist_ok=True); open(d + '/Chaines.swift', 'w').write("\n".join(out)); print("iOS :", len(table), "chaines")
if android:
    out = ["// GENERE par traduction-en/ui/generer.py depuis ui/fragments/*.json : ne pas modifier a la main.", "package fr.anagnosis.langue", "",
           "object Chaines {", "    val simples: Map<String, Pair<String, String>> = mapOf("]
    for k, v in sorted(table.items()):
        if not isinstance(v['fr'], dict): out.append(f"        {kt(k)} to Pair({kt(v['fr'])}, {kt(v['en'])}),")
    out += ["    )", "    /** id -> (fr un, fr autre, en un, en autre) */", "    val pluriels: Map<String, List<String>> = mapOf("]
    for k, v in sorted(table.items()):
        if isinstance(v['fr'], dict):
            out.append(f"        {kt(k)} to listOf({kt(v['fr']['un'])}, {kt(v['fr']['autre'])}, {kt(v['en']['un'])}, {kt(v['en']['autre'])}),")
    out += ["    )", "}", ""]
    d = os.path.join(android, 'core/src/main/kotlin/fr/anagnosis/langue'); os.makedirs(d, exist_ok=True); open(d + '/Chaines.kt', 'w').write("\n".join(out)); print("Android :", len(table), "chaines")
if not ios and not android: print(len(table), "chaines valides")
