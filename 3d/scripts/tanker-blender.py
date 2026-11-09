"""blender -b --python scripts/tanker-blender.py -- [optional asset directory]

Import separate editable fittings; save a real Blender project with named pivots,
radar animation and a presentation camera. GLB source comes from export-tanker.mjs.
"""
import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector

assets = Path(sys.argv[sys.argv.index('--') + 1]) if '--' in sys.argv else Path(__file__).resolve().parents[1] / 'assets/vessels'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(assets / 'bunkertanker-110-editable.glb'))
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
scene.render.fps = 24
scene.frame_start, scene.frame_end = 1, 60
scene.frame_set(1)

# glTF importer converts y-up to Blender z-up. Keep the imported hierarchy intact.
for name in ['Deck-lights', 'Wheelhouse-lights', 'Bunker-hose']:
    obj = bpy.data.objects.get(name)
    if obj:
        for child in [obj, *obj.children_recursive]:
            child.hide_render = True
            child.hide_set(True)

# Workshop camera and lighting live in their own collection, outside the vessel.
studio = bpy.data.collections.new('Studio - exclude when exporting vessel')
scene.collection.children.link(studio)
def move_to_studio(obj):
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    studio.objects.link(obj)

bpy.ops.object.camera_add(location=(89, 108, 77))
camera = bpy.context.object
camera.name = 'Presentation-camera'
camera.rotation_euler = (Vector((0, 0, 2)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 133
scene.camera = camera
move_to_studio(camera)
for loc, energy, size in [((25, 15, 65), 26000, 65), ((-35, -35, 40), 18000, 50)]:
    bpy.ops.object.light_add(type='AREA', location=loc)
    light = bpy.context.object
    light.data.energy, light.data.shape, light.data.size = energy, 'DISK', size
    light.rotation_euler = (Vector((0, 0, 0)) - light.location).to_track_quat('-Z', 'Y').to_euler()
    move_to_studio(light)
scene.world = bpy.data.worlds.new('Harbor studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.32, 0.43, 0.5, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.7
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 24
scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = True
scene.render.filepath = str(assets / 'bunkertanker-110.png')
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_distance = 100
            area.spaces.active.region_3d.view_location = (0, 0, 3)
            area.spaces.active.clip_end = 2000
bpy.ops.wm.save_as_mainfile(filepath=str(assets / 'bunkertanker-110.blend'), compress=True)
bpy.ops.render.render(write_still=True)
print('Saved editable Blender file and rendered preview')
