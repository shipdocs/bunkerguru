"""Willemsbrug (1981): rode tuibrug met op elke rivierpijler twee rode pylonen, aan elke
kant van het dek, en waaiers van tuien naar beide kanten. Alleen pylonen en tuien.
    blender/make.sh willemsbrug --glb 3d/assets/landmarks/willemsbrug.glb
Assen: +X langs het dek, Y dwars, Z omhoog. Oorsprong: een pijler op het water, wegdek op Z = 30."""
import bglib as B

B.reset()
rood = B.mat('rood', '#d0342c', rough=0.5, metal=0.2)
donker = B.mat('donkerrood', '#9c2620', rough=0.6)
kabel = B.mat('kabel', '#e1e4e6', rough=0.4, metal=0.4)

DECK = 30.0
TOP = 92.0
for s in (-1, 1):
    y = s * 13.6
    B.beam(f'pyloon{s}', (0, y, 2), (0, y, TOP), 1.8, rood, verts=8, r2=1.2)
    B.box(f'kop{s}', (3.4, 3.4, 4), (0, y, TOP + 1), donker)
    B.box(f'voet{s}', (5, 5, 3), (0, y, 1.5), donker)
    for i in range(1, 6):
        za = TOP - 2 - i * 3.2
        for d in (-1, 1):
            B.beam(f'tui{s}{i}{d}', (0, y, za), (d * (18 + i * 21), y, DECK), 0.22, kabel, verts=6)
B.box('dwarsbalk', (4, 30, 3), (0, 0, DECK - 3), donker)
B.box('bovenbalk', (2.4, 28, 2.4), (0, 0, TOP - 6), rood)
B.finish(__file__)
