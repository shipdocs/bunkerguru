"""MS Silja, cruiseschip als opvangschip (woonschip voor vluchtelingen) in de Merwehaven: een
moderne witte cruiseferry van ~200 x 30 m met tien dekken ramen en balkons, een blauwe
streep over de romp en één schoorsteen achter. Een eyecatcher in de oude fruithaven;
's avonds brandt er overal licht.
    blender/make.sh opvangschip --glb 3d/assets/landmarks/opvangschip.glb
Assen: +X = boeg, +Y = bakboord, Z omhoog, waterlijn Z = 0."""
import bglib as B

B.reset()
wit = B.mat('wit', '#f4f4f0', rough=0.45)
blauw = B.mat('blauw', '#1f4f8f', rough=0.5)
donker = B.mat('donker', '#2a3036', rough=0.6)
glas = B.mat('glas', '#2c4a5c', rough=0.2, metal=0.3)
balkon = B.mat('balkon', '#cfd6db', rough=0.5)
geel = B.mat('geel', '#f0b429', rough=0.5)
licht = B.mat('licht', '#ffd596', emit=2.0)

HB = 15.0
st = [(-100, 13.5), (-97, 15.0), (40, 15.0), (70, 13.5), (88, 8.5), (98, 3.0), (102, 0.0)]
B.loft('onderwater', B.hull_outline(st), 0, 1.5, donker)
B.loft('romp', B.hull_outline(st), 1.5, 13, wit)
B.loft('streep', B.hull_outline([(x, w + 0.15) for x, w in st[:-1]] + [(102.3, 0)]), 5, 7.5, blauw)
for face in (-1, 1):
    B.facade(f'poorten{face}', -92, 80, 8.5, 12, face * HB, face, 3.2, 2.5, 1.4, 1.0, glas, licht, 0.5,
             2 + face)
# De opbouw: één hoog blok, iets smaller, achter afgerond, met balkons en ramen.
top = 13.0
for i in range(9):
    z0 = top + i * 3.0
    x1 = 62 - max(0, i - 5) * 6
    B.box(f'dek{i}', (x1 + 92, 2 * (HB - 0.6), 3.0), ((x1 - 92) / 2, 0, z0 + 1.5), wit)
    for face in (-1, 1):
        B.facade(f'ramen{i}{face}', -88, x1 - 3, z0 + 0.6, z0 + 2.4, face * (HB - 0.6), face, 3.6, 3, 2.8,
                 1.6, glas, licht, 0.55, 20 * i + face)
    if 1 <= i <= 6:
        for face in (-1, 1):
            B.box(f'balkon{i}{face}', (x1 + 84, 0.8, 0.9), ((x1 - 84) / 2, face * (HB - 0.1), z0 + 0.4),
                  balkon)
B.box('brug', (8, 2 * HB + 4, 3.2), (58, 0, top + 6 * 3.0 + 1.6), wit)
B.box('brugramen', (8.2, 2 * HB + 4.2, 1.2), (58, 0, top + 6 * 3.0 + 2), glas)
B.box('zonnedek', (80, 2 * HB - 4, 1.0), (-30, 0, top + 27.5), balkon)
# Schoorsteen achter, in rederijkleur.
B.box('schoorsteen', (14, 9, 12), (-62, 0, top + 33), wit, bevel=1.5)
B.box('schoorsteenband', (14.3, 9.3, 2.4), (-62, 0, top + 36), blauw)
B.box('schoorsteentop', (12, 7, 1), (-62, 0, top + 39.4), donker)
# Sloepen.
for face in (-1, 1):
    for k in range(7):
        B.box(f'sloep{face}{k}', (9, 3, 2.6), (-60 + k * 13, face * (HB + 0.6), top + 3.6), geel, bevel=0.8)
B.finish(__file__)
