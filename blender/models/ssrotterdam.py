"""SS Rotterdam (1959), het vroegere vlaggenschip van de Holland-Amerika Lijn, nu
hotelschip aan de Maashaven-kant van de Katendrechtse Hoofd: 228 x 29 m, lichtgrijze
romp met een dun geel lijntje en een rode waterlijn, witte opbouw, en in plaats van één
schoorsteen twee hoge witte uitlaten naast elkaar achter het midden; een hoge mast voor.
    blender/make.sh ssrotterdam --glb 3d/assets/landmarks/ssrotterdam.glb
Assen: +X = boeg, +Y = bakboord, Z omhoog, waterlijn Z = 0."""
import bglib as B

B.reset()
romp = B.mat('romp', '#dfe2de', rough=0.5)
rood = B.mat('onderwater', '#a8382c', rough=0.7)
wit = B.mat('wit', '#f2f1ec', rough=0.5)
dek = B.mat('dek', '#b79d78', rough=0.8)
glas = B.mat('glas', '#2f4553', rough=0.3)
geel = B.mat('geel', '#e3b33c', rough=0.5)
donker = B.mat('donker', '#22272b', rough=0.6)
licht = B.mat('licht', '#ffd596', emit=2.0)

L, HB = 228.0, 14.4
st = [(-114, 9.5), (-110, 12.5), (-100, 14.0), (-60, 14.4), (40, 14.4), (75, 12.5), (95, 8.5),
      (108, 3.5), (114, 0.0)]
B.loft('waterlijn', B.hull_outline(st), 0, 1.6, rood)
B.loft('romp', B.hull_outline(st), 1.6, 12, romp)
B.loft('geellijn', B.hull_outline([(x, w + 0.12) for x, w in st[:-1]] + [(114.2, 0)]), 9.6, 10.1, geel)
B.loft('dek', B.hull_outline([(x, max(w - 0.4, 0)) for x, w in st[:-1]] + [(113, 0)]), 12, 12.4, dek)
# Patrijspoorten in de romp, een deel verlicht.
for face in (-1, 1):
    B.facade(f'poorten{face}', -95, 85, 5.5, 10.5, face * HB, face, 4.2, 2.6, 1.0, 1.0, glas, licht, 0.3,
             3 + face)
# Witte opbouw in lagen, smaller naar boven, met ramenrijen.
for i, (x0, x1, hb, z0, h) in enumerate(((-85, 70, 13.0, 12.4, 3.2), (-75, 62, 12.0, 15.6, 3.0),
                                         (-62, 55, 11.0, 18.6, 3.0), (-30, 52, 9.0, 21.6, 3.0))):
    B.box(f'opbouw{i}', (x1 - x0, 2 * hb, h), ((x0 + x1) / 2, 0, z0 + h / 2), wit)
    for face in (-1, 1):
        B.facade(f'ramen{i}{face}', x0 + 3, x1 - 3, z0 + 0.8, z0 + h - 0.6, face * hb, face, 3.4, 3, 2.2,
                 1.4, glas, licht, 0.45, 10 * i + face)
B.box('brug', (6, 26, 3.2), (49, 0, 26.2), wit)
B.box('brugramen', (6.2, 26.2, 1.2), (49, 0, 26.5), glas)
# Sloepen langs het sloependek.
for face in (-1, 1):
    for k in range(8):
        B.box(f'sloep{face}{k}', (8, 2.6, 2.2), (-50 + k * 11, face * 12.4, 20.4), geel, bevel=0.6)
# De twee hoge witte uitlaten naast elkaar, achter het midden, op een witte voet.
for y in (-3.6, 3.6):
    B.cyl(f'uitlaat{y}', 2.0, 22, (-40, y, 33), wit, verts=16, r2=1.7)
    B.cyl(f'uitlaatkop{y}', 1.8, 1.0, (-40, y, 44.4), donker, verts=16)
B.box('uitlaatvoet', (14, 13, 4), (-40, 0, 24.6), wit)
# Masten: de hoge voormast boven de brug en een kleinere achter.
B.beam('voormast', (52, 0, 26), (52, 0, 52), 0.7, wit, verts=8)
B.beam('ra', (52, -7, 44), (52, 7, 44), 0.3, wit, verts=6)
B.beam('achtermast', (-70, 0, 22), (-70, 0, 36), 0.45, wit, verts=8)
# Het achterdek met het zwembad, trapsgewijs naar de ronde spiegel.
B.box('zwembad', (14, 9, 0.6), (-92, 0, 12.6), B.mat('water', '#3fa7c9', rough=0.1))
B.finish(__file__)
