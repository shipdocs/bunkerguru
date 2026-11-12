"""Depot Boijmans Van Beuningen, Museumpark (MVRDV, 2021): de spiegelende kom, 40 m hoog,
onder 30 m smaller dan boven, met een berkenbos op het dak.
    blender/make.sh depot --glb 3d/assets/landmarks/depot.glb
Assen: Z omhoog, maaiveld Z = 0."""
import math
import random

import bglib as B

B.reset()
spiegel = B.mat('spiegel', '#b9d3df', rough=0.08, metal=0.9)
spiegel2 = B.mat('spiegel2', '#9fbccb', rough=0.08, metal=0.9)
rand = B.mat('rand', '#eef2f3', rough=0.5)
groen = B.mat('berken', '#7fae6c', rough=0.9)
groen2 = B.mat('berken2', '#5f9965', rough=0.9)
stam = B.mat('stam', '#e8e4dc', rough=0.8)
glas = B.mat('glas', '#2f4553', rough=0.2)
licht = B.mat('licht', '#ffd596', emit=2.0)

B.cyl('kom', 20, 39, (0, 0, 19.5), spiegel, verts=48, r2=30)
# De spiegelende panelen als banden die het licht verschillend vangen.
for z in (8, 18, 28):
    r = 20 + 10 * z / 39
    B.cyl(f'band{z}', r + 0.15, 1.2, (0, 0, z), spiegel2, verts=48, r2=r + 0.45)
B.cyl('dakrand', 30.6, 1.4, (0, 0, 39.7), rand, verts=48)
B.cyl('dak', 29.5, 0.6, (0, 0, 40.1), groen2, verts=48)
# De diagonale trappen in het atrium, achter een raamstrook aan de waterkant.
B.box('atriumraam', (16, 0.6, 3), (0, -26.6, 30), glas, rot=(math.radians(-14), 0, 0))
B.box('atriumlicht', (14, 0.6, 2.2), (0, -26.9, 30), licht, rot=(math.radians(-14), 0, 0))
rnd = random.Random(4)
for i in range(22):
    a = rnd.uniform(0, 2 * math.pi)
    r = 25 * math.sqrt(rnd.uniform(0.05, 1))
    x, y, h = r * math.cos(a), r * math.sin(a), rnd.uniform(5, 8)
    B.beam(f'stam{i}', (x, y, 40.3), (x, y, 40.3 + h * 0.6), 0.25, stam, verts=6)
    B.cyl(f'kroon{i}', 2.2, h * 0.7, (x, y, 40.3 + h * 0.65), groen if i % 2 else groen2, verts=7, r2=0.3)
B.finish(__file__)
