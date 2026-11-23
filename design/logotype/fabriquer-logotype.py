import sys; sys.path.insert(0,'pylib')  # pip install --target pylib fonttools
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
P='/Volumes/SSD 1To/Anagnosis/Anagnosis-app/Anagnosis/Ressources/Polices/Newsreader.ttf'
OUT='/Volumes/SSD 1To/Anagnosis/Anagnosis-repo/design/logotype/'
f0=TTFont(P); print([(a.axisTag,a.minValue,a.maxValue) for a in f0['fvar'].axes])
def mot(texte,wght,opsz,track,kern={}):
    f=instancer.instantiateVariableFont(TTFont(P),{'wght':wght,'opsz':opsz})
    gs=f.getGlyphSet(); cm=f.getBestCmap(); upm=f['head'].unitsPerEm
    x=0; d=[]
    prev=None
    for i,c in enumerate(texte):
        g=cm[ord(c)]; x+=kern.get(prev+c,0) if prev else 0
        pen=SVGPathPen(gs); tp=TransformPen(pen,(1,0,0,-1,x,0)); gs[g].draw(tp)
        d.append(pen.getCommands()); x+=gs[g].width+track; prev=c
    asc=f['OS/2'].sCapHeight
    return ' '.join(d),x-track,upm,asc
def svg(d,w,upm,cap,couleurs,fond=None,dec=0.03,marge=0.06,desc=0.3):
    H=cap+upm*desc  # place pour la descente du g
    mx=upm*marge
    top=cap+upm*0.09
    vb=f"{-mx:.0f} {-top:.0f} {w+2*mx+upm*dec:.0f} {top+upm*desc+upm*dec+mx:.0f}"
    s=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Anagnosis">'
    if fond: s+=f'<rect x="{-mx:.0f}" y="{-top:.0f}" width="{w+2*mx+upm*dec:.0f}" height="{top+upm*desc+upm*dec+mx:.0f}" fill="{fond}"/>'
    if len(couleurs)==2:
        s+=f'<path d="{d}" fill="{couleurs[1]}" transform="translate({upm*dec:.0f} {upm*dec:.0f})"/>'
    s+=f'<path d="{d}" fill="{couleurs[0]}"/></svg>'
    return s
T='Anagnosis'
# grand : corps optique haut, graisse 640, approche serrée
d,w,upm,cap=mot(T,540,72,22,{'An':25})
open(OUT+'anagnosis-logotype.svg','w').write(svg(d,w,upm,cap,['#1B1A17','#FFE800']))
open(OUT+'anagnosis-logotype-noir.svg','w').write(svg(d,w,upm,cap,['#1B1A17']))
open(OUT+'anagnosis-logotype-sombre.svg','w').write(svg(d,w,upm,cap,['#EDE3D0','#FFE800'],fond='#241F1A'))
# petit : corps optique bas, graisse 700, interlettre ouverte, un seul ton
d2,w2,u2,c2=mot(T,640,6,60,{'An':20})
open(OUT+'anagnosis-logotype-petit.svg','w').write(svg(d2,w2,u2,c2,['#1B1A17']))
print(w/upm,w2/u2)
