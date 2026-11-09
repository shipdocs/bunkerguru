# Blender-modellen

Spelgraphics als Python-code, headless gerenderd met Blender (4.0+).

```sh
sudo apt-get install -y blender python3-numpy
blender/make.sh sleepboot --png art/tug.png --px 10           # sprite, recht van boven
blender/make.sh boei_rood --png art/buoy.png --view iso --px 14
blender/make.sh sleepboot --glb 3d/assets/sleepboot.glb        # 3D-model voor de Three.js-versie
blender/make.sh sleepboot                                      # sleepboot.blend om zelf in Blender te openen
```

- `bglib.py` – helpers: vormen, cartoonmaterialen, contourlijn, camera, render, GLB-export.
- `models/*.py` – één bestand per object. Assen: meter, +X = boeg (rechts in beeld), +Y = bakboord, +Z omhoog.

Werkwijze en stijlregels: `.claude/skills/blender/SKILL.md`.
