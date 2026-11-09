"""Leonore-bunkertanker (110 x 11 m) uit de 3D-versie, recht van boven voor het 2D-spel.
Bron: 3d/assets/vessels/bunkertanker-110-editable.glb (gemaakt door 3d/scripts/export-tanker.mjs).
blender/make.sh leonore --png $SCRATCH/leonore.png --px 10   en daarna   python3 blender/fit_sprite.py
"""
import math
import os

import bpy
import bglib as B

B.reset()
glb = os.path.join(os.path.dirname(__file__), '..', '..', '3d', 'assets', 'vessels', 'bunkertanker-110-editable.glb')
bpy.ops.import_scene.gltf(filepath=os.path.abspath(glb))
# Lampen en slang horen niet in een daglicht-sprite. De bunkergiek tekent engine.js zelf
# (drawBoom), zodat hij bij het bunkeren omhoog en naar het zeeschip kan; de kolom blijft staan.
for ob in list(bpy.context.scene.objects):
    if any(k in ob.name for k in ('light', 'Light', 'hose', 'Hose', 'Bunker-boom')):
        bpy.data.objects.remove(ob, do_unlink=True)
# glTF: boeg naar -z (Three) = +y in Blender; draai een kwartslag zodat de boeg naar +x (rechts) wijst.
roots = [o for o in bpy.context.scene.objects if o.parent is None]
pivot = bpy.data.objects.new('draai', None)
bpy.context.collection.objects.link(pivot)
for o in roots:
    o.parent = pivot
pivot.rotation_euler = (0, 0, -math.pi / 2)
bpy.context.view_layer.update()
B.finish(__file__)
