"""De Kuip, Feijenoord (1937): ovale stalen tribunes in twee ringen, de zwevende dakrand,
trappentorens rondom en vier lichtmasten. Ongeveer 160 x 125 m.
    blender/make.sh dekuip --glb 3d/assets/landmarks/dekuip.glb
Assen: Z omhoog, maaiveld Z = 0; de lange as langs X."""
import math

import bglib as B

B.reset()
staal = B.mat('staal', '#b9bdc0', rough=0.6, metal=0.3)
donker = B.mat('donker', '#6c7378', rough=0.7)
stoel = B.mat('stoelen', '#c7473d', rough=0.8)
stoel2 = B.mat('stoelen2', '#e8e4dc', rough=0.8)
gras = B.mat('gras', '#4f9a4c', rough=0.9)
dak = B.mat('dak', '#eef1f3', rough=0.5)
licht = B.mat('licht', '#fff1c9', emit=3.0)

N = 64


def ellipse(a, b):
    return [(a * math.cos(2 * math.pi * i / N), b * math.sin(2 * math.pi * i / N)) for i in range(N)]


def bowl(name, outer, inner, z_out, z_in, material):
    """Schuin aflopende tribune: van de buitenrand (hoog) naar de binnenrand (laag)."""
    vs = [(x, y, 0) for x, y in outer] + [(x, y, z_out) for x, y in outer] + \
         [(x, y, z_in) for x, y in inner] + [(x, y, 0) for x, y in inner]
    fs = []
    for i in range(N):
        j = (i + 1) % N
        fs.append((i, j, N + j, N + i))                    # buitenwand
        fs.append((N + i, N + j, 2 * N + j, 2 * N + i))    # zitplaatsen
        fs.append((2 * N + i, 2 * N + j, 3 * N + j, 3 * N + i))  # borstwering
    return B._mesh_object(name, vs, fs, material, 0, None)


B.ring('gevel', ellipse(80, 63), ellipse(78, 61), 0, 26, staal)
for z in (8, 16):
    B.ring(f'omloop{z}', ellipse(81.5, 64.5), ellipse(79.5, 62.5), z, z + 1.2, donker)
bowl('ondering', ellipse(78, 61), ellipse(56, 42), 12, 2.5, stoel)
bowl('boven', ellipse(78, 61), ellipse(68, 52), 25, 13, stoel2)
B.cyl('veld', 1, 0.6, (0, 0, 0.3), gras, verts=48).scale = (56, 42, 1)
B.box('middenlijn', (0.6, 60, 0.7), (0, 0, 0.35), dak)
B.ring('dakrand', ellipse(82, 65), ellipse(66, 50), 27, 29.5, dak)
# Trappentorens: de stalen trappenhuizen tegen de buitenkant.
for i in range(10):
    a = 2 * math.pi * (i + 0.5) / 10
    x, y = 84 * math.cos(a), 67 * math.sin(a)
    B.cyl(f'trap{i}', 3.4, 24, (x, y, 12), donker, verts=10)
    B.cyl(f'trapdak{i}', 3.8, 1, (x, y, 24.5), staal, verts=10)
# Lichtmasten met hun lampenbord.
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx * 72, sy * 58
        B.beam(f'mast{sx}{sy}', (x, y, 0), (x * 0.97, y * 0.97, 52), 1.0, staal, verts=8)
        B.box(f'bord{sx}{sy}', (12, 2, 7), (x * 0.96, y * 0.96, 54), donker, rot=(0, 0, math.atan2(y, x) + math.pi / 2))
        B.box(f'lampen{sx}{sy}', (11, 0.4, 6), (x * 0.95, y * 0.95, 54), licht, rot=(0, 0, math.atan2(y, x) + math.pi / 2))
B.finish(__file__)
