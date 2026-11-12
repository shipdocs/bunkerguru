"""Witte Huis, Wijnhaven (1898): het eerste 'hoge' kantoorgebouw van Europa, 45 m, wit
geglazuurde baksteen, hoektorentjes en een leien mansardekap met lantaarn.
    blender/make.sh whitehouse --glb 3d/assets/landmarks/whitehouse.glb
Assen: -Y naar het water, Z omhoog, maaiveld Z = 0."""
import bglib as B

B.reset()
wit = B.mat('wit', '#f3f0e4', rough=0.7)
room = B.mat('room', '#ded6bf', rough=0.8)
lei = B.mat('lei', '#4f6370', rough=0.6)
glas = B.mat('glas', '#3a5462', rough=0.3)
goud = B.mat('goud', '#d6a841', rough=0.4, metal=0.6)
licht = B.mat('licht', '#ffd596', emit=2.0)

W, H = 18, 31  # tot de knop op de spits: 45 m
B.box('romp', (W, W, H), (0, 0, H / 2), wit)
B.box('plint', (W + 0.6, W + 0.6, 4), (0, 0, 2), room)
for z in (4.2, 11, 18, 25, 30.6):
    B.box(f'lijst{z}', (W + 0.5, W + 0.5, 0.5), (0, 0, z), room)
for face, y in ((-1, -W / 2), (1, W / 2)):
    B.facade(f'ramen{face}', -W / 2 + 2, W / 2 - 2, 5, 30, y, face, 2.4, 3.2, 1.2, 2.2, glas, licht,
             0.4, 3 + face)
for face, x in ((-1, -W / 2), (1, W / 2)):
    B.facade(f'zij{face}', -W / 2 + 2, W / 2 - 2, 5, 30, x, face, 2.4, 3.2, 1.2, 2.2, glas, licht,
             0.4, 9 + face, axis='Y')
# Mansardekap met lantaarn.
B.loft('kap', [(-W / 2, -W / 2), (W / 2, -W / 2), (W / 2, W / 2), (-W / 2, W / 2)], H, H + 6, lei,
       taper=0.62)
B.loft('kapdak', [(-5.6, -5.6), (5.6, -5.6), (5.6, 5.6), (-5.6, 5.6)], H + 6, H + 8, lei, taper=0.3)
B.cyl('lantaarn', 1.4, 3, (0, 0, H + 9.2), room, verts=12)
B.cyl('spits', 1.0, 3, (0, 0, H + 12.2), lei, verts=12, r2=0.05)
B.sphere('knop', 0.4, (0, 0, H + 13.8), goud)
# Vier ronde hoektorentjes met een spitse kap.
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx * (W / 2), sy * (W / 2)
        B.cyl(f'hoek{sx}{sy}', 1.9, H + 2, (x, y, (H + 2) / 2), wit, verts=16)
        B.cyl(f'hoekkap{sx}{sy}', 2.2, 5, (x, y, H + 4.5), lei, verts=16, r2=0.1)
B.finish(__file__)
