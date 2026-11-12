"""Hotel New York, Kop van Zuid (1901-1917, kantoor Holland-Amerika Lijn): rood baksteen
met witte natuurstenen banden, leien schilddak en twee torens met groene koperen koepels
en klokken aan de waterkant. Voor de 3D-versie:
    blender/make.sh hotelny --glb 3d/assets/landmarks/hotelny.glb
Assen: +X langs de kade, -Y naar het water, Z omhoog, maaiveld Z = 0."""
import bglib as B

B.reset()
steen = B.mat('baksteen', '#b0674a', rough=0.9)
wit = B.mat('natuursteen', '#ebe3cf', rough=0.8)
lei = B.mat('lei', '#55575c', rough=0.7)
koper = B.mat('koper', '#6fae9a', rough=0.6)
glas = B.mat('glas', '#34495a', rough=0.3)
klok = B.mat('klok', '#f4f0e2', rough=0.5)
goud = B.mat('goud', '#d6a841', rough=0.4, metal=0.6)
licht = B.mat('licht', '#ffd596', emit=2.0)

L, D, H = 44, 22, 17
B.box('gebouw', (L, D, H), (0, 0, H / 2), steen)
B.box('plint', (L + 0.6, D + 0.6, 2.2), (0, 0, 1.1), wit)
for z in (6.2, 11.4, 16.4):
    B.box(f'band{z}', (L + 0.4, D + 0.4, 0.6), (0, 0, z), wit)
B.box('kroonlijst', (L + 1.4, D + 1.4, 0.8), (0, 0, H + 0.4), wit)
# Schilddak: een loft van de dakvoet naar een smalle nok.
B.loft('dak', [(-L / 2, -D / 2), (L / 2, -D / 2), (L / 2, D / 2), (-L / 2, D / 2)], H + 0.8, H + 8,
       lei, taper=0.35)
for x in (-12, 0, 12):
    B.box(f'dakkapel{x}', (3.4, 2.4, 3), (x, -D / 2 + 2.4, H + 2.6), wit)
    B.box(f'dakkapelraam{x}', (2.2, 0.3, 1.8), (x, -D / 2 + 1.1, H + 2.5), glas)
# Ramen op alle gevels, in drie lagen.
for face, y in ((-1, -D / 2), (1, D / 2)):
    B.facade(f'ramen{face}', -L / 2 + 2, L / 2 - 2, 3, 16, y, face, 3.2, 5.0, 1.6, 2.8, glas, licht,
             0.45, 7 + face)
for face, x in ((-1, -L / 2), (1, L / 2)):
    B.facade(f'zijramen{face}', -D / 2 + 2, D / 2 - 2, 3, 16, x, face, 3.2, 5.0, 1.6, 2.8, glas,
             licht, 0.45, 11 + face, axis='Y')
# De twee torens aan de waterkant, met klok, koperen koepel en lantaarn.
for i, x in enumerate((-13, 13)):
    y = -D / 2 - 1.5
    B.box(f'toren{i}', (7.5, 7.5, 27), (x, y, 13.5), steen)
    B.box(f'torenband{i}', (8.0, 8.0, 0.7), (x, y, 17.6), wit)
    B.box(f'torenkroon{i}', (8.4, 8.4, 1.0), (x, y, 27.3), wit)
    for fx, fy, ax in ((0, -3.8, 'Y'), (3.8, 0, 'X')):
        B.cyl(f'klok{i}{ax}', 2.0, 0.3, (x + fx, y + fy, 22.4), klok, axis=ax, verts=24)
        B.cyl(f'klokrand{i}{ax}', 2.2, 0.2, (x + fx * 0.98, y + fy * 0.98, 22.4), goud, axis=ax,
              verts=24)
    B.cyl(f'koepelvoet{i}', 4.3, 1.4, (x, y, 28.5), koper, verts=24)
    B.sphere(f'koepel{i}', 4.2, (x, y, 29.2), koper, scale=(1, 1, 1.25))
    B.cyl(f'lantaarn{i}', 1.3, 2.6, (x, y, 35.4), koper, verts=12)
    B.cyl(f'spits{i}', 0.9, 2.6, (x, y, 38.0), koper, verts=12, r2=0.05)
    B.facade(f'torenramen{i}', x - 2.5, x + 2.5, 4, 16, y - 3.75, -1, 2.5, 4.4, 1.3, 2.4, glas, licht,
             0.5, 20 + i)
# Middenrisaliet met de ingang.
B.box('risaliet', (9, 1.6, 20), (0, -D / 2 - 0.4, 10), wit)
B.box('ingang', (4, 0.4, 4.4), (0, -D / 2 - 1.3, 2.2), glas)
B.finish(__file__)
