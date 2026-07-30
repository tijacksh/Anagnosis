# Livraison design — Anagnosis

Direction artistique **C · Risographie**, appliquée aux surfaces principales.

> **Note d'intégration (30 juillet 2026).** Les trois documents de `docs/` ont été
> déplacés à la racine `docs/` du dépôt, comme le recommandait cette livraison. Ils
> font désormais foi sur les valeurs. Seules les maquettes restent ici.

## Contenu

```
maquettes/
  Anagnosis — UX·UI.dc.html   le document de maquettes complet (repères 1a à 1j)
  support.js                  runtime, doit rester à côté du fichier
  ios-frame.jsx               cadre iPhone utilisé par les maquettes
```

Documents déplacés vers `docs/` : `charte-visuelle.md`, `systeme-illustration.md`,
`ecrans.md`.

## Deux réserves à connaître

**Les fiches des maquettes sont fictives.** Au moment du design, la branche `main`
ne contenait que le README : les cinq fiches utilisées (banalité du mal, effet
Doppler, effet Matthieu, Cantor, discours indirect libre, ratio bactéries/cellules)
ont été écrites pour la démonstration. Leurs sources sont réelles, mais ce texte
**n'est jamais passé par le validateur** et ne doit pas alimenter le pipeline. Le
contenu authentique est dans `content/concepts/`.

**Le fichier de maquettes exige une connexion.** Il charge React depuis unpkg.com
et les polices depuis Google Fonts. Il ne s'ouvre donc pas hors ligne, et cessera de
fonctionner le jour où ces sources bougeront.

Ouvrir `maquettes/Anagnosis — UX·UI.dc.html` dans un navigateur (garder les trois
fichiers du dossier ensemble ; les polices sont chargées depuis Google Fonts, donc
une connexion est nécessaire à l'ouverture) : tout est sur une
seule planche, navigable en pan / zoom. Les repères 1a à 1j sont les identifiants
cités dans les trois documents.

## À placer dans le dépôt

Les trois fichiers de `docs/` sont écrits pour être lus par Claude Code en
contexte, à placer tels quels dans `docs/` du dépôt de l'app iOS.
