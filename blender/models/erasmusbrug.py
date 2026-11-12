"""Erasmusbrug, pyloon ('de Zwaan', 1996): een geknikte witte pyloon van 139 m die
achterover helt, poten aan weerszijden van het dek, tuien naar de hoofdoverspanning
en twee paar achtertuien. Alleen pyloon en tuien: het dek tekent het spel zelf.
    blender/make.sh erasmusbrug --glb 3d/assets/landmarks/erasmusbrug.glb
Assen: +X langs het dek (naar de achtertuien), Y dwars, Z omhoog. Oorsprong: de pyloon
op de pijler, water Z = 0, wegdek op Z = 36."""
import bglib as B

B.reset()
wit = B.mat('wit', '#e9eef3', rough=0.45, metal=0.15)
blauw = B.mat('blauwwit', '#d3dde6', rough=0.45, metal=0.2)
kabel = B.mat('kabel', '#dfe6ee', rough=0.4, metal=0.4)
beton = B.mat('beton', '#bdbdb6', rough=0.9)
rood = B.mat('rood', '#d0342c', rough=0.5)

DECK = 36.0
TOP = (34.0, 0.0, 139.0)
KNIK = 86.0
for s in (-1, 1):
    B.beam(f'poot{s}', (0, s * 15, 2), (10, s * 4.5, KNIK), 2.6, wit, verts=8, r2=1.9)
    B.cyl(f'voet{s}', 4.5, 4, (0, s * 15, 2), beton, verts=8)
B.beam('hals', (10, 0, KNIK - 2), TOP, 2.6, wit, verts=8, r2=1.4)
B.box('knik', (6, 11, 5), (10, 0, KNIK), wit)
B.box('dwarsligger', (6, 32, 4), (0, 0, DECK - 3), blauw)
B.sphere('kop', 1.8, TOP, wit)
B.beam('licht', TOP, (TOP[0] + 0.6, 0, TOP[2] + 3), 0.4, rood)
# Voortuien: twee vlakken naar de randen van het dek, waaierend langs de hals.
for i in range(1, 11):
    t = i / 11
    a = (10 + (TOP[0] - 10) * t, 0, KNIK + (TOP[2] - KNIK) * t)
    for s in (-1, 1):
        B.beam(f'tui{i}{s}', a, (-30 - i * 23, s * 12.5, DECK), 0.22, kabel, verts=6)
# Achtertuien: twee paar zware kabels naar het landhoofd.
for i, u in enumerate((70, 92)):
    for s in (-1, 1):
        B.beam(f'achtertui{i}{s}', (TOP[0] - 1 - i * 2, 0, TOP[2] - 3 - i * 5), (u, s * 6, DECK), 0.5,
               kabel, verts=6)
B.finish(__file__)
