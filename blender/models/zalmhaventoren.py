"""Zalmhaventoren (2022): met 215 m de hoogste toren van Nederland. Lichte gevel met staande
lamellen, ramen per verdieping en een getrapte kroon.
    blender/make.sh zalmhaventoren --glb 3d/assets/landmarks/zalmhaventoren.glb
Assen: -Y naar het water, Z omhoog, maaiveld Z = 0."""
import bglib as B

B.reset()
gevel = B.mat('gevel', '#efece4', rough=0.6)
lamel = B.mat('lamel', '#d7d3c8', rough=0.6)
glas = B.mat('glas', '#5a7787', rough=0.2, metal=0.3)
kroon = B.mat('kroon', '#d7dde2', rough=0.5)
plint = B.mat('plint', '#8d8a82', rough=0.8)
licht = B.mat('licht', '#ffd596', emit=2.0)

W, D, H = 28, 26, 194  # kroon tot 209 m, mast tot 215 m
B.box('plint', (W + 14, D + 10, 9), (0, 0, 4.5), plint)
B.box('romp', (W, D, H), (0, 0, H / 2), glas)
for z in range(10, H - 2, 4):
    B.box(f'vloer{z}', (W + 0.3, D + 0.3, 1.1), (0, 0, z), gevel)
for i in range(8):
    u = -W / 2 + 1.5 + i * (W - 3) / 7
    for y in (-D / 2 - 0.4, D / 2 + 0.4):
        B.box(f'lamel{i}{y}', (0.8, 0.8, H - 10), (u, y, 5 + (H - 10) / 2), lamel)
    v = -D / 2 + 1.5 + i * (D - 3) / 7
    for x in (-W / 2 - 0.4, W / 2 + 0.4):
        B.box(f'lamelz{i}{x}', (0.8, 0.8, H - 10), (x, v, 5 + (H - 10) / 2), lamel)
for face in (-1, 1):
    B.facade(f'licht{face}', -W / 2 + 1, W / 2 - 1, 11, H - 2, face * (D / 2 + 0.1), face, 3.4, 4, 2.6, 2.2, None, licht, 0.25, 3 + face)
    B.facade(f'lichtz{face}', -D / 2 + 1, D / 2 - 1, 11, H - 2, face * (W / 2 + 0.1), face, 3.4, 4, 2.6, 2.2, None, licht, 0.25, 9 + face, axis='Y')
# Getrapte kroon.
for i, (s, h) in enumerate(((0.92, 6), (0.78, 5), (0.6, 4))):
    z = H + sum(hh for _, hh in ((0.92, 6), (0.78, 5), (0.6, 4))[:i])
    B.box(f'kroon{i}', (W * s, D * s, h), (0, 0, z + h / 2), kroon)
B.box('mast', (1, 1, 6), (0, 0, H + 18), lamel)
B.finish(__file__)
