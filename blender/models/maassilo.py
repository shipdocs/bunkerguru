"""Maassilo, Maashaven (1911, uitgebreid 1930): het lange betonnen graanpakhuis met de
hoge elevatortoren aan de kop, staande lisenen en een galerij met ramen boven de silo's.
    blender/make.sh maassilo --glb 3d/assets/landmarks/maassilo.glb
Assen: +X langs de kade, -Y naar het water, Z omhoog, maaiveld Z = 0."""
import bglib as B

B.reset()
beton = B.mat('beton', '#d3cab6', rough=0.9)
beton2 = B.mat('beton2', '#bfb59f', rough=0.9)
glas = B.mat('glas', '#3e5562', rough=0.3)
rood = B.mat('rood', '#b8664e', rough=0.8)
dak = B.mat('dak', '#6f6a62', rough=0.8)
licht = B.mat('licht', '#ffd596', emit=2.0)

L, D, H = 92, 22, 40
B.box('silo', (L, D, H), (8, 0, H / 2), beton)
for i in range(16):
    x = 8 - L / 2 + 3 + i * (L - 6) / 15
    for y in (-D / 2 - 0.5, D / 2 + 0.5):
        B.box(f'lisene{i}{y}', (1.6, 1.0, H - 4), (x, y, (H - 4) / 2), beton2)
B.box('galerij', (L + 0.6, D + 0.6, 6), (8, 0, H + 3), beton2)
B.facade('galerijramen', 8 - L / 2 + 2, 8 + L / 2 - 2, H + 1, H + 5, -D / 2 - 0.3, -1, 3.2, 4, 2.2, 2.4, glas, licht, 0.4, 2)
B.facade('galerijramen2', 8 - L / 2 + 2, 8 + L / 2 - 2, H + 1, H + 5, D / 2 + 0.3, 1, 3.2, 4, 2.2, 2.4, glas, licht, 0.4, 3)
B.box('dak', (L + 1.2, D + 1.2, 0.8), (8, 0, H + 6.4), dak)
# De elevatortoren aan de westkop, met een rood bovenstuk.
TX = 8 - L / 2 - 8
B.box('toren', (16, D, 66), (TX, 0, 33), beton)
B.box('torenkop', (16.6, D + 0.6, 6), (TX, 0, 63), rood)
B.box('torendak', (17.4, D + 1.4, 1), (TX, 0, 66.5), dak)
B.facade('torenramen', TX - 6, TX + 6, 6, 58, -D / 2, -1, 4, 6, 1.4, 3.6, glas, licht, 0.35, 5)
B.facade('torenramen2', -D / 2 + 2, D / 2 - 2, 6, 58, TX - 8, -1, 4, 6, 1.4, 3.6, glas, licht, 0.35, 6, axis='Y')
# Laag kantoorgebouw aan de kade.
B.box('kantoor', (30, 10, 12), (30, -D / 2 - 5, 6), beton2)
B.facade('kantoorramen', 17, 43, 2, 11, -D / 2 - 10, -1, 3, 3.6, 1.8, 2.2, glas, licht, 0.5, 7)
B.finish(__file__)
