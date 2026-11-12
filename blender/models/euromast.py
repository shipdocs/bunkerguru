"""Euromast, Rotterdam (1960, Space Tower 1970): betonnen schacht tot 96 m met het
kraaiennest, daarop de stalen Space Tower met de draaiende Euroscoop-cabine, 185 m.
Onderaan het paviljoen in het Park. Voor de 3D-versie (landmarks):
    blender/make.sh euromast --glb 3d/assets/landmarks/euromast.glb
Proefbeeld: blender/make.sh euromast --png $SCRATCH/euromast.png --view iso --px 3
Assen: +X oost, +Y noord, Z omhoog, maaiveld Z = 0; de kant naar het water is -Y."""
import math

import bglib as B

B.reset()
beton = B.mat('beton', '#e9e4d6', rough=0.8)
beton2 = B.mat('beton2', '#d6cfbd', rough=0.8)
glas = B.mat('glas', '#3f6478', rough=0.2, metal=0.3)
staal = B.mat('staal', '#c9ccd2', rough=0.4, metal=0.5)
rood = B.mat('rood', '#c8372d', rough=0.5)
licht = B.mat('licht', '#ffd596', emit=2.0)
groen = B.mat('groen', '#5f8f5a', rough=0.9)

# Paviljoen aan de voet: lage ronde vleugel en een langwerpig blok met glasband.
B.box('paviljoen', (44, 20, 6), (0, 6, 3), beton2)
B.box('paviljoen-glas', (44.4, 20.4, 2.4), (0, 6, 3.4), glas)
B.box('paviljoen-dak', (46, 22, 0.8), (0, 6, 6.4), beton)
B.facade('paviljoen-ramen', -20, 20, 2.4, 4.4, -4.2, -1, 3, 3, 2.2, 1.6, glas, licht, 0.6, 3)
B.cyl('voet', 9, 3, (0, 0, 1.5), beton2, verts=40)
B.box('gras', (60, 34, 0.3), (0, 6, 0.15), groen)

# De schacht: 9 m doorsnee, met de liftschacht als smalle rib aan de noordkant.
B.cyl('schacht', 4.6, 92, (0, 0, 46), beton, verts=40)
B.box('liftrib', (2.6, 1.6, 92), (0, 4.6, 46), beton2)
for z in (30, 60):
    B.cyl(f'kraag{z}', 4.9, 0.6, (0, 0, z), beton2, verts=40)

# Kraaiennest: een kelk die uitwaaiert naar de brede schijf met het restaurant.
B.cyl('kelk', 5.0, 8, (0, 0, 88), beton, verts=48, r2=13.5)
B.cyl('vloer', 15.5, 1.2, (0, 0, 92.6), beton, verts=48)
B.cyl('nestglas', 14.6, 4.2, (0, 0, 95.3), glas, verts=48)
for i in range(24):
    a = i / 24 * 2 * math.pi
    B.box(f'stijl{i}', (0.5, 0.5, 4.2), (14.7 * math.cos(a), 14.7 * math.sin(a), 95.3), beton,
          rot=(0, 0, a))
B.cyl('nestglas-licht', 14.75, 2.6, (0, 0, 95.2), licht, verts=48)
B.cyl('nestdak', 15.8, 1.0, (0, 0, 97.9), beton, verts=48)
B.cyl('nestkap', 9, 3, (0, 0, 99.9), beton2, verts=40, r2=6)

# Space Tower: stalen buis, licht taps, met de Euroscoop (ringcabine) halverwege.
B.cyl('spacetower', 2.6, 80, (0, 0, 141), staal, verts=24, r2=1.7)
B.cyl('euroscoop', 6.5, 4.6, (0, 0, 126), glas, verts=40)
B.cyl('euroscoop-licht', 6.6, 2.6, (0, 0, 126), licht, verts=40)
B.cyl('euroscoop-dak', 6.9, 0.8, (0, 0, 128.7), staal, verts=40)
B.cyl('euroscoop-bodem', 6.9, 0.8, (0, 0, 123.3), staal, verts=40)
B.cyl('top', 1.7, 2, (0, 0, 182), staal, verts=16, r2=1.0)
B.beam('antenne', (0, 0, 183), (0, 0, 186), 0.3, rood)
B.finish(__file__)
