"""Maeslantkering, Nieuwe Waterweg (1997): één helft van de stormvloedkering in rust, in
haar dok langs de oever. Een witte, gebogen holle keerdeur van 210 m lang en 22 m hoog,
twee vakwerkarmen van 237 m (liggende Eiffeltorens) die samenkomen in het stalen
kogelgewricht van 10 m doorsnee op zijn betonnen fundatie. Het spel zet twee helften
neer, gespiegeld op beide oevers.
    blender/make.sh maeslantkering --glb 3d/assets/landmarks/maeslantkering.glb
Assen: +X langs de rivier, -Y naar het water, Z omhoog; Z = 0 is het water, de oever 4 m
hoger. De deur ligt met haar rug op Y = 0, het gewricht landinwaarts op Y = +214."""
import math

import bglib as B

B.reset()
wit = B.mat('wit', '#f2f2ee', rough=0.5, metal=0.2)
wit2 = B.mat('wit2', '#dcdcd6', rough=0.5, metal=0.2)
geel = B.mat('geel', '#e0a42b', rough=0.5)
staal = B.mat('staal', '#c9ccd0', rough=0.4, metal=0.6)
beton = B.mat('beton', '#b9b6a6', rough=0.9)
donker = B.mat('donker', '#5d666b', rough=0.6)

R = 237.0  # arm: van het gewricht tot de deur
APEX = (0.0, 214.0)  # het gewricht, landinwaarts achter het midden van de deur
HALF = 105.0  # halve deurlengte
T = 8.0  # dikte van de holle deur
N = 24  # stukken langs de boog


def arc_y(x, r):
    """De deur is een boog om het gewricht: Y op de buitenkant bij X."""
    return APEX[1] - math.sqrt(r * r - x * x)


def curved_wall(name, r_out, r_in, z0, z1, material):
    vs, fs = [], []
    for i in range(N + 1):
        x = -HALF + 2 * HALF * i / N
        for r in (r_out, r_in):
            y = arc_y(x, r)
            vs += [(x, y, z0), (x, y, z1)]
    for i in range(N):
        a, b = 4 * i, 4 * (i + 1)
        fs += [(a, b, b + 1, a + 1),  # waterkant
               (a + 2, a + 3, b + 3, b + 2),  # landkant
               (a + 1, b + 1, b + 3, a + 3),  # boven
               (a, a + 2, b + 2, b)]  # onder
    e = 4 * N
    fs += [(0, 1, 3, 2), (e, e + 2, e + 3, e + 1)]  # kopse kanten
    return B._mesh_object(name, vs, fs, material, 0, None)


# De keerdeur: hol, wit, een gele rand bovenop, ribben aan de landkant.
curved_wall('deur', R, R - T, 0, 22, wit)
curved_wall('deurrand', R + 0.3, R - T - 0.3, 20.5, 22.6, geel)
for i in range(1, 14):
    x = -HALF + 2 * HALF * i / 14
    y = arc_y(x, R - T) + 1.2
    B.box(f'rib{i}', (1.4, 2.4, 21), (x, y, 10.5), wit2, rot=(0, 0, math.atan2(x, APEX[1] - y)))
curved_wall('waterlijn', R + 0.2, R - T - 0.2, 0, 3.5, donker)

# Vakwerkarmen: van elk deureinde een liggende toren naar het gewricht, met een boven-
# en onderregel en een zigzag van diagonalen ertussen.
J = (APEX[0], APEX[1], 10.0)
for s in (-1, 1):
    x0, y0 = s * HALF, arc_y(s * HALF, R - T)
    lo, hi = (x0, y0, 3.0), (x0, y0, 21.0)
    mid = (s * (HALF - 26), arc_y(s * (HALF - 26), R - T), 12.0)
    for a in (lo, hi, mid):
        B.beam(f'regel{s}{a[2]}', a, J, 1.6, wit, verts=8)
    STEPS = 10
    for k in range(STEPS):
        t0, t1 = k / STEPS, (k + 1) / STEPS
        p = lambda a, t: tuple(a[i] + (J[i] - a[i]) * t for i in range(3))
        top, bot = (hi, lo) if k % 2 == 0 else (lo, hi)
        B.beam(f'diag{s}{k}', p(top, t0), p(bot, t1), 0.7, wit2, verts=6)
        B.beam(f'stijl{s}{k}', p(lo, t1), p(hi, t1), 0.6, wit2, verts=6)
        B.beam(f'schoor{s}{k}', p(mid, t0), p(hi if k % 2 else lo, t1), 0.55, wit2, verts=6)
# Dwarsverbanden tussen de twee armen, zoals op de echte kering.
Y0 = arc_y(HALF, R - T)
for t in (0.18, 0.4, 0.62):
    y = Y0 + (APEX[1] - Y0) * t
    for z0 in (4.0, 20.0):
        z = z0 + (10 - z0) * t
        B.beam(f'dwars{t}{z0}', (-HALF * (1 - t), y, z), (HALF * (1 - t), y, z), 0.8, wit2, verts=6)
    B.beam(f'kruis{t}', (-HALF * (1 - t), y, 4 + 6 * t), (HALF * (1 - t), y, 20 - 10 * t), 0.6, wit2,
           verts=6)

# Het kogelgewricht op zijn fundatie.
B.box('fundatie', (34, 34, 8), (APEX[0], APEX[1] + 6, 4), beton)
B.cyl('kom', 8, 4, (APEX[0], APEX[1], 9), staal, verts=24)
B.sphere('kogel', 5.2, J, staal)
B.finish(__file__)
