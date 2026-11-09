"""Havensleepboot, 26 x 10 m, recht van boven (zoals art/tug.png: boeg naar rechts).
blender/make.sh sleepboot --png art/tug.png --px 10"""
import bglib as B

B.reset()
romp = B.mat('romp', '#2b3136', rough=0.5)
dek = B.mat('dek', '#9aa3a6', rough=0.8)
fender = B.mat('fender', '#151719', rough=0.9)
wit = B.mat('wit', '#f1f1ec', rough=0.4)
glas = B.mat('glas', '#5d8fa6', rough=0.1, metal=0.3)
oranje = B.mat('bedrijf', '#e8862e', rough=0.5)
geel = B.mat('geel', '#f2c230', rough=0.5)

# Romp: stations (x, halve breedte) van spiegel tot boeg
st = [(-13, 4.3), (-12.4, 4.7), (-11, 4.9), (-6, 5.0), (2, 5.0), (7, 4.5), (10.5, 3.2), (12.5, 1.6), (13.2, 0.0)]
B.loft('romp', B.hull_outline(st), -1.2, 1.4, romp, bevel=0.25)
inner = [(x, max(w - 0.6, 0.0)) for x, w in st[:-1]] + [(12.3, 0.0)]
B.loft('dek', B.hull_outline(inner), 1.0, 1.5, dek)
B.loft('fenderrand', B.hull_outline([(x, w + 0.35) for x, w in st[:-1]] + [(13.7, 0)]), 0.6, 1.3, fender, bevel=0.3)
B.ring('verschansing', B.hull_outline([(x, w - 0.05) for x, w in st[:-1]] + [(13.1, 0)]),
       B.hull_outline([(x, max(w - 0.45, 0.0)) for x, w in st[:-1]] + [(12.6, 0)]), 1.4, 2.2, oranje, bevel=0.05)
# Opbouw en stuurhuis
B.box('opbouw', (9, 6.4, 2.6), (1.5, 0, 2.8), wit, bevel=0.3)
B.box('stuurhuis', (4.6, 5.4, 2.2), (2.8, 0, 5.1), wit, bevel=0.3)
B.box('ramen', (4.7, 5.5, 0.9), (2.8, 0, 5.4), glas, bevel=0.2)
B.box('dak', (4.9, 5.8, 0.3), (2.8, 0, 6.35), oranje, bevel=0.1)
for y in (-1.2, 1.2):
    B.box(f'schoorsteen{y}', (1.4, 1.0, 2.6), (-2.2, y, 5.0), oranje, bevel=0.15)
    B.box(f'uitlaat{y}', (0.7, 0.5, 0.2), (-2.2, y, 6.35), fender)
# Achterdek: sleephaak en bolders
B.cyl('sleeplier', 0.9, 3.0, (-7.0, 0, 2.2), geel, axis='Y', bevel=0.05)
B.box('sleephaak', (1.2, 0.6, 0.6), (-10.5, 0, 2.0), geel, bevel=0.1)
for x, y in [(-11.5, 3.6), (-11.5, -3.6), (9.0, 2.6), (9.0, -2.6)]:
    B.cyl(f'bolder{x}{y}', 0.3, 0.8, (x, y, 1.9), geel)
B.finish(__file__)
