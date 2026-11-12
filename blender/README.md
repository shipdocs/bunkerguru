# Blender-modellen

Spelgraphics als Python-code, headless gerenderd met Blender (4.0+).

```sh
sudo apt-get install -y blender python3-numpy python3-pil
blender/make.sh sleepboot --png art/tug.png --px 10           # sprite, recht van boven
blender/make.sh boei_rood --png art/buoy.png --view iso --px 14
blender/make.sh sleepboot --glb 3d/assets/sleepboot.glb        # 3D-model voor de Three.js-versie
blender/make.sh sleepboot                                      # sleepboot.blend om zelf in Blender te openen
```

- `bglib.py` – helpers: vormen, cartoonmaterialen, contourlijn, camera, render, GLB-export.
- `models/*.py` – één bestand per object. Assen: meter, +X = boeg (rechts in beeld), +Y = bakboord, +Z omhoog.

Werkwijze en stijlregels: `.claude/skills/blender/SKILL.md`.

## Gebouwen voor de 3D-versie (Rotterdam)

De herkenningspunten van Rotterdam komen uit Blender: `euromast`, `erasmusbrug` (pyloon en
tuien; het dek tekent het spel), `hotelny`, `derotterdam`, `cubes` (Kubuswoningen met het
Potlood), `markthal` en `whitehouse`. Alles opnieuw maken:

```sh
for m in euromast erasmusbrug hotelny derotterdam cubes markthal whitehouse; do
  blender/make.sh $m --glb 3d/assets/landmarks/$m.glb
done
```

- Assen voor gebouwen: +X langs de kade, **-Y naar het water**, Z omhoog, maaiveld Z = 0.
- `B.facade(...)` legt een raamraster op een gevel; materialen met `emit` (zoals `licht`)
  worden in het spel de ramen die 's avonds aangaan.
- `3d/src/render/models.mjs` laadt de GLB's vóór de wereld wordt gebouwd en maakt van elk
  model één mesh. Ontbreekt een bestand of laadt het niet, dan tekent het spel zijn eigen
  vorm. Een nieuw gebouw: model maken, naam (= `kind` in de landmarks) aan `MODEL_NAMES`
  toevoegen; `npm test` controleert grootte, maaiveld en aantal hoekpunten.
