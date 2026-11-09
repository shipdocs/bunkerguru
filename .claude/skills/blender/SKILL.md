---
name: blender
description: Spelgraphics voor Bunkerguru maken met Blender (headless, Python/bpy). Gebruik als Martin een schip, sleepboot, boei, tank, kraan, gebouw of ander object wil laten ontwerpen, verbeteren of vervangen als sprite (art/*.png, 2D-spel) of als 3D-model (GLB, 3d/-versie), of zegt "maak in Blender", "teken een mooier ...", "nieuwe sprite", "3D-model".
---

# Blender voor Bunkerguru

Modellen worden **in code** gebouwd (`blender/models/<naam>.py`) met de helpers in `blender/bglib.py` en headless gerenderd. Zo is elk object reproduceerbaar, aanpasbaar per maat en in git te reviewen.

## 1. Klaarzetten (eenmalig per container)
```sh
command -v blender || apt-get install -y blender python3-numpy   # sudo als je geen root bent; numpy is nodig voor GLB-export
```
Geen GPU nodig: renders gaan via Cycles op de CPU (sprite van ~350 px: 2–5 s).

## 2. Werkwijze
1. **Referentie bekijken**: open de bestaande sprite (`art/<naam>.png`, Read-tool) en, bij schepen, de echte maten (`VESSEL_RULES.md`, `3d/src/game/ship-profile.mjs`). Martin is schipper: verhoudingen en details (bolders, fenders, stuurhuis, uitlaten, sleephaak) moeten kloppen; de stijl mag cartoon zijn.
2. **Model schrijven** in `blender/models/<naam>.py` (kopieer `sleepboot.py` of `boei_rood.py`). Assen: meter, **+X = boeg = rechts in beeld**, +Y = bakboord = boven in beeld, +Z omhoog, waterlijn op Z = 0.
3. **Proefrender** naar de scratchpad, bekijken met Read, verbeteren, herhalen:
   ```sh
   blender/make.sh sleepboot --png $SCRATCH/tug.png --px 12
   ```
4. **Opleveren**: naar `art/<naam>.png` (vervangt de sprite, zelfde naam = geen codewijziging) en/of `--glb 3d/assets/<naam>.glb`. Nieuwe spritenaam? Dan toevoegen aan `ART_NAMES` in `engine.js` en de `?v=` in `index.html` bumpen.
   Scheepssprites tekent `engine.js` als (L+4) × 1,25·B: render ruim (`--px 12`) en zet hem passend met `python3 blender/fit_sprite.py render.png art/ship_player.png --size 600x85 --length 110`. Een model uit de 3D-versie hergebruiken: zie `models/leonore.py` (importeert de GLB en draait de boeg naar +X).
5. Spel testen (zie skill bunkerguru-dev, testharnas) en een screenshot laten zien vóór commit.

## 3. Opdrachtregel `blender/make.sh <model> [vlaggen]`
| vlag | betekenis |
|---|---|
| `--png PAD` | sprite renderen (transparante achtergrond, met contourlijn) |
| `--glb PAD` | GLB voor Three.js (zonder contourlijn, Y-up) |
| `--px N` | pixels per meter (standaard 20). Kies zo dat de breedte past bij de huidige sprite: `ship_player` 600 px, `tug` 260 px, `tank_l` 129 px, `buoy` 34 px |
| `--view top\|iso` | `top` recht van boven (alle schepen); `iso` 35° schuin (tanks, huizen, kranen, boeien) |
| `--outline PX` | dikte contourlijn in pixels (standaard 2,5; 0 = geen) |
| `--samples N` | Cycles-samples (standaard 32; 64+ voor eindversie) |
Zonder `--png`/`--glb` wordt `<model>.blend` opgeslagen om in Blender op een eigen pc te openen. Fout? `make.sh` toont de laatste 30 regels van de Blender-log.

## 4. bglib in het kort
- `B.reset()` — lege scène.
- `B.mat(naam, '#rrggbb', rough, metal, emit, alpha)` — mat cartoonmateriaal (sRGB-hex, wordt lineair gezet).
- Vormen (allemaal `naam, ..., material, bevel=afronding_m, parent=`):
  `box(size, loc)`, `cyl(r, h, loc, axis='Z', r2=kegel)`, `sphere(r, loc, scale)`, `torus(R, r, loc)`,
  `loft(omtrek, z0, z1, taper)` (extrusie van een 2D-omtrek), `ring(buiten, binnen, z0, z1)` (wand: verschansing, kademuur).
- `B.hull_outline([(x, halve_breedte), ...])` — scheepsomtrek van spiegel naar boeg (laatste station `(x, 0)` = punt).
- `B.finish(__file__)` — altijd als laatste regel; voert de vlaggen uit.

## 5. Stijlregels (passend bij de SpriteCook-sprites)
- Heldere, verzadigde vlakken, weinig textuur; donkere contour ~2,5 px; licht van linksboven.
- **Geen slagschaduw in de sprite**: het spel tekent zelf schaduw (`sprShadow`). De render heeft een transparante achtergrond.
- Kleuren uit het spel: eigen schip/bedrijf `#e87722` / `#ee913c`, dek `#9aa5ad`, romp `#24292c`, opbouw `#f1f1ec`, kleppen `#2f5fae`. Concurrenten worden in het spel getint (`artTint`): houd die delen neutraal-grijs.
- Kleine objecten (boei 34 px): weinig details, dikke vormen — wat kleiner is dan 2 px verdwijnt.
- Tekst/namen niet in het model zetten (onleesbaar op spelgrootte; het spel tekent namen zelf).

## 6. Valkuilen
- Contourlijn = omgekeerde schil (solidify). Het materiaal is alleen zichtbaar voor camerastralen; laat dat zo, anders blokkeert de schil het zonlicht en wordt alles zwart.
- `loft` vult deksels als waaier vanuit het midden: de omtrek moet vanuit het midden zichtbaar zijn (scheepsomtrek is goed; een U-vorm niet → splitsen in delen).
- Holle vormen (verschansing) met `ring`, niet met `loft` — anders dek dicht.
- Blender 4.0 (apt) heeft `use_auto_smooth`; 4.1+ niet. `bglib.smooth()` vangt beide af.
- GLB-export faalt zonder `python3-numpy`.
