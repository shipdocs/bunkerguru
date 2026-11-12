"""Kubuswoningen, Blaak (Piet Blom, 1984): gele kubussen op hun punt, elk op een
zeshoekige paal, als een bos over de weg; met de spitse Blaaktoren ('het Potlood').
    blender/make.sh cubes --glb 3d/assets/landmarks/cubes.glb
Assen: +X langs de rij, -Y naar het water, Z omhoog, maaiveld Z = 0."""
import math

from mathutils import Quaternion

import bglib as B

B.reset()
geel = B.mat('geel', '#f2c230', rough=0.6)
wit = B.mat('wit', '#f4f1e6', rough=0.6)
grijs = B.mat('grijs', '#b7b2a6', rough=0.8)
glas = B.mat('glas', '#3d5868', rough=0.3)
lei = B.mat('lei', '#5c6168', rough=0.6)
licht = B.mat('licht', '#ffd596', emit=2.0)

tilt = math.atan(math.sqrt(2))
q = Quaternion((0, 1, 0), -tilt) @ Quaternion((0, 0, 1), math.pi / 4)
rot = tuple(q.to_euler('XYZ'))
S = 8.5  # ribbe van een kubus
for row, y in enumerate((-6, 6)):
    for i in range(6):
        x = -26 + i * 10.4 + row * 5.2
        B.cyl(f'paal{row}{i}', 2.4, 9, (x, y, 4.5), grijs, verts=6)
        c = 9 + S * math.sqrt(3) / 2
        B.box(f'kubus{row}{i}', (S, S, S), (x, y, c), geel, rot=rot)
        B.box(f'kubusband{row}{i}', (S + 0.25, S + 0.25, S * 0.18), (x, y, c), wit, rot=rot)
        # een raam dat 's avonds brandt, op de waterkant
        B.box(f'raam{row}{i}', (2.2, 0.3, 1.6), (x, y - 3.9, c + 0.4), glas)
        if (row + i) % 2 == 0:
            B.box(f'raamlicht{row}{i}', (1.8, 0.3, 1.2), (x, y - 4.15, c + 0.4), licht)
B.box('loopbrug', (60, 3, 0.8), (0, 0, 9.2), grijs)
# De Blaaktoren: zeshoekig met een spitse leien kap.
B.cyl('potlood', 7.5, 32, (36, 6, 16), wit, verts=6)
B.cyl('potloodkap', 7.9, 18, (36, 6, 41), lei, verts=6, r2=0.2)
for z in range(6, 31, 4):
    B.cyl(f'potloodband{z}', 7.6, 1.5, (36, 6, z), glas, verts=6)
B.finish(__file__)
