# Audit des cartes par Haiku 5.5 (2026-10-07)

Haiku 5.5 a relu la carte partageable (punch, idée, source courte) des 558 fiches. **193 sont signalées.** Sonnet 5.5 a vérifié un échantillon de 30 alertes : **25 justifiées (83 %)**, donc quelques faux positifs restent possibles ; les alertes `CARTE_HORS_FICHE` sont les moins sûres (10 sur 14 confirmées). Les limites de caractères (punch 100, idée 90-300, source 60) sont respectées partout : **0 violation**.

Ce fichier est une **liste de travail, pas un verdict** : aucune fiche n'a été retirée ni modifiée. Un `✓` marque une alerte confirmée par Sonnet, un `✗` une alerte écartée.

Audit ponctuel, fait par script hors dépôt ; les fiches sont lues dans `content/concepts/`.


## Résumé par type

| Type | Fiches |
|---|---|
| superlatif ou chiffre rond dans la carte (`SUPERLATIF_OU_CHIFFRE_ROND`) | 79 |
| la carte affirme ce que le texte de la fiche ne dit pas (`CARTE_HORS_FICHE`) | 76 |
| crédit de source faible (`SOURCE_FAIBLE`) | 46 |
| l'idée ne se suffit pas sans l'app (`IDEE_NON_AUTONOME`) | 11 |
| teasing creux (`TEASING_CREUX`) | 5 |
| punch coupé (`PUNCH_TRONQUE`) | 1 |

## anthropologie (5)

- `ant-le-crane-qui-changeait-de-forme` : SOURCE_FAIBLE. Le crédit « American Anthropologist, 2003 » n'indique pas d'auteur et ne couvre pas la réanalyse de 2002 que l'idée mentionne aussi.
- `ant-le-culte-ne-du-materiel-americain` ✓ : CARTE_HORS_FICHE. La fiche dit que le mouvement John Frum était « déjà en germe » et que le matériel en coïncide l'essor, alors que la carte affirme qu'il est né de ces tonnes de matériel.
- `ant-le-mythe-du-troc-primitif` : CARTE_HORS_FICHE. La fiche dit qu'aucun ethnographe n'a décrit une économie fondée sur le troc, ce qui n'équivaut pas à affirmer qu'elle n'a jamais existé ; « partout » dans l'idée dépasse aussi ce que la fiche établit.
- `ant-quinze-heures-de-travail-par-semaine` : CARTE_HORS_FICHE. La fiche donne une moyenne d'environ quinze heures par semaine ; « pas plus » affirme un plafond qu'elle ne mentionne pas.
- `ant-une-expression-que-rousseau-na-jamais-ecrite` : SOURCE_FAIBLE. Une lettre de Voltaire de 1755 atteste sa caricature de Rousseau, mais ne permet pas d'établir que l'expression est absente des textes de Rousseau ni la genèse du mythe ; il faut une référence savante.

## architecture (5)

- `arc-beauvais-cathedrale-voute-effondree-1284` : SUPERLATIF_OU_CHIFFRE_ROND. Le punch affirme un superlatif absolu (« la plus haute voûte gothique jamais bâtie ») ; le fait vérifiable est la chute de 1284, ou la hauteur de près de 47 m citée dans l'idée.
- `arc-fallingwater-affaissement-depuis-1936` : CARTE_HORS_FICHE. La fiche présente la fissure comme une anecdote (« serait apparue »), alors que la carte l'affirme comme un fait daté.
- `arc-paxton-crystal-palace-jardinier` : SUPERLATIF_OU_CHIFFRE_ROND. « Le bâtiment le plus photographié » est un superlatif que rien dans l'extrait ne documente.
- `arc-pruitt-igoe-prix-invente` : CARTE_HORS_FICHE. La fiche dit seulement que Pruitt-Igoe n'a jamais reçu de récompense ; la carte affirme que ce prix « n'a jamais existé », ce qui contredit sa propre phrase « décerné à un autre immeuble ».
- `arc-tour-eiffel-sauvee-par-la-radio` : CARTE_HORS_FICHE. Le contrat oblige à rendre la tour à la Ville sans clause de maintien ; il ne prescrit pas sa destruction, que la carte présente comme acquise (« devait disparaître »).

## astronomie (3)

- `ast-decouverte-des-pulsars` : SOURCE_FAIBLE. « Université de Cambridge » ne désigne ni publication ni auteur, c'est un crédit trop vague.
- `ast-neptune-et-vulcain` : SOURCE_FAIBLE. « BibNum, OpenEdition » désigne une plateforme et non un document précis.
- `ast-parallaxe-de-bessel` : SUPERLATIF_OU_CHIFFRE_ROND. « dix années-lumière » est un arrondi : 61 Cygni, mesurée par Bessel, se situe à environ 11,4 années-lumière.

## biologie (7)

- `bio-cellules-hela` : SUPERLATIF_OU_CHIFFRE_ROND. « des millions de vies » est un chiffre rond que ni l'idée ni l'extrait ne étayent.
- `bio-deinococcus-radiodurans` : SUPERLATIF_OU_CHIFFRE_ROND. La punch dit « trois heures » alors que l'idée donne « trois à quatre heures ».
- `bio-endosymbiose-margulis` : IDEE_NON_AUTONOME. « L'idée » n'est jamais nommée (endosymbiose, Margulis), donc le lecteur ne sait pas de quelle idée il s'agit.
- `bio-miller-urey` : CARTE_HORS_FICHE. Le chiffre « 54 ans » n'apparaît pas dans l'extrait visible, et entre 1953 et 2008 il s'écoule 55 ans : à vérifier.
- `bio-paradoxe-peto` : CARTE_HORS_FICHE. La fiche compare la masse (environ cent fois plus), pas le nombre de cellules : la carte transpose ce ratio à un autre critère.
- `bio-prochlorococcus` : SUPERLATIF_OU_CHIFFRE_ROND. « L'organisme le plus abondant » est un superlatif que l'idée ne fonde pas : elle n'appuie que sur une estimation attribuée au MIT.
- `bio-reseau-mycorhizien` ✓ : SUPERLATIF_OU_CHIFFRE_ROND. « Moins de 20 % » est un chiffre rond que l'idée ne fonde pas : elle ne donne que « cinq études ».

## chimie (4)

- `chi-chlore-et-couche-d-ozone` : SUPERLATIF_OU_CHIFFRE_ROND. « Cent mille » molécules d'ozone est un chiffre rond absent de l'extrait visible : à vérifier contre la fiche complète.
- `chi-decouverte-argon` : CARTE_HORS_FICHE. La fiche date la pesée de l'azote de 1892, la carte écrit 1894.
- `chi-procede-haber-bosch` : SUPERLATIF_OU_CHIFFRE_ROND. « Près d'un atome sur deux » est un chiffre rond non sourcé, et l'idée parle de protéines de l'humanité, pas d'atomes du corps.
- `chi-reaction-de-maillard` : CARTE_HORS_FICHE. « rien de tout ça n'a caramélisé » est absolu, alors que la fiche dit que la caramélisation est « presque toujours » mise en cause à tort.

## cinema (10)

- `cin-chien-andalou-scandale-qui-a-plu` : IDEE_NON_AUTONOME, SOURCE_FAIBLE. L'idée annonce un « vrai scandale » huit mois plus tard sans jamais dire lequel ; la source « Wikipedia (en) » est un crédit faible, même accolé à MoMA.
- `cin-citizen-kane-campagne-hearst` ✓ : SUPERLATIF_OU_CHIFFRE_ROND. La fiche dit « plus de huit cent mille dollars » ; la carte affirme 800 000 exactement, ce qui change l'affirmation.
- `cin-code-hays-quatre-ans-sans-sanction` ✓ : CARTE_HORS_FICHE. « n'a rien censuré du tout » va au-delà de la fiche, qui dit seulement que le Code ne prévoyait aucune sanction pour se faire respecter.
- `cin-effet-koulechov-film-introuvable` : CARTE_HORS_FICHE. « le film qui a inventé le montage au cinéma » n'est pas dit par la fiche, qui décrit une expérience pédagogique démontrant l'effet du montage.
- `cin-fritz-lang-quatre-mois-avant-de-fuir` ✓ : SOURCE_FAIBLE. « Wikipedia (EN) » est un crédit faible pour un fait biographique contesté, même accolé à Criterion.
- `cin-jack-foley-bruitage-sans-generique` : CARTE_HORS_FICHE. « Chaque porte qui claque » généralise, et « aucune caméra n'a jamais filmé » n'est pas établi par la fiche.
- `cin-potemkine-marches-odessa-massacre-invente` ✓ : SUPERLATIF_OU_CHIFFRE_ROND, SOURCE_FAIBLE. « La scène la plus célèbre du cinéma soviétique » est un superlatif que la fiche ne soutient pas ; la source Roger Ebert, critique de cinéma, ne suffit pas à établir un fait historique de 1905.
- `cin-survie-films-muets-americains` : SUPERLATIF_OU_CHIFFRE_ROND, CARTE_HORS_FICHE. « Sept sur dix » est un chiffre rond absent de la fiche, qui donne 14 % de films complets et « moins d'un tiers » de survivants ; « totalement disparu » va au-delà de ce que dit le texte.
- `cin-truffaut-politique-des-auteurs-devenue-theorie` ✗ : CARTE_HORS_FICHE. Le punch parle d'une « politique éditoriale », alors que la fiche et l'idée indiquent que Truffaut a nommé sa position « politique des auteurs ».
- `cin-universal-nait-du-proces-contre-edison` : CARTE_HORS_FICHE. Universal naît de la fusion de 1912, et le procès gagné devant la Cour suprême date de 1917 ; le punch affirme donc à tort que la société est née du procès.

## climat (4)

- `cli-calcul-d-arrhenius` : CARTE_HORS_FICHE. Le punch ajoute « serein » et le chiffre rond « trois mille ans », qui ne figurent pas dans l'extrait de la fiche et doivent être sourcés.
- `cli-courbe-de-keeling` : SOURCE_FAIBLE. « APS » seul ne constitue pas un crédit exploitable : il manque l'auteur, la date et le titre de la publication.
- `cli-effet-papillon-de-lorenz` : CARTE_HORS_FICHE. La fiche dit que Lorenz a relancé le calcul avec des valeurs arrondies à « quelques décimales », alors que le punch affirme une troncature à « trois décimales ».
- `cli-el-nino-oscillation-australe` : SUPERLATIF_OU_CHIFFRE_ROND. « Un siècle » est un chiffre rond inexact : de la première description (1895) à la synthèse de Bjerknes (1969), il s'écoule environ trois quarts de siècle.

## droit_conformite (6)

- `dro-bnp-paribas-2014-amende-record-sanctions-americaines` : SUPERLATIF_OU_CHIFFRE_ROND. Le punch annonce « 9 milliards de dollars » alors que l'idée donne 8,97 milliards : le chiffre rond remplace la valeur exacte sans la qualifier (la fiche dit « près de »).
- `dro-fcpa-1977-scandale-lockheed` : CARTE_HORS_FICHE. Le punch affirme qu'aucun pays n'avait ce délit, une affirmation absolue que l'extrait de fiche ne fournit pas.
- `dro-herstatt-1974-comite-de-bale` : SOURCE_FAIBLE. La source « Bank for International Settlements, 1974 » ne nomme aucun document précis : il faudrait un titre ou une référence vérifiable.
- `dro-sarbanes-oxley-2002-neuf-jours-apres-worldcom` : SUPERLATIF_OU_CHIFFRE_ROND. « la plus grosse faillite du pays » est un superlatif absolu : la fiche le limite à « à cette date », restriction perdue dans le punch.
- `dro-texas-gulf-sulphur-1968-divulguer-ou-sabstenir` ✗ : CARTE_HORS_FICHE. L'idée parle d'un « immense gisement », alors que la fiche insiste sur l'incertitude de son étendue réelle.
- `dro-toshiba-kongsberg-1987-le-scandale-des-helices` : SOURCE_FAIBLE. « Wikipédia » n'est pas une source primaire vérifiable : il faudrait citer l'enquête, le rapport ou l'article d'origine.

## droit_constitutionnel (6)

- `dro-barron-baltimore-1833-bill-of-rights-etats` : CARTE_HORS_FICHE. Le texte présente Barron comme propriétaire d'un quai, non comme armateur, et dit que les eaux sont devenues trop peu profondes pour les grands navires, sans que le quai soit rendu inutilisable.
- `dro-habeas-corpus-produire-le-corps` ✓ : CARTE_HORS_FICHE. La formule « fait payer les amendes au prisonnier lui-même » est inexacte : la loi sanctionne les responsables de la détention, et l'extrait, coupé avant ce passage, ne l'appuie pas.
- `dro-kelsen-1920-ecarte-par-sa-propre-cour` : CARTE_HORS_FICHE. « Il en est membre depuis 1919 » contredit l'extrait, selon lequel la cour n'existe qu'avec la Constitution entrée en vigueur le 10 novembre 1920.
- `dro-kesavananda-bharati-1973-structure-fondamentale` : SUPERLATIF_OU_CHIFFRE_ROND. « Sept cents pages » est un chiffre rond que le texte ne fournit pas.
- `dro-montesquieu-1748-la-phrase-quon-ne-lit-pas` ✓ : SUPERLATIF_OU_CHIFFRE_ROND. « La phrase la plus citée du droit constitutionnel » est un superlatif non étayé par la fiche ; l'idée parle aussi de « presque à la fin » du chapitre, contre « à la fin » dans le punch.
- `dro-petition-of-right-1628-motif-a-montrer` : CARTE_HORS_FICHE. Le texte parle d'un prêt forcé, non d'un impôt, et donne « au moins » soixante-seize hommes, que la carte transforme en décompte exact.

## droit_institutions (3)

- `dro-bushells-case-1670-jury-independant` ✗ : CARTE_HORS_FICHE. Le texte dit que les jurés sont privés de viande, de boisson, de feu et de tabac, non de toute nourriture comme l'affirme le punch.
- `dro-japon-1928-1943-jury-suspendu` : SUPERLATIF_OU_CHIFFRE_ROND. « Douze caractères » est un chiffre précis absent de l'extrait visible de la fiche ; à vérifier sur le texte de la loi de 1943 avant publication.
- `dro-star-chambre-une-naissance-inventee` : SOURCE_FAIBLE. « Encyclopedia.com » est une compilation secondaire et « Acte d'abolition, 1641 » ne nomme pas le texte ; citer le titre exact de l'acte de 1641 ou un ouvrage d'historien.

## droit_international (4)

- `dro-briand-kellogg-1928-la-guerre-mise-hors-la-loi` : CARTE_HORS_FICHE. Le punch attribue soixante-trois États à 1928, alors que la fiche indique quinze délégations signataires le 27 août 1928 ; le total de soixante-trois n'est pas établi pour cette année dans l'extrait.
- `dro-montevideo-1933-quatre-criteres-pour-etre-un-etat` : CARTE_HORS_FICHE. La carte parle d'Amérique du Sud, alors que la fiche dit seulement que les dix-neuf signataires étaient « tous américains ».
- `dro-solferino-premiere-convention-de-geneve` : CARTE_HORS_FICHE. La carte dit « quarante mille blessés », alors que la fiche dit quarante mille hommes morts, mourants ou blessés.
- `dro-wimbledon-1923-le-droit-de-signer-un-traite` : SUPERLATIF_OU_CHIFFRE_ROND. « Le tout premier jugement » est un superlatif que l'idée n'a pas besoin : « le premier jugement de la CPJI » suffit.

## droit_pi_ia (4)

- `dro-bayer-1921-aspirine-un-mot-coupe-en-deux` : CARTE_HORS_FICHE. La carte affirme que le grand public n'a « jamais » été informé de l'origine du produit, alors que la fiche indique que Bayer appose son nom sur les comprimés à partir de l'automne 1915.
- `dro-dabus-ia-nommee-inventeur-brevets` ✓ : TEASING_CREUX. Le punch annonce « une raison qu'on croit » sans la donner ; l'idée explique pourtant la raison (contrôle de forme seulement), le punch peut s'appuyer sur ce contenu.
- `dro-feist-effort-ne-fait-pas-oeuvre` : SUPERLATIF_OU_CHIFFRE_ROND. « Cent faits » est un chiffre rond sans correspondance dans la fiche, qui donne 46 878 entrées dont 1 309 identiques.
- `dro-thaler-2022-une-machine-ne-peut-pas-signer-une-oeuvre` ✗ : CARTE_HORS_FICHE. L'idée date le refus du Copyright Office de 2022, alors que la fiche le date du 12 août 2019 ; 2022 est l'année de confirmation par le Review Board.

## droit_preuve (8)

- `dro-canon-18-du-concile-de-latran-fin-de-l-ordalie` : CARTE_HORS_FICHE. Le punch dit que le royaume « invente le jury », alors que l'idée parle d'un ancêtre du jury né peu à peu : l'affirmation du punch dépasse ce que la fiche soutient.
- `dro-fantome-de-heilbronn-un-adn-qui-n-existait-pas` : SUPERLATIF_OU_CHIFFRE_ROND, SOURCE_FAIBLE. Le punch donne « quarante » comme un compte exact alors que la fiche dit « au moins une quarantaine », et « Affaire du fantôme de Heilbronn » est un libellé d'affaire, non un crédit de source.
- `dro-gary-dotson-retractation-refusee-par-la-justice` : SUPERLATIF_OU_CHIFFRE_ROND. « La première condamnation américaine défaite par un test ADN » est un superlatif de primauté que l'extrait de fiche ne documente pas.
- `dro-premier-suspect-innocente-par-adn` : SUPERLATIF_OU_CHIFFRE_ROND, SOURCE_FAIBLE. « La toute première utilisation judiciaire de l'ADN » est un superlatif de primauté, et « Affaire Narborough, Leicestershire » est un libellé d'affaire, non un crédit de source.
- `dro-premiere-condamnation-par-empreinte` : SUPERLATIF_OU_CHIFFRE_ROND, SOURCE_FAIBLE. « Premier fichier d'empreintes au monde » et « Première condamnation par empreinte digitale » sont des superlatifs de primauté, et « Affaire Francisca Rojas, Argentine » est un libellé d'affaire, non un crédit de source.
- `dro-ronald-cotton-condamne-par-le-visage-quil-navait-pas` : SOURCE_FAIBLE. « Affaire Cotton, Burlington, 1984-1995 » est un libellé d'affaire, non un document ou un auteur crédité.
- `dro-timothy-evans-pendu-pour-les-meurtres-de-christie` : IDEE_NON_AUTONOME, SOURCE_FAIBLE. Le punch laisse croire que Christie avoue le meurtre pour lequel Evans a été pendu (la fille), alors que l'idée dit qu'il avoue celui de la femme, et « Affaire Evans-Christie, Londres » est un libellé d'affaire, non un crédit de source.
- `dro-will-west-william-west-leavenworth-1903` : SOURCE_FAIBLE. « Affaire Will West et William West, Leavenworth » est un libellé d'affaire, non un document ou un auteur crédité.

## droit_social (4)

- `dro-1803-le-livret-ouvrier` : IDEE_NON_AUTONOME. « Encore délivré ailleurs jusqu'en 1939 » ne dit ni où ni par qui le livret continue d'être délivré, donc la phrase reste floue sans la fiche.
- `dro-1877-loi-suisse-des-fabriques-protege-et-prive` : SUPERLATIF_OU_CHIFFRE_ROND. « La première loi ouvrière suisse » contredit la fiche, qui parle de la première loi fédérale alors que neuf cantons avaient déjà légiféré.
- `dro-1905-lochner-la-liberte-contre-la-protection` ✓ : CARTE_HORS_FICHE. La punch affirme que le mot « liberté » a servi à imposer la loi ouvrière, alors que l'extrait ne mentionne que l'usage de la liberté de contracter pour l'annuler.
- `dro-1919-convention-oit-huit-heures-sauf-exceptions` : CARTE_HORS_FICHE. La punch dit que la convention commence par préciser ses exclusions, alors que l'extrait place d'abord le principe des huit heures à l'article 2, les exceptions venant ensuite.

## ecologie (6)

- `eco-crapaud-buffle-en-australie` : SUPERLATIF_OU_CHIFFRE_ROND. « Plus d'un million de km² » est un chiffre rond qui n'apparaît pas dans l'extrait disponible ; à vérifier dans la fiche complète.
- `eco-declin-des-insectes` ✓ : SUPERLATIF_OU_CHIFFRE_ROND. La punch parle de « trente ans » de pesée alors que l'idée indique 27 ans ; « trente » est un chiffre rond incohérent avec la fiche.
- `eco-ecocide-de-l-ile-de-paques` : TEASING_CREUX, CARTE_HORS_FICHE. La punch annonce une intention des auteurs (« on cherchait une parabole ») sans fournir de contenu, et cette intention n'est pas dans l'extrait.
- `eco-effondrement-de-la-morue` : SOURCE_FAIBLE. « Britannica, effondrement de 1992 » est une entrée d'encyclopédie et non une source primaire pour des chiffres précis de biomasse et de quotas.
- `eco-le-feu-quon-a-trop-bien-eteint` : SUPERLATIF_OU_CHIFFRE_ROND. « 10 000 pompiers » est un chiffre rond absent de l'extrait disponible ; à vérifier dans la fiche complète.
- `eco-modele-proie-predateur` : SOURCE_FAIBLE. « Stan case study » désigne un tutoriel de logiciel sans auteur ni date, qui ne soutient pas la critique des registres de fourrures.

## economie (9)

- `econ-big-mac-index-1986` : CARTE_HORS_FICHE. La carte dit l'index « pensé comme une blague », alors que la fiche le décrit comme une illustration « à moitié sérieuse ».
- `econ-choc-nixon-1971` ✓ : SOURCE_FAIBLE. La seule source est Wikipédia, article collaboratif sans référence primaire citée, pour un événement qui s'appuie sur un discours et des archives.
- `econ-gresham-copernic-monnaie` : SOURCE_FAIBLE. L'attribution à Copernic ne repose que sur Wikipédia, alors qu'une référence primaire (Monete cudendae ratio, 1517) serait nécessaire.
- `econ-jeu-ultimatum-guth-1982` : CARTE_HORS_FICHE. La carte attribue 100 euros à l'expérience de 1982, alors que la fiche n'emploie les euros que dans une mise en situation imaginée.
- `econ-keynes-long-run-1923` : SUPERLATIF_OU_CHIFFRE_ROND. « La phrase la plus citée » est un superlatif que la fiche n'étaye pas.
- `econ-kuznets-avertissement-revenu-national` : CARTE_HORS_FICHE. La carte dit qu'il ne faut « jamais » utiliser le revenu national pour juger un pays, alors que la fiche présente l'avertissement comme une limite sur ce que le chiffre dit du bien-être.
- `econ-mal-hollandais-groningue-1959` : SUPERLATIF_OU_CHIFFRE_ROND, CARTE_HORS_FICHE. La carte supprime le « l'un des » de la fiche pour écrire « le plus grand gisement », et attribue la découverte au fermier alors que le forage était mené par la NAM.
- `econ-mincome-dauphin-1974` : SOURCE_FAIBLE. Wikipedia est une source générale, alors que le chiffre de 8,5 % provient de l'étude d'Evelyn Forget, qu'il faudrait créditer.
- `econ-revolution-marginale-eau-diamant` : IDEE_NON_AUTONOME. L'idée annonce une « même solution » au paradoxe de l'eau et du diamant sans jamais l'énoncer (utilité marginale), donc on n'apprend pas le contenu sans l'application.

## epistemologie (2)

- `epi-affaire-benveniste` : CARTE_HORS_FICHE. Le punch parle de quatre essais tenus, l'idée de trois essais pour faire disparaître l'effet : la carte se contredit, à vérifier dans la fiche.
- `epi-feyerabend-anything-goes` : IDEE_NON_AUTONOME. « L'objection de la tour » et le slogan « anything goes » ne sont pas expliqués dans la carte, le lecteur ne sait pas ce qu'ils désignent.

## genetique (6)

- `gen-crispr-du-yaourt-a-l-embryon` ✓ : IDEE_NON_AUTONOME. « Donc un système d'adressage » n'est pas expliqué : le lecteur ne sait ni à quoi sert ce repérage ni pourquoi une archive en serait un.
- `gen-effondrement-du-cout-du-genome` : PUNCH_TRONQUE, CARTE_HORS_FICHE. Le punch s'arrête à « environ 525 » sans l'unité « dollars », et présente 95 millions comme le coût général d'un génome alors que la fiche le limite aux centres financés par les NIH.
- `gen-genes-sauteurs-de-mcclintock` ✓ : CARTE_HORS_FICHE. La maxime sur la reproduction n'est pas ce que montre l'idée : le résultat a été écarté parce qu'il contredisait le dogme, pas faute d'être refait.
- `gen-heritabilite` : SOURCE_FAIBLE. Le crédit « de Vienne, INRA » ne donne ni prénom, ni titre, ni année, et reste difficile à vérifier.
- `gen-hiver-de-la-faim` : SUPERLATIF_OU_CHIFFRE_ROND. « Soixante ans » arrondit un intervalle exact d'environ 64 ans (1944 à 2008) ; donnez l'écart réel.
- `gen-le-gene-de-quelque-chose` : SOURCE_FAIBLE. « Modèle omnigénique, JPBS » n'identifie ni auteur ni année ni revue reconnaissable ; le crédit doit citer une référence vérifiable.

## geographie (9)

- `ggr-aleoutiennes-est-ouest-etats-unis` : SUPERLATIF_OU_CHIFFRE_ROND. Le punch contient un superlatif (« les points les plus à l'est et à l'ouest »), interdit par la règle.
- `ggr-antarctique-plus-grand-desert` : SUPERLATIF_OU_CHIFFRE_ROND. Le punch repose sur un superlatif (« le plus grand désert du monde »), interdit par la règle.
- `ggr-chimborazo-centre-terre` : SUPERLATIF_OU_CHIFFRE_ROND, CARTE_HORS_FICHE. Le punch contient un superlatif (« le point le plus loin »), et l'écart d'altitude annoncé (2 585 m) ne correspond pas à 8 849 − 6 263 = 2 586 m, chiffres donnés par la fiche.
- `ggr-kiribati-ligne-date-1995` : SOURCE_FAIBLE. « Wikipedia, UTC+14:00 » est une page encyclopédique plutôt qu'un crédit primaire ; citer la source d'origine (documents officiels ou presse de 1994-1995) serait plus solide.
- `ggr-ligne-de-wallace-bali-lombok` : CARTE_HORS_FICHE. Le punch affirme que les deux faunes « n'ont jamais existé ensemble », ce que la fiche ne dit pas : elle décrit deux faunes distinctes séparées par une ligne.
- `ggr-nil-amazone-plus-long-fleuve` : SUPERLATIF_OU_CHIFFRE_ROND. Le punch repose sur un superlatif (« le plus long fleuve du monde »), interdit par la règle.
- `ggr-point-nemo-cimetiere-satellites` : SUPERLATIF_OU_CHIFFRE_ROND. « Le point le plus loin de toute terre » est un superlatif dans la punch.
- `ggr-triple-divide-peak-snow-dome` : SOURCE_FAIBLE. Wikipédia seul, sans auteur ni organisme, ne suffit pas comme crédit pour une affirmation précise sur Snow Dome.
- `ggr-whitney-vallee-de-la-mort` : SUPERLATIF_OU_CHIFFRE_ROND, CARTE_HORS_FICHE. La punch utilise « le plus haut » et « le plus bas » et parle des « États-Unis », alors que la fiche limite le sommet aux 48 États contigus.

## geologie (3)

- `geo-age-de-la-terre-clair-patterson` : TEASING_CREUX. « Ça » reste vague dans la punch, le plomb n'étant nommé que dans l'idée.
- `geo-chimborazo-plus-loin-du-centre-de-la-terre` : SUPERLATIF_OU_CHIFFRE_ROND. « Le sommet le plus haut du monde » dans la punch et « le point du globe le plus loin de son centre » dans l'idée sont des superlatifs.
- `geo-zircon-jack-hills-plus-vieux-fragment-terre` : SUPERLATIF_OU_CHIFFRE_ROND. Le punch « Le plus vieux fragment de Terre jamais trouvé » repose sur un superlatif absolu ; la formulation doit être reformulée sans superlatif.

## histoire (4)

- `hist-armee-terre-cuite-decouverte-1974` : SUPERLATIF_OU_CHIFFRE_ROND. Le punch annonce « Huit mille soldats » comme un compte exact, alors que la fiche dit « plus de huit mille » : le qualificatif de borne inférieure est perdu.
- `hist-champollion-hieroglyphes-1822` : CARTE_HORS_FICHE. Le punch affirme que Champollion « s'évanouit » cinq jours, alors que la fiche présente un assoupissement dont il ne se serait relevé « dit-on », selon le récit familial.
- `hist-dunant-fondateur-croix-rouge-1863` : CARTE_HORS_FICHE. Le punch dit Dunant « oublié de tous », alors que l'idée indique qu'il est retrouvé en 1895 et reçoit le prix Nobel de la paix en 1901.
- `hist-luther-phrase-apocryphe-worms-1521` : SUPERLATIF_OU_CHIFFRE_ROND, IDEE_NON_AUTONOME. Le punch repose sur le superlatif « la phrase la plus célèbre » ; l'idée annonce une « vraie réponse » de Luther sans jamais la donner.

## histoire_art (9)

- `har-fountain-de-duchamp` : SUPERLATIF_OU_CHIFFRE_ROND. « la plus discutée du siècle » est un superlatif que ni l'idée ni la fiche ne permettent d'étayer.
- `har-gregoire-invente-vandalisme` : CARTE_HORS_FICHE. La carte affirme que « la pratique » a survécu au mot ; l'idée dit seulement que le mot est resté en usage, sans rien sur la survie des destructions.
- `har-han-van-meegeren-faux-vermeer` : CARTE_HORS_FICHE. La carte dit qu'il doit prouver que le tableau « n'existait pas avant lui », alors que l'idée dit qu'il doit prouver qu'il est un faussaire.
- `har-homme-cache-chambre-bleue` : CARTE_HORS_FICHE. Le motif « faute d'argent pour une toile neuve » n'apparaît ni dans l'idée ni dans l'extrait de fiche ; à vérifier dans la fiche complète.
- `har-inondation-florence-1966-restauration` : CARTE_HORS_FICHE. Le punch parle d'une « invention » de la restauration « en quelques semaines », que l'idée ne dit pas : elle évoque seulement des techniques et institutions nées de l'urgence, sans calendrier.
- `har-restauration-ecce-homo-borja` : SUPERLATIF_OU_CHIFFRE_ROND, SOURCE_FAIBLE. « 150 000 visiteurs » est un chiffre rond à vérifier dans la fiche (extrait tronqué), et Wikipédia est un crédit faible pour une carte partageable.
- `har-van-eyck-mythe-peinture-huile` : SUPERLATIF_OU_CHIFFRE_ROND. « mille ans » est un chiffre rond qui dépasse ce que l'idée établit : elle donne le XIIe puis le VIIe siècle, soit moins de mille ans avant Van Eyck.
- `har-vol-de-la-joconde` : SOURCE_FAIBLE. Wikipédia n'est pas une source solide pour une carte partageable ; citer un ouvrage ou une institution.
- `har-vol-musee-isabella-stewart-gardner` : SUPERLATIF_OU_CHIFFRE_ROND. « le plus grand vol d'art en valeur jamais commis aux États-Unis » est un superlatif qu'il faudrait sourcer ou atténuer.

## informatique (3)

- `inf-eviter-un-examen-a-produit-un-algorithme-de-compression` ✓ : SUPERLATIF_OU_CHIFFRE_ROND, CARTE_HORS_FICHE. « le plus utilisé au monde » est un superlatif invérifiable, et la carte présente Shannon comme professeur de Huffman alors que la fiche dit seulement qu'il cherchait la même solution avec Fano.
- `inf-lauteur-des-regles-de-mot-de-passe-les-regrette` : SUPERLATIF_OU_CHIFFRE_ROND. « les plus détestées au monde » est un superlatif non démontré par la fiche.
- `inf-le-poeme-qui-empeche-les-reseaux-de-boucler` ✓ : CARTE_HORS_FICHE. La carte attribue au poème ce que fait l'algorithme : l'idée dit que le poème résume la méthode, non qu'il empêche les boucles.

## linguistique (2)

- `lin-loi-de-grimm` : CARTE_HORS_FICHE, SOURCE_FAIBLE. Le punch affirme « jamais une exception », alors que l'idée parle de rares exceptions (father/brother) ; la source donne Verner 1877 alors que l'idée date sa solution de 1875.
- `lin-regle-anti-preposition-finale` : CARTE_HORS_FICHE. Le punch attribue l'interdiction à Dryden seul, alors que la fiche signale que Joshua Poole avait exprimé une réserve comparable quelques décennies plus tôt.

## litterature (5)

- `lit-dit-du-genji` : CARTE_HORS_FICHE, SUPERLATIF_OU_CHIFFRE_ROND. Le punch présente comme acquis que le Dit du Genji est le premier roman du monde, alors que la fiche le dit « considéré par de nombreux chercheurs » ; la formule « le premier roman du monde » reste d'ailleurs un superlatif de primauté.
- `lit-hanna-diyab` ✓ : CARTE_HORS_FICHE. Le punch dit qu'Aladin et Ali Baba ne sont dans aucun manuscrit arabe, sans la limite « antérieur à 1709 » que pose l'idée.
- `lit-question-homerique` : SOURCE_FAIBLE. L'article de Parry de 1930 est antérieur aux enregistrements des chanteurs des Balkans (1933-1935) que la carte décrit, donc il ne soutient pas les faits annoncés.
- `lit-telegramme-victor-hugo` : SUPERLATIF_OU_CHIFFRE_ROND. Le punch qualifie la correspondance de « la plus courte correspondance de la littérature », un superlatif.
- `lit-vrai-cyrano-bergerac` : CARTE_HORS_FICHE. Le punch affirme que ses lettres d'amour étaient adressées à des hommes, alors que l'idée ne parle que d'une préférence et que l'extrait fourni ne mentionne pas de lettres.

## mathematiques (6)

- `mat-argument-diagonal-de-cantor` : SOURCE_FAIBLE. La source « Cantor, 1891 » ne donne ni le titre ni la revue, donc le lecteur ne peut pas retrouver le texte.
- `mat-paradoxe-des-anniversaires` : SOURCE_FAIBLE. NIST SP 800-107 est une norme sur les fonctions de hachage cryptographiques, pas une référence sur ce paradoxe ; mieux vaut créditer l'origine historique du problème, par exemple von Mises (1939).
- `mat-theoreme-d-incompletude` : CARTE_HORS_FICHE. Le punch affirme qu'aucun système ne peut prouver sa propre cohérence, alors que le théorème ne vaut que pour les systèmes cohérents assez riches pour contenir l'arithmétique, condition donnée dans l'idée mais absente du punch.
- `mat-theoreme-de-noether` : SUPERLATIF_OU_CHIFFRE_ROND. « quatre ans » arrondit la période 1916-1919 indiquée dans la fiche ; mieux vaut citer les années.
- `mat-theoreme-des-quatre-couleurs` : SUPERLATIF_OU_CHIFFRE_ROND. « Le premier grand théorème démontré par une machine » et « personne n'a pu relire » sont des absolus que la fiche n'étaie pas, et « un mois de calcul » est une estimation arrondie (la littérature parle d'environ 1 200 heures).
- `mat-transformee-de-fourier` : CARTE_HORS_FICHE. La fiche limite l'affirmation de Fourier aux fonctions périodiques, alors que l'idée écrit « tout signal » sans cette restriction.

## medecine (8)

- `med-decouverte-insuline-toronto` : SOURCE_FAIBLE, SUPERLATIF_OU_CHIFFRE_ROND. « Des millions de vies » est un chiffre non sourcé, et « University of Toronto Libraries » est une institution sans document ni date, qui est aussi l'université bénéficiaire du brevet.
- `med-fraude-wakefield-vaccin-ror` ✓ : SUPERLATIF_OU_CHIFFRE_ROND. « plus de dix ans » : durée chiffrée absente de l'extrait, qui donne 1998 et une rétractation douze ans plus tard ; chiffre rond à sourcer ou à reformuler.
- `med-helicobacter-pylori-marshall` : SUPERLATIF_OU_CHIFFRE_ROND. « Il faudra dix ans » : durée chiffrée non étayée par l'extrait, chiffre rond à sourcer ou à reformuler.
- `med-jenner-vaccination-variole` : SUPERLATIF_OU_CHIFFRE_ROND. « un siècle plus tard » : approximation ronde non donnée par l'extrait ; remplacer par la date réelle de la théorie microbienne.
- `med-kelsey-thalidomide-fda` : SUPERLATIF_OU_CHIFFRE_ROND. « plus de 10 000 enfants » : chiffre rond absent de l'extrait, à sourcer dans la fiche.
- `med-neurobiologie-effet-placebo` ✓ : CARTE_HORS_FICHE. La carte parle d'un « comprimé », alors que la fiche parle d'une gélule.
- `med-origines-indice-masse-corporelle` : SUPERLATIF_OU_CHIFFRE_ROND. « un adulte sur trois » : proportion ronde absente de l'extrait, à vérifier dans l'étude de 2025.
- `med-semmelweis-fievre-puerperale` ✓ : SUPERLATIF_OU_CHIFFRE_ROND. « divisé par huit » ne correspond pas à l'idée (18 % → 2 %, soit environ ÷9) : chiffre rond non fondé.

## musique (2)

- `mus-proces-blurred-lines-gaye-thicke` : CARTE_HORS_FICHE. La citation « Ce n'est même pas la même tonalité » n'apparaît pas dans la fiche, qui décrit la défense de Pharrell Williams en termes de notes, accords et mélodie.
- `mus-trois-minutes-sillon-78-tours` : SUPERLATIF_OU_CHIFFRE_ROND. « soixante-dix ans » est un chiffre rond calculé sur une date que la fiche ne donne pas (« années 1950 » seulement) : à reformuler ou à préciser.

## neurosciences (1)

- `neu-loewi-reve-vagusstoff` : CARTE_HORS_FICHE. Le « rêve » n'apparaît pas dans l'extrait (réveil, note griffonnée, idée revenue à trois heures) et « les neurones se parlent » généralise une expérience sur la transmission entre nerfs et cœurs de grenouille.

## nutrition (7)

- `nut-amandes-calories-facteurs-atwater` : SOURCE_FAIBLE. Le crédit « Am J Clin Nutr, 2012 » ne donne ni auteur ni titre, donc l'étude n'est pas identifiable.
- `nut-capsaicine-recepteur-chaleur-trpv1` : SOURCE_FAIBLE, CARTE_HORS_FICHE. Le menthol et le froid activent TRPM8, un canal distinct de TRPV1 et absent de l'extrait, et le crédit « Nature, 1997 / Nobel 2021 » ne cite ni auteur ni article.
- `nut-casimir-funk-mot-vitamine` : SOURCE_FAIBLE. Le crédit « Journal of State Medicine, 1912 » ne donne ni auteur ni titre de l'article.
- `nut-james-lind-essai-scorbut` : SUPERLATIF_OU_CHIFFRE_ROND, SOURCE_FAIBLE. « Le premier essai clinique de l'histoire » est un superlatif que la fiche nuance en « l'un des premiers », et le crédit « J R Soc Med, 2012 » ne donne ni auteur ni titre.
- `nut-leptine-resistance-obesite` : IDEE_NON_AUTONOME. « Le traitement » n'est jamais nommé dans la carte : le lecteur doit deviner à partir du punch qu'il s'agit d'un traitement à base de leptine.
- `nut-sel-tension-arterielle-dash-sodium` ✓ : SUPERLATIF_OU_CHIFFRE_ROND. « environ la moitié » et « un quart » sont des fractions rondes ; remplacer par les pourcentages exacts de l'essai, avec leur source.
- `nut-sucre-projet-226-maladies-cardiaques` : CARTE_HORS_FICHE. Le punch annonce 6 500 dollars, alors que l'extrait de la fiche indique « cinq cents dollars » pour les deux chercheurs ; le chiffre doit être vérifié dans la fiche avant publication.

## oceanographie (4)

- `oce-acidification-oceans-autre-crise-co2` ✓ : SUPERLATIF_OU_CHIFFRE_ROND. Une baisse de 0,1 unité de pH correspond à environ 26 % d'acidité en plus, pas 30 % ; « un tiers » du CO2 est aussi une approximation arrondie à corriger ou sourcer.
- `oce-circulation-thermohaline-tapis-roulant` : SUPERLATIF_OU_CHIFFRE_ROND. « Plus de cent fois le débit de l'Amazone » est un ordre de grandeur à vérifier : le débit de la circulation nord-atlantique (environ 15 à 20 Sv) rapporté à celui de l'Amazone (environ 0,2 Sv) donne plutôt un rapport d'environ 80 à 100.
- `oce-migration-verticale-zooplancton` : SUPERLATIF_OU_CHIFFRE_ROND. « la plus grande migration animale de la planète » est un superlatif que ni l'idée ni l'extrait ne justifient.
- `oce-trois-quarts-animaux-bioluminescents` : SUPERLATIF_OU_CHIFFRE_ROND. « Trois animaux sur quatre » arrondit 76 % ; mieux vaut garder le chiffre exact de la fiche dans la punch.

## paleontologie (7)

- `pal-burgess-hallucigenia` : SUPERLATIF_OU_CHIFFRE_ROND, SOURCE_FAIBLE. « quinze ans » ne correspond à aucune durée donnée (1977 à 1991 fait 14 ans) ; et la source citée, de 1991, ne couvre pas la confirmation de 1992 évoquée dans l'idée.
- `pal-coelacanthe-fossile-vivant` ✓ : CARTE_HORS_FICHE. La punch dit que le poisson est « remonté vivant », alors que la fiche le décrit conservé et naturalisé, ce qui suppose un animal mort ; le texte ne dit jamais qu'il était vivant.
- `pal-dater-un-fossile` : CARTE_HORS_FICHE. La punch affirme « jamais » sans nuance, alors que la fiche dit seulement « la quasi-totalité » des fossiles ; l'idée reprend l'absolu.
- `pal-deinocheirus-bras-sans-corps` ✗ : TEASING_CREUX. « Ils » n'a pas d'antécédent et l'animal n'est pas nommé : la punch joue sur le mystère sans donner de fait précis avant le clic.
- `pal-extinction-permienne-trapps` : SUPERLATIF_OU_CHIFFRE_ROND. « La plus grande extinction de l'histoire » est un superlatif à remplacer par un fait (plus de 90 % des espèces marines) ; l'idée arrondit aussi « un peu plus d'un million d'années » à « un million ».
- `pal-iguanodon-corne-devenue-pouce` : SUPERLATIF_OU_CHIFFRE_ROND. « cinquante ans » arrondit la période 1825–1878 (53 ans) ; il faut donner le chiffre exact.
- `pal-sinosauropteryx-plumes` : SUPERLATIF_OU_CHIFFRE_ROND, CARTE_HORS_FICHE. « Le premier » est un superlatif, et « vingt ans » arrondit l'intervalle 1996-2017 (21 ans) ; « convaincre tout le monde » n'est pas établi, la fiche montrant des interprétations concurrentes.

## philosophie (2)

- `phi-allegorie-de-la-caverne` : TEASING_CREUX. « Presque personne ne connaît la fin » crée un suspense sans contenu ; la carte gagnerait à nommer ce qui arrive (le prisonnier redescend, aveuglé, et risque la mort).
- `phi-rasoir-d-ockham` : SUPERLATIF_OU_CHIFFRE_ROND. « La phrase la plus citée » est un superlatif que la fiche ne justifie pas.

## physique (3)

- `phy-cavendish-peser-la-terre` : SUPERLATIF_OU_CHIFFRE_ROND. « moins de 1 % » est un chiffre rond et semble inexact : la valeur publiée par Cavendish (environ 5,448) s'écarte d'environ 1,2 % de la valeur actuelle (environ 5,51).
- `phy-mouvement-brownien-preuve-atomes` : SOURCE_FAIBLE. La source ne couvre que le Nobel 1926 de Perrin ; elle n'appuie pas les affirmations sur Brown (1827) ni sur Einstein (1905).
- `phy-mur-du-son` : SUPERLATIF_OU_CHIFFRE_ROND. « 80 km de large » est un chiffre rond absent de l'extrait visible de la fiche ; à vérifier dans la source NASA avant publication.

## psychologie (3)

- `psy-biais-de-confirmation` : IDEE_NON_AUTONOME. L'idée ne nomme pas la carte E, pourtant l'une des deux à retourner ; sans l'app, la bonne réponse (E et 7) reste incomplète.
- `psy-effet-spectateur` : CARTE_HORS_FICHE. La carte affirme que les trente-huit témoins « n'ont jamais existé », alors que la fiche dit seulement que rien n'établit qu'il y en ait eu trente-huit.
- `psy-styles-d-apprentissage` : SUPERLATIF_OU_CHIFFRE_ROND. « Quarante ans de tests » est un chiffre rond que ni la fiche ni la source ne donnent.

## religions (8)

- `rel-decepteur-figure-sans-contact` : CARTE_HORS_FICHE. « ne se sont jamais rencontrés » affirme plus que « sans contact attesté » : la fiche ne peut exclure un contact non attesté.
- `rel-donation-constantin-valla-1440` : SUPERLATIF_OU_CHIFFRE_ROND. « 700 ans » est un chiffre rond absent de l'extrait, qui dit seulement « depuis des siècles ».
- `rel-gobekli-tepe-temple-avant-agriculture` : SOURCE_FAIBLE. La source ne cite que Wikipédia, alors que l'idée s'appuie sur Klaus Schmidt et sur une étude de 2019 qui ne sont pas crédités.
- `rel-john-frum-dieu-americain-tanna` : CARTE_HORS_FICHE. « Dieu américain » n'est pas dit par la fiche, qui décrit seulement l'influence de la présence militaire américaine sur le mouvement.
- `rel-luther-95-theses-porte-wittenberg-recit-tardif` : SOURCE_FAIBLE. La source ne couvre que la lettre de 1517 ; le récit de Melanchthon (1548), qui fonde l'épisode de la porte, n'est pas crédité.
- `rel-noel-25-decembre-chronographe-354-sol-invictus` ✓ : SUPERLATIF_OU_CHIFFRE_ROND. Le punch contient le superlatif « le plus ancien », interdit dans le punch même si la fiche le justifie.
- `rel-papesse-jeanne-legende-martin-de-troppau` ✓ : IDEE_NON_AUTONOME. L'idée ne dit pas ce que la légende affirme (une femme pape), et « Léon IV », « Benoît III » ou « Martin de Troppau » restent sans explication pour qui n'a pas l'app.
- `rel-terreurs-an-mille-mythe-xixe-siecle` : SOURCE_FAIBLE. L'idée cite Duby (1967) alors que la source crédite Duby (1995), ce crédit ne correspond donc pas à l'affirmation.

## sciences_politiques (4)

- `pol-fenetre-overton` : SOURCE_FAIBLE. La source s'appuie sur Wikipédia, qui n'est pas un crédit suffisant ; il faudrait citer l'article ou l'ouvrage d'origine.
- `pol-loi-duverger-1951` : CARTE_HORS_FICHE, SOURCE_FAIBLE. Le punch parle d'un « même pays » qui passerait de deux à six partis alors que la fiche compare des pays différents, et la source est Wikipédia alors que l'idée cite Duverger (1951).
- `pol-origine-gerrymander-1812` : CARTE_HORS_FICHE. L'idée attribue au Boston Gazette la création du mot « gerrymander », alors que la fiche fait proposer ce mot-valise par le poète Richard Alsop lors du dîner ; le journal publie seulement la caricature.
- `pol-paradoxe-condorcet-1785` : SOURCE_FAIBLE. « Wikipédia, Paradoxe de Condorcet » est une entrée d'encyclopédie et non un crédit bibliographique ; citer l'Essai de 1785 ou une référence secondaire identifiée.

## sociologie (2)

- `soc-fait-social-suicide-durkheim` : CARTE_HORS_FICHE, SUPERLATIF_OU_CHIFFRE_ROND. La fiche cite des régions bavaroises et un rapport de 528 suicides protestants pour 100 catholiques, sans « Basse-Bavière » ni taux « 5 fois plus » ; ce chiffre rond arrondit un rapport de nombres de suicides, pas un écart de taux.
- `soc-paradoxe-amitie-feld` : CARTE_HORS_FICHE. « Presque tout le monde » dépasse l'exemple de la fiche, où seulement cinq personnes sur huit ont moins d'amis que leurs propres amis.

## statistiques (5)

- `sta-crise-de-la-replication` : CARTE_HORS_FICHE. Le punch dit que les études « affichaient un effet réel », alors que la fiche dit seulement qu'elles affichaient un effet statistiquement significatif, ce qui n'est pas la même chose.
- `sta-dame-qui-goute-le-the-fisher` : CARTE_HORS_FICHE. Le mot « pari » n'apparaît pas dans la fiche, qui décrit une affirmation qui amuse l'assistance, sans enjeu.
- `sta-gosset-student-guinness` : SUPERLATIF_OU_CHIFFRE_ROND. « un des outils les plus utilisés de la recherche scientifique » est un superlatif non sourcé dans l'extrait.
- `sta-principe-de-pareto` : SUPERLATIF_OU_CHIFFRE_ROND, SOURCE_FAIBLE. Le punch affirme « la règle de gestion la plus citée au monde », un superlatif non vérifiable ; l'idée présente « 80 % » et « 20 % » comme exacts alors que la fiche dit « environ ». La source « Juran Institute » n'identifie pas de publication précise pour la généralisation de 1941.
- `sta-william-playfair-graphiques` : SUPERLATIF_OU_CHIFFRE_ROND. La carte affirme « les graphiques les plus utilisés au monde » et « le premier diagramme circulaire de l'histoire », deux formulations superlatives que la fiche ne formule pas sous cette forme.
