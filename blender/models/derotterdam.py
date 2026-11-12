"""De Rotterdam, Wilhelminapier (OMA, 2013): drie glazen torens van 150 m op een
gezamenlijke plint, elke toren halverwege een stukje verspringend: de verticale stad.
    blender/make.sh derotterdam --glb 3d/assets/landmarks/derotterdam.glb
Assen: +X langs de pier, -Y naar het water, Z omhoog, maaiveld Z = 0."""
import bglib as B

B.reset()
plint = B.mat('plint', '#566a78', rough=0.5, metal=0.2)
gevel = B.mat('gevel', '#6a8293', rough=0.35, metal=0.3)
gevel2 = B.mat('gevel2', '#748c9c', rough=0.35, metal=0.3)
band = B.mat('band', '#b3d0de', rough=0.15, metal=0.4)
dak = B.mat('dak', '#8a9399', rough=0.8)
licht = B.mat('licht', '#ffd596', emit=2.0)

B.box('plint', (104, 34, 22), (0, 0, 11), plint)
B.facade('plintramen', -50, 50, 2, 20, -17, -1, 4, 4, 3.2, 3.0, None, licht, 0.35, 1)
# Elke toren: onderblok tot 84 m, bovenblok verspringt 5 m naar opzij en naar voren/achter.
for i, x in enumerate((-35, 0, 35)):
    sh = 5 if i == 1 else -5
    for j, (z0, z1, dx, dy) in enumerate(((22, 84, 0, 0), (84, 150, sh, sh * 0.7))):
        cx, cy, h = x + dx, dy, z1 - z0
        B.box(f'blok{i}{j}', (29, 30, h), (cx, cy, (z0 + z1) / 2), gevel if j else gevel2)
        for z in range(int(z0) + 2, int(z1) - 1, 4):
            B.box(f'band{i}{j}{z}', (29.3, 30.3, 1.7), (cx, cy, z + 1.4), band)
        for face in (-1, 1):
            B.facade(f'licht{i}{j}{face}', cx - 13, cx + 13, z0 + 2, z1 - 2, cy + face * 15.15,
                     face, 4.3, 4, 3.4, 1.5, None, licht, 0.22, 10 * i + j + face)
            B.facade(f'lichtz{i}{j}{face}', cy - 13, cy + 13, z0 + 2, z1 - 2, cx + face * 14.65,
                     face, 4.3, 4, 3.4, 1.5, None, licht, 0.22, 40 + 10 * i + j + face, axis='Y')
        B.box(f'dak{i}{j}', (27, 28, 1.2), (cx, cy, z1 + 0.6), dak)
    B.box(f'installatie{i}', (12, 10, 4), (x + sh, sh * 0.7, 152.6), dak)
B.finish(__file__)
