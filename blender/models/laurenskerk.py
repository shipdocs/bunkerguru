"""Grote of Sint-Laurenskerk (1449-1525), het enige middeleeuwse gebouw van de binnenstad:
laatgotisch schip met steile kappen, dwarsschip en de stompe toren met een klein koperen
lantaarntje, samen 64 m.
    blender/make.sh laurenskerk --glb 3d/assets/landmarks/laurenskerk.glb
Assen: het schip langs X met de toren in het westen (-X), Z omhoog, maaiveld Z = 0."""
import bglib as B

B.reset()
steen = B.mat('natuursteen', '#bba98a', rough=0.9)
steen2 = B.mat('natuursteen2', '#a8967a', rough=0.9)
lei = B.mat('lei', '#5a5f66', rough=0.6)
koper = B.mat('koper', '#6fae9a', rough=0.6)
glas = B.mat('glas', '#34404a', rough=0.3)
licht = B.mat('licht', '#ffcf7a', emit=2.0)


def gable(name, x0, x1, w, z0, h, material, axis='X'):
    """Zadeldak van x0 tot x1, breedte w, nok h boven z0."""
    if axis == 'X':
        vs = [(x0, -w / 2, z0), (x1, -w / 2, z0), (x1, w / 2, z0), (x0, w / 2, z0),
              (x0, 0, z0 + h), (x1, 0, z0 + h)]
    else:
        vs = [(-w / 2, x0, z0), (-w / 2, x1, z0), (w / 2, x1, z0), (w / 2, x0, z0),
              (0, x0, z0 + h), (0, x1, z0 + h)]
    fs = [(0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)]
    return B._mesh_object(name, vs, fs, material, 0, None)


# Schip met zijbeuken en het koor.
B.box('schip', (66, 22, 22), (8, 0, 11), steen)
gable('schipkap', -25, 41, 22.4, 22, 16, lei)
B.box('koor', (16, 16, 20), (49, 0, 10), steen)
gable('koorkap', 41, 57, 16.4, 20, 12, lei)
B.box('transept', (16, 40, 21), (22, 0, 10.5), steen)
gable('transeptkap', -20, 20, 16.4, 21, 13, lei, axis='Y').location = (22, 0, 0)
for x in range(-20, 41, 8):
    B.box(f'steunbeer{x}', (1.6, 25, 18), (x, 0, 9), steen2)
for face, y in ((-1, -11), (1, 11)):
    B.facade(f'ramen{face}', -22, 40, 5, 18, y, face, 8, 13, 3.2, 10, glas, licht, 0.5, 4 + face)
# De toren: drie geledingen, smaller naar boven, met een klein koperen lantaarntje.
for i, (w, z0, z1) in enumerate(((18, 0, 28), (16, 28, 46), (14, 46, 56))):
    B.box(f'toren{i}', (w, w, z1 - z0), (-33, 0, (z0 + z1) / 2), steen if i % 2 == 0 else steen2)
    B.box(f'torenlijst{i}', (w + 0.8, w + 0.8, 1), (-33, 0, z1), steen2)
    for face in (-1, 1):
        B.facade(f'galmgat{i}{face}', -33 - w / 2 + 2, -33 + w / 2 - 2, z0 + 4, z1 - 3, face * w / 2, face,
                 4.5, 10, 2.0, 7, glas, licht if i == 0 else None, 0.3, 10 + i)
B.cyl('lantaarn', 3, 4, (-33, 0, 58.5), koper, verts=8)
B.cyl('spits', 3.2, 3.5, (-33, 0, 62.25), koper, verts=8, r2=0.2)
B.finish(__file__)
