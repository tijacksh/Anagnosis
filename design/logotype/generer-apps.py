import sys; sys.path.insert(0, 'pylib')  # pip install --target pylib fonttools
import sys; sys.path.insert(0,'pylib')
from fontTools.pens.basePen import BasePen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
P='../../Anagnosis-app/Anagnosis/Ressources/Polices/Newsreader.ttf'  # depuis design/logotype
class Pen(BasePen):
    def __init__(s,gs): super().__init__(gs); s.o=[]
    def r(s,*v): return ' '.join(('%.1f'%x).rstrip('0').rstrip('.') for x in v)
    def _moveTo(s,p): s.o.append('M '+s.r(*p))
    def _lineTo(s,p): s.o.append('L '+s.r(*p))
    def _qCurveToOne(s,a,b): s.o.append('Q '+s.r(*a,*b))
    def _curveToOne(s,a,b,c): raise Exception('cubique')
    def _closePath(s): s.o.append('Z')
def forme(wg,op,tr,k):
    f=instancer.instantiateVariableFont(TTFont(P),{'wght':wg,'opsz':op}); gs=f.getGlyphSet(); cm=f.getBestCmap()
    x=0; pen=Pen(gs); prev=None
    for c in 'Anagnosis':
        if prev=='A' and c=='n': x+=k
        gs[cm[ord(c)]].draw(TransformPen(pen,(1,0,0,-1,x,0))); x+=gs[cm[ord(c)]].width+tr; prev=c
    return ' '.join(pen.o), x-tr
G,wG=forme(540,72,22,25); Pt,wP=forme(640,6,60,20)
UPM=2000; BASE=1490  # ligne de base sous le haut du cadre (unités de 2000 par em)
def wrap(s):
    # coupe aux espaces seulement : jamais au milieu d'un nombre
    lignes,cur=[],''
    for m in s.split(' '):
        if len(cur)+len(m)+1>110: lignes.append(cur); cur=m
        else: cur=(cur+' '+m) if cur else m
    return '\n'.join(lignes+[cur])
swift=f'''import SwiftUI

/// Le logotype : le mot « Anagnosis » en Newsreader, dessiné en chemins (`design/logotype/` du
/// dépôt des fiches, généré par `fabriquer-logotype.py` : ne jamais l'éditer à la main).
///
/// Deux formes. **Grand** : corps optique haut, encre noire décalée sur le jaune commun
/// (hors-repérage de 3 % du corps), pour l'ouverture ; **jamais sous 24 pt de haut**, le
/// décalage empâte les empattements. **Petit** : corps optique bas, graisse plus forte,
/// interlettre ouverte, un seul ton, pour le pied de la carte et toute taille sous 14 pt.
/// Le miroir de `Logotype.kt`.
struct Logotype: View {{
    enum Forme {{ case grand, petit }}
    var sombre: Bool
    /// Corps du mot, en points : le cadre fait `corps` de haut (ligne de base à 74,5 %).
    var corps: CGFloat
    var forme: Forme = .petit

    private static let unites: CGFloat = {UPM}
    private static let base: CGFloat = {BASE}
    private static let largeurGrand: CGFloat = {wG:.1f}
    private static let largeurPetit: CGFloat = {wP:.1f}
    private static let grandChemin = FormeLogotype.chemin(grandD)
    private static let petitChemin = FormeLogotype.chemin(petitD)

    /// Largeur du cadre pour ce corps.
    static func largeur(corps: CGFloat, forme: Forme) -> CGFloat {{
        corps * (forme == .grand ? largeurGrand : largeurPetit) / unites
    }}

    var body: some View {{
        Canvas {{ ctx, _ in
            let s = corps / Self.unites
            let place = CGAffineTransform(translationX: 0, y: Self.base * s).scaledBy(x: s, y: s)
            if forme == .grand {{
                let decale = place.translatedBy(x: 0.03 * Self.unites, y: 0.03 * Self.unites)
                ctx.fill(Self.grandChemin.applying(decale), with: .color(Papier.jaune.couleur))
                ctx.fill(Self.grandChemin.applying(place), with: .color(Papier.texte(sombre).couleur))
            }} else {{
                ctx.fill(Self.petitChemin.applying(place), with: .color(Papier.texte(sombre).couleur))
            }}
        }}
        .frame(width: Self.largeur(corps: corps, forme: forme), height: corps)
        .accessibilityElement()
        .accessibilityLabel("Anagnosis")
    }}
}}

/// Lit un chemin écrit en `M x y`, `L x y`, `Q cx cy x y`, `Z` (coordonnées absolues).
enum FormeLogotype {{
    static func chemin(_ d: String) -> Path {{
        var chemin = Path()
        let jetons = d.split(whereSeparator: {{ $0 == " " || $0 == "\\n" }})
        var i = 0
        func nombre() -> CGFloat {{ defer {{ i += 1 }}; return CGFloat(Double(jetons[i]) ?? 0) }}
        while i < jetons.count {{
            let c = jetons[i]; i += 1
            switch c {{
            case "M": chemin.move(to: CGPoint(x: nombre(), y: nombre()))
            case "L": chemin.addLine(to: CGPoint(x: nombre(), y: nombre()))
            case "Q":
                let a = CGPoint(x: nombre(), y: nombre()), b = CGPoint(x: nombre(), y: nombre())
                chemin.addQuadCurve(to: b, control: a)
            case "Z": chemin.closeSubpath()
            default: break
            }}
        }}
        return chemin
    }}
}}

private let grandD = """
{wrap(G)}
"""

private let petitD = """
{wrap(Pt)}
"""
'''
kotlin=f'''package com.anagnosis.app.composants

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.dp
import com.anagnosis.app.charte.Papier

/**
 * Le logotype : le mot « Anagnosis » en Newsreader, dessiné en chemins (`design/logotype/` du
 * dépôt des fiches, généré par `fabriquer-logotype.py` : ne jamais l'éditer à la main).
 *
 * **Grand** : encre noire décalée sur le jaune commun (hors-repérage de 3 % du corps), pour
 * l'ouverture, jamais sous 24 dp de haut. **Petit** : un seul ton, graisse plus forte,
 * interlettre ouverte, pour le pied de la carte et toute taille sous 14 dp. Le miroir de
 * `Logotype.swift`.
 */
enum class FormeLogotype {{ GRAND, PETIT }}

object Logotype {{
    const val UNITES = {UPM}f
    const val BASE = {BASE}f
    private const val LARGEUR_GRAND = {wG:.1f}f
    private const val LARGEUR_PETIT = {wP:.1f}f

    private val grand: Path by lazy {{ chemin(GRAND_D) }}
    private val petit: Path by lazy {{ chemin(PETIT_D) }}

    /** Largeur du cadre, en pixels, pour ce corps (le cadre fait `corps` de haut). */
    fun largeur(corps: Float, forme: FormeLogotype) =
        corps * (if (forme == FormeLogotype.GRAND) LARGEUR_GRAND else LARGEUR_PETIT) / UNITES

    /** Dessine le mot dans le cadre dont le coin haut-gauche est `hautGauche`. */
    fun DrawScope.dessiner(hautGauche: Offset, corps: Float, forme: FormeLogotype,
                           encre: Color, jaune: Color = Papier.jaune) {{
        val s = corps / UNITES
        withTransform({{
            translate(hautGauche.x, hautGauche.y + BASE * s)
            scale(s, s, pivot = Offset.Zero)
        }}) {{
            if (forme == FormeLogotype.GRAND) {{
                withTransform({{ translate(0.03f * UNITES, 0.03f * UNITES) }}) {{ drawPath(grand, jaune) }}
                drawPath(grand, encre)
            }} else {{
                drawPath(petit, encre)
            }}
        }}
    }}

    /** Lit un chemin écrit en `M x y`, `L x y`, `Q cx cy x y`, `Z` (coordonnées absolues). */
    private fun chemin(d: String): Path {{
        val p = Path()
        val j = d.split(' ', '\\n').filter {{ it.isNotEmpty() }}
        var i = 0
        fun n() = j[i++].toFloat()
        while (i < j.size) {{
            when (j[i++]) {{
                "M" -> p.moveTo(n(), n())
                "L" -> p.lineTo(n(), n())
                "Q" -> p.quadraticTo(n(), n(), n(), n())
                "Z" -> p.close()
            }}
        }}
        return p
    }}

    private val GRAND_D = """
{wrap(G)}
""".trimIndent()

    private val PETIT_D = """
{wrap(Pt)}
""".trimIndent()
}}

/** Le logotype comme vue : cadre de `corps` de haut, largeur déduite de la forme. */
@Composable
fun Logotype(sombre: Boolean, corps: Float, forme: FormeLogotype = FormeLogotype.PETIT) {{
    val densite = LocalDensity.current
    val largeur = with(densite) {{ Logotype.largeur(corps * densite.density, forme).toDp() }}
    Canvas(Modifier.size(largeur, corps.dp).clearAndSetSemantics {{ contentDescription = "Anagnosis" }}) {{
        with(Logotype) {{ dessiner(Offset.Zero, corps * density, forme, Papier.texte(sombre)) }}
    }}
}}
'''
open('../../../Anagnosis-app/Anagnosis/Composants/Logotype.swift','w').write(swift); open('../../../Anagnosis-android/app/src/main/java/com/anagnosis/app/composants/Logotype.kt','w').write(kotlin)
print(len(swift),len(kotlin))
