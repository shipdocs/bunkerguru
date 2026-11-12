"""Bunkerguru-Blenderbibliotheek: scène, cartoonmaterialen, contourlijn, render en export.

Gebruik in een modelscript (blender/models/<naam>.py):

    import bglib as B
    B.reset()
    romp = B.box('romp', (10, 3, 2), (0, 0, 1), B.mat('rood', '#c0392b'))
    ...
    B.finish(__file__)          # rendert sprite en/of GLB volgens de vlaggen op de opdrachtregel

Assenstelsel (gelijk aan de sprites in art/): eenheden = meter, +X = boeg / rechts in beeld,
+Y = bakboord / boven in beeld, +Z = omhoog, waterlijn / maaiveld op Z = 0.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

# ---------------------------------------------------------------- opdrachtregel


def args():
    """Vlaggen na '--': --png PAD --glb PAD --px N (pixels per meter) --view top|iso --samples N --outline PX (0 = geen rand)."""
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    out = {'png': None, 'glb': None, 'px': 20.0, 'view': 'top', 'samples': 32, 'outline': 2.5}
    if len(argv) % 2:
        sys.exit(f'[bglib] vlaggen komen in paren (--naam waarde), kreeg: {argv}')
    for k, v in zip(argv[::2], argv[1::2]):
        key = k[2:] if k.startswith('--') else None
        if key not in out:
            sys.exit(f'[bglib] onbekende vlag {k}; geldig: ' + ', '.join('--' + n for n in out))
        try:
            out[key] = float(v) if key in ('px', 'outline') else int(v) if key == 'samples' else v
        except ValueError:
            sys.exit(f'[bglib] {k} verwacht een getal, kreeg {v!r}')
    if out['view'] not in ('top', 'iso'):
        sys.exit(f"[bglib] --view is top of iso, kreeg {out['view']!r}")
    return out


# ---------------------------------------------------------------- scène


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'
    return sc


def hexcol(h):
    h = h.lstrip('#')
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, 1.0)


_MATS = {}


def mat(name, color, rough=0.6, metal=0.0, emit=0.0, alpha=1.0):
    """Cartoonachtig PBR-materiaal: vlakke kleur, matte afwerking. color = '#rrggbb'."""
    key = (name, color, rough, metal, emit, alpha)
    if key in _MATS:
        return _MATS[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = hexcol(color)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if emit:
        p.inputs['Emission Color'].default_value = hexcol(color)
        p.inputs['Emission Strength'].default_value = emit
    if alpha < 1:
        p.inputs['Alpha'].default_value = alpha
        m.blend_method = 'BLEND'
    m.diffuse_color = hexcol(color)  # ook zichtbaar in solid-weergave en in glTF
    _MATS[key] = m
    return m


def _link(ob, material, parent=None):
    if material is not None:
        ob.data.materials.clear()
        ob.data.materials.append(material)
    if parent is not None:
        ob.parent = parent
    return ob


def box(name, size, loc, material=None, bevel=0.0, rot=(0, 0, 0), parent=None):
    """Blok met afmetingen size=(x,y,z) in meter, middelpunt loc. bevel = afronding in meter."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        md = ob.modifiers.new('afronding', 'BEVEL')
        md.width = bevel
        md.segments = 3
        md.limit_method = 'ANGLE'
    smooth(ob)
    return _link(ob, material, parent)


def cyl(name, r, h, loc, material=None, axis='Z', verts=32, bevel=0.0, r2=None, parent=None):
    """Cilinder (of kegelstomp met r2) met straal r, hoogte h langs axis, middelpunt loc."""
    rot = {'Z': (0, 0, 0), 'X': (0, math.pi / 2, 0), 'Y': (math.pi / 2, 0, 0)}[axis]
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    if bevel:
        md = ob.modifiers.new('afronding', 'BEVEL')
        md.width = bevel
        md.segments = 3
        md.limit_method = 'ANGLE'
    smooth(ob)
    return _link(ob, material, parent)


def sphere(name, r, loc, material=None, scale=(1, 1, 1), parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=16)
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    smooth(ob)
    return _link(ob, material, parent)


def torus(name, R, r, loc, material=None, parent=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, major_segments=48, minor_segments=12)
    ob = bpy.context.object
    ob.name = name
    smooth(ob)
    return _link(ob, material, parent)


def _mesh_object(name, verts, faces, material, bevel, parent):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    if bevel:
        md = ob.modifiers.new('afronding', 'BEVEL')
        md.width = bevel
        md.segments = 3
        md.limit_method = 'ANGLE'
    smooth(ob)
    return _link(ob, material, parent)


def loft(name, outline, z0, z1, material=None, bevel=0.0, taper=1.0, parent=None):
    """Extrudeer een 2D-omtrek [(x,y),...] (tegen de klok in, van boven gezien) van z0 naar z1.
    taper < 1 maakt de z1-kant kleiner. Deksels worden als waaier vanuit het midden gevuld
    (geen n-gon-strepen in de schaduw); de omtrek moet dus vanuit het midden 'zichtbaar' zijn."""
    n = len(outline)
    cx = sum(p[0] for p in outline) / n
    cy = sum(p[1] for p in outline) / n
    lo, hi = min(z0, z1), max(z0, z1)
    tz = 1.0 if z1 >= z0 else taper
    bz = taper if z1 >= z0 else 1.0
    bot = [(cx + (x - cx) * tz, cy + (y - cy) * tz, lo) for x, y in outline]
    top = [(cx + (x - cx) * bz, cy + (y - cy) * bz, hi) for x, y in outline]
    verts = bot + top + [(cx, cy, lo), (cx, cy, hi)]
    cb, ct = 2 * n, 2 * n + 1
    faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    faces += [((i + 1) % n, i, cb) for i in range(n)]
    faces += [(n + i, n + (i + 1) % n, ct) for i in range(n)]
    return _mesh_object(name, verts, faces, material, bevel, parent)


def ring(name, outer, inner, z0, z1, material=None, bevel=0.0, parent=None):
    """Wand tussen twee omtrekken met evenveel punten (verschansing, kade-rand, tankmuur)."""
    n = len(outer)
    assert len(inner) == n, 'outer en inner moeten evenveel punten hebben'
    verts = [(x, y, z0) for x, y in outer] + [(x, y, z1) for x, y in outer] + \
            [(x, y, z0) for x, y in inner] + [(x, y, z1) for x, y in inner]
    O0, O1, I0, I1 = 0, n, 2 * n, 3 * n
    faces = []
    for i in range(n):
        j = (i + 1) % n
        faces.append((O0 + i, O0 + j, O1 + j, O1 + i))   # buitenkant
        faces.append((I0 + j, I0 + i, I1 + i, I1 + j))   # binnenkant
        faces.append((O1 + i, O1 + j, I1 + j, I1 + i))   # bovenkant
        faces.append((O0 + j, O0 + i, I0 + i, I0 + j))   # onderkant
    return _mesh_object(name, verts, faces, material, bevel, parent)


def beam(name, a, b, r, material=None, verts=12, r2=None, parent=None):
    """Ronde balk (of taps met r2) van punt a naar punt b: kabels, poten, masten."""
    A, Bv = Vector(a), Vector(b)
    d = Bv - A
    ob = cyl(name, r, d.length, (A + Bv) / 2, material, verts=verts, r2=r2, parent=parent)
    ob.rotation_mode = 'QUATERNION'
    ob.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    return ob


def facade(name, x0, x1, z0, z1, y, face, dx, dz, w, h, glass, lit=None, share=0.4, seed=1, axis='X'):
    """Raamraster op een gevel: ramen van w x h meter, om de dx (langs) en dz (hoogte).
    De gevel ligt op y (bij axis='X', anders x) en kijkt naar face (+1/-1). Een deel van
    de ramen krijgt een lichtgevend paneel ervoor (lit-materiaal): 's nachts verlicht."""
    import random
    rnd = random.Random(seed)
    nx = max(1, int((x1 - x0) / dx))
    nz = max(1, int((z1 - z0) / dz))
    ox = x0 + ((x1 - x0) - (nx - 1) * dx) / 2
    oz = z0 + ((z1 - z0) - (nz - 1) * dz) / 2
    panes, glow = [], []
    for i in range(nx):
        for j in range(nz):
            u, z = ox + i * dx, oz + j * dz
            panes.append((u, z))
            if lit is not None and rnd.random() < share:
                glow.append((u, z))

    def build(nm, items, off, depth, material):
        if not items:
            return None
        vs, fs = [], []
        for u, z in items:
            k = len(vs)
            for du, dzz in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)):
                for t in (0, depth):
                    p = y + face * (off + t)
                    vs.append((u + du, p, z + dzz) if axis == 'X' else (p, u + du, z + dzz))
            # quad on the outside, four thin sides
            q = [k + 1, k + 3, k + 5, k + 7]
            fs.append(tuple(q) if face > 0 else tuple(reversed(q)))
            for e in range(4):
                a0, a1 = k + 2 * e, k + 2 * ((e + 1) % 4)
                fs.append((a0, a1, a1 + 1, a0 + 1))
        return _mesh_object(nm, vs, fs, material, 0, None)

    if glass is not None:
        build(name, panes, -0.05, 0.25, glass)
    if lit is not None:
        build(name + '-licht', glow, 0.2, 0.06, lit)


def smooth(ob):
    for p in ob.data.polygons:
        p.use_smooth = True
    if hasattr(ob.data, 'use_auto_smooth'):  # Blender < 4.1
        ob.data.use_auto_smooth = True
        ob.data.auto_smooth_angle = math.radians(35)
    else:
        try:
            bpy.context.view_layer.objects.active = ob
            bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
        except Exception:
            pass


def hull_outline(stations):
    """Scheepsomtrek van boven uit stations [(x, halve breedte), ...] van achter naar voor.
    Geeft een gesloten omtrek tegen de klok in (bakboord = +y)."""
    sb = [(x, -w) for x, w in stations]
    bb = [(x, w) for x, w in reversed(stations)]
    return sb + bb


# ---------------------------------------------------------------- contourlijn


def outline(width=0.12, color='#1e2326', objects=None):
    """Donkere cartoonrand via 'inverted hull' (solidify met omgekeerde normalen, achterkant weg).
    Werkt in de render én blijft bewaard in GLB als je die modifier niet toepast (wordt weggelaten bij export)."""
    m = bpy.data.materials.get('contour') or bpy.data.materials.new('contour')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = hexcol(color)
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    mix = nt.nodes.new('ShaderNodeMixShader')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    # Omgekeerde schil: de kant naar de camera is 'backfacing' -> doorzichtig; alleen de rand blijft over.
    # Alleen camerastralen zien de rand; licht en schaduw gaan er dwars doorheen.
    lp = nt.nodes.new('ShaderNodeLightPath')
    inv = nt.nodes.new('ShaderNodeMath')
    inv.operation = 'SUBTRACT'
    inv.inputs[0].default_value = 1.0
    nt.links.new(lp.outputs['Is Camera Ray'], inv.inputs[1])
    mx = nt.nodes.new('ShaderNodeMath')
    mx.operation = 'MAXIMUM'
    nt.links.new(geo.outputs['Backfacing'], mx.inputs[0])
    nt.links.new(inv.outputs[0], mx.inputs[1])
    nt.links.new(mx.outputs[0], mix.inputs[0])
    nt.links.new(em.outputs[0], mix.inputs[1])
    nt.links.new(tr.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    m.use_backface_culling = True
    m.blend_method = 'CLIP'
    for ob in objects or [o for o in bpy.context.scene.objects if o.type == 'MESH']:
        if ob.get('geen_rand'):
            continue
        ob.data.materials.append(m)
        md = ob.modifiers.new('contour', 'SOLIDIFY')
        md.thickness = width
        md.offset = 1.0
        md.use_flip_normals = True
        md.use_rim = False
        md.material_offset = len(ob.data.materials) - 1
    return m


# ---------------------------------------------------------------- licht, camera, render


def bounds(objects=None):
    obs = objects or [o for o in bpy.context.scene.objects if o.type == 'MESH']
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    dg = bpy.context.evaluated_depsgraph_get()
    for o in obs:
        ev = o.evaluated_get(dg)
        for v in ev.to_mesh().vertices:
            w = o.matrix_world @ v.co
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
        ev.to_mesh_clear()
    return lo, hi


def lights():
    """Zon linksboven (zoals de schaduwen in het spel, die het spel zelf tekent) + zacht hemellicht."""
    sun = bpy.data.lights.new('zon', 'SUN')
    sun.energy = 3.2
    sun.angle = math.radians(8)
    ob = bpy.data.objects.new('zon', sun)
    ob.rotation_euler = (math.radians(35), 0, math.radians(-135))
    bpy.context.collection.objects.link(ob)
    w = bpy.data.worlds.new('lucht')
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = hexcol('#dfe8f0')
    bg.inputs['Strength'].default_value = 0.9
    bpy.context.scene.world = w


def camera(view='top', px=20.0, margin=0.04):
    """Orthografische camera die het model precies omvat.
    view='top': recht van boven (schepen, zoals ship_*.png). view='iso': schuin van boven (tanks, huizen)."""
    sc = bpy.context.scene
    lo, hi = bounds()
    c = (lo + hi) / 2
    cam = bpy.data.cameras.new('cam')
    cam.type = 'ORTHO'
    ob = bpy.data.objects.new('cam', cam)
    sc.collection.objects.link(ob)
    sc.camera = ob
    if view == 'top':
        ob.location = (c.x, c.y, hi.z + 50)
        ob.rotation_euler = (0, 0, 0)
        w, h = hi.x - lo.x, hi.y - lo.y
    else:  # 30° schuin van onderen in beeld (zuid) naar boven kijkend
        tilt = math.radians(35)
        ob.rotation_euler = (tilt, 0, 0)
        d = 60
        ob.location = (c.x, c.y - d * math.sin(tilt), c.z + d * math.cos(tilt))
        w = hi.x - lo.x
        h = (hi.y - lo.y) * math.cos(tilt) + (hi.z - lo.z) * math.sin(tilt)
    w *= 1 + 2 * margin
    h *= 1 + 2 * margin
    cam.ortho_scale = max(w, h)
    sc.render.resolution_x = max(8, round(w * px))
    sc.render.resolution_y = max(8, round(h * px))
    cam.sensor_fit = 'HORIZONTAL' if w >= h else 'VERTICAL'
    cam.clip_end = 500
    return ob


def render_png(path, view='top', px=20.0, samples=32):
    sc = bpy.context.scene
    lights()
    camera(view, px)
    sc.render.engine = 'CYCLES'  # werkt headless zonder GPU
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = False
    sc.cycles.max_bounces = 4
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'  # heldere cartoonkleuren, geen Filmic/AgX-vervaging
    sc.render.resolution_percentage = 100
    sc.render.filepath = os.path.abspath(path)
    bpy.ops.render.render(write_still=True)
    print(f'[bglib] sprite {path} {sc.render.resolution_x}x{sc.render.resolution_y}')


def export_glb(path):
    """GLB voor de 3D-versie (Three.js). De contour-modifier gaat niet mee (Three tekent zijn eigen randen)."""
    for ob in bpy.context.scene.objects:
        for md in ob.modifiers:
            if md.name == 'contour':
                md.show_viewport = False
                md.show_render = False
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=os.path.abspath(path), export_format='GLB', export_apply=True,
                              export_yup=True, use_selection=False)
    print(f'[bglib] glb {path}')


def finish(script_file=None):
    """Lees de vlaggen en maak wat gevraagd is. Volgorde: eerst PNG (met contour), dan GLB (zonder)."""
    a = args()
    if a['png']:
        if a['outline'] > 0:
            outline(a['outline'] / a['px'])  # --outline is in pixels in de uiteindelijke sprite
        render_png(a['png'], a['view'], a['px'], a['samples'])
    if a['glb']:
        export_glb(a['glb'])
    if not a['png'] and not a['glb']:
        name = os.path.splitext(os.path.basename(script_file or 'model'))[0]
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(f'{name}.blend'))
        print(f'[bglib] geen --png/--glb: opgeslagen als {name}.blend')
