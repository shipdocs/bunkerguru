"""Pas een Blender-render aan op het formaat waarin engine.js een scheepssprite tekent.

engine.js: spr(im, 0, 0, 0, L + 4, Bw * 1.25) -> het beeld beslaat (L+4) x 1,25*B.
De romp moet dus L/(L+4) van de breedte en 1/1,25 van de hoogte vullen.

    python3 blender/fit_sprite.py render.png art/ship_player.png --size 600x85 --length 110
"""
import argparse

from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('dst')
ap.add_argument('--size', default='600x85', help='uitvoer BxH in pixels')
ap.add_argument('--length', type=float, default=110, help='scheepslengte L in meter (spel tekent L+4)')
ap.add_argument('--beam-fill', type=float, default=1 / 1.25, help='deel van de hoogte voor de romp')
a = ap.parse_args()
W, H = (int(v) for v in a.size.split('x'))
im = Image.open(a.src).convert('RGBA')
box = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
if not box:
    raise SystemExit('lege render')
hull = im.crop(box)
w = round(W * a.length / (a.length + 4))
h = round(H * a.beam_fill)
hull = hull.resize((w, h), Image.LANCZOS)
out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
out.alpha_composite(hull, ((W - w) // 2, (H - h) // 2))
out.save(a.dst, optimize=True)
print(f'[fit_sprite] {a.dst} {W}x{H}, romp {w}x{h} (bron {box[2]-box[0]}x{box[3]-box[1]})')
