"""Markthal, Blaak (MVRDV, 2014): een hoefijzerboog van woningen over de markt, grijze
natuursteen met vierkante ramen, glazen kopgevels en binnenin de kleurige Hoorn des
Overvloeds. 120 m lang, 70 m breed, 40 m hoog.
    blender/make.sh markthal --glb 3d/assets/landmarks/markthal.glb
Assen: de lengte langs Y (kopgevel naar het water is -Y), Z omhoog, maaiveld Z = 0."""
import math
import random

import bglib as B

B.reset()
steen = B.mat('steen', '#9aa3a8', rough=0.8)
glas = B.mat('glas', '#8fc4d4', rough=0.1, metal=0.2)
raam = B.mat('raam', '#3b5361', rough=0.3)
hoorn = B.mat('hoorn', '#e09a3e', rough=0.7)
markt = B.mat('markt', '#c9b48a', rough=0.9)
licht = B.mat('licht', '#ffd596', emit=2.0)

W, H, L, T = 35.0, 40.0, 110.0, 6.0


def profile(w, h, n=26):
    pts = []
    for k in range(n + 1):
        t = math.pi * k / n
        c, s = math.cos(t), math.sin(t)
        pts.append((w * math.copysign(abs(c) ** (2 / 3), c), h * abs(s) ** (2 / 3)))
    return pts


outer, inner = profile(W, H), profile(W - T, H - T)
inner = [(x, max(0.0, y)) for x, y in inner]


def along_y(ob):
    ob.rotation_euler = (math.pi / 2, 0, 0)  # profiel (x, hoogte) staand, lengte langs Y
    ob.location = (0, L / 2, 0)
    return ob


along_y(B.ring('boog', outer, inner, 0, L, steen))
binnen = [(x * 0.99, y * 0.99) for x, y in inner]
along_y(B.ring('hoorn', inner, binnen, 0.3, L - 0.3, hoorn))
for nm, z in (('kop-voor', L - 0.4), ('kop-achter', 0.0)):
    ob = B.loft(nm, inner, z, z + 0.4, glas)
    along_y(ob)
B.box('marktvloer', (2 * (W - T), L, 0.4), (0, 0, 0.2), markt)
# Kabelnet in de kopgevels: een paar staande stijlen.
for y in (-L / 2 - 0.1, L / 2 + 0.1):
    for x in range(-24, 25, 8):
        hgt = (H - T) * (1 - (abs(x) / (W - T)) ** 1.5) ** 0.66
        B.box(f'stijl{y}{x}', (0.3, 0.3, hgt), (x, y, hgt / 2), steen)
# Vierkante ramen over de boog: een rooster langs het profiel en de lengte.
rnd = random.Random(5)
vs, fs, gv, gf = [], [], [], []
for k in range(1, len(outer) - 1):
    (x0, z0), (x1, z1) = outer[k - 1], outer[k + 1]
    x, z = outer[k]
    tx, tz = x1 - x0, z1 - z0
    tl = math.hypot(tx, tz)
    tx, tz = tx / tl, tz / tl
    nx, nz = tz, -tx  # naar buiten
    if nx * x + nz * z < 0:
        nx, nz = -nx, -nz
    for j in range(22):
        y = -L / 2 + 4 + j * (L - 8) / 21
        for lst, fl, off, s in ((vs, fs, 0.06, 0.9), (gv, gf, 0.16, 0.7)):
            if lst is gv and rnd.random() > 0.35:
                continue
            a = len(lst)
            for du, dv in ((-s, -s), (s, -s), (s, s), (-s, s)):
                lst.append((x + tx * du + nx * off, y + dv, z + tz * du + nz * off))
            fl.append((a, a + 1, a + 2, a + 3))
B._mesh_object('ramen', vs, fs, raam, 0, None)
B._mesh_object('ramen-licht', gv, gf, licht, 0, None)
B.finish(__file__)
