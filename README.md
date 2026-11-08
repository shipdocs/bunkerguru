# Bunkerguru — Havenlicht

Een 3D-bunkerspel in Amsterdam Westpoort, geïnspireerd op `shipdocs/bunkerguru`. De browser draait lokale Three.js-modules; er zijn geen CDN's, accounts in het spel of backend nodig. De Sites-publicatie kan wel een ChatGPT-toegangspoort hebben.

## Ontwikkelen

Gebruik Node.js 22 of nieuwer.

```sh
npm ci
npm run dev
```

Open `http://localhost:4173`. Wijzigingen in `src/`, `public/` en `vendor/` bouwen automatisch opnieuw; vernieuw daarna de browser. Met `PORT` kun je een andere poort kiezen. In de beheerde Sites-omgeving start je de preview via `sites-preview start <checkout>`.

```sh
npm run check         # alle speltests, build, bestandsverwijzingen en integratietest op de build
npm run format        # consistente opmaak van eigen code, tests en documentatie
npm run format:check  # controle zonder wijzigingen
npm run build         # alleen de publiceerbare bestanden maken
```

**Bewerk `src/` en `public/`, niet `dist/`.** `dist/` wordt volledig opnieuw opgebouwd en staat niet in Git. De build heeft geen bundler of runtime-afhankelijkheden nodig. Prettier is alleen een ontwikkelhulpmiddel; de versie staat vast in `package-lock.json`.

## Waar pas ik iets aan?

| Onderdeel                                 | Bestand of map                                                        |
| ----------------------------------------- | --------------------------------------------------------------------- |
| Opstarten, pauze en hoofdloop             | `src/app/create-game.mjs`                                             |
| Tijdverloop en snelheid bij lage FPS      | `src/app/simulation-clock.mjs`                                        |
| Opgeslagen spel en voorkeuren             | `src/app/storage.mjs`, `src/game/state.mjs`                           |
| Roer, toetsen en aanraakknoppen           | `src/input/wheel.mjs`, `src/input/helm.mjs`, `src/input/keyboard.mjs` |
| Vaargevoel, gas, afstoppen en boegschroef | `src/game/play-vessel.mjs`                                            |
| Scheepsafmetingen en tankinhoud           | `src/game/ship-profile.mjs`                                           |
| Opdrachten, beloningen en onderhoud       | `src/game/harbor.mjs`                                                 |
| Laden, afmeren en spelstappen             | `src/game/simulation.mjs`                                             |
| Vaarwater en havenbreedtes                | `src/maps/waterway-layout.mjs`, `src/maps/amsterdam.mjs`              |
| Gebouwen, bomen, kranen en omgevingsleven | `src/render/scenery.mjs`                                              |
| Scheepsmodel, water en volgcamera         | `src/render/ship-model.mjs`, `water.mjs`, `camera.mjs`                |
| Scherminformatie, havenkantoor en kaart   | `src/ui/`                                                             |
| HTML, kleuren en mobiele indeling         | `public/index.html`, `public/styles/`                                 |
| Geluid                                    | `src/audio/`                                                          |

Lees [de architectuur](docs/ARCHITECTURE.md) voor modulegrenzen en [de scheepsregels](VESSEL_RULES.md) voordat je afmetingen, besturing, botsingen of camera verandert. [De snelheidscontrole](docs/SPEED.md) beschrijft de FPS-fout en de meetbare regressietests.

## Spelen

Je begint vast aan de terminal. Laad 500 ton, gooi los, vaar naar MT AFRIKA en maak parallel vast binnen 25 m en onder 2 km/u. Bunker de lading om betaald te worden. Daarna biedt het havenkantoor gewone, spoed- en kleine opdrachten aan, verdeeld over zes klanten. Vijf leveringen leveren eenmaal € 1.000 bonus op. Reparaties en pompupgrades zijn bij de laadterminals beschikbaar; pechhulp voorkomt dat je vastloopt zonder geld.

- ↑/↓ of +/−: achteruit, stop, langzaam, half en vol vooruit.
- ←/→: roerhoek aanpassen. **Loslaten houdt de hoek vast**, ook wanneer je het stuurwiel op mobiel of met de muis draait. Alleen 0° zet het roer midscheeps.
- Spatie of Afstoppen: afremmen tot stilstand, met behoud van de roerstand. Gas geven beëindigt het afstoppen.
- Q/E: boegschroef; M: vastmaken/losgooien; H: hoorn; C: camera.
- Slepen: rondkijken; scrollen: zoomen; Escape: pauze.

De actieve tanker is 110 × 11 m met 1.200 ton tankinhoud. Het vaarmodel is bewust speels en geholpen, geen vaarsimulator. Scheepslengte en lading beïnvloeden het varen licht. Standaard speeltempo is 2×: de haven passeert twee keer zo snel als bij het eerdere 1×. Via Vaartempo kies je 1× (rustig), 2× (spelen) of 3× (snel). Verkeer, overslag en opdrachtklokken gebruiken dezelfde factor.

Voortgang wordt in dezelfde browser bewaard, iedere drie seconden tijdens het spelen en bij belangrijke acties. De bestaande opslagcodes blijven gelijk. Hervatten stopt de machine, maar bewaart roerstand, voortgang en huidige positie. Oudere kaarten worden veilig gemigreerd. Pauze, dialoogvensters en een verborgen tabblad stoppen de simulatie. Geen cloudsynchronisatie.

## Beeld en grenzen

De cartoonhaven gebruikt samengevoegde geometrie en detailniveaus. Automatisch kiest op telefoons de lichte stand; via Beeld kun je die aanpassen. De bouwstap voegt de CSS-lagen samen om extra mobiele verzoeken te vermijden. Er zijn geen nieuwe runtime-afhankelijkheden toegevoegd.

De kaart is schematisch: hoofdwater 190–280 m, haveningangen 60–220 m en binnenhavens tot 420 m. Alle zes klanten, beide terminals, draaiplekken en botsingen worden met de volledige scheepsromp getest. Verkeer volgt vaste routes. Er zijn nog geen sluizen, bruggen, andere kaarten, scheepsaankopen, wind/stroom, multiplayer of cloudsaves.

De tests controleren spelgedrag, oorspronkelijke fysica, geometrie, opslag, bediening en de echte applicatie-opbouw met een vervangende renderer. Ze controleren ook de daadwerkelijk gebouwde bestanden. De testbrowser kan hier geen WebGL-context maken: echte 3D-proefvaarten en prestaties op een fysieke telefoon zijn niet geverifieerd.

Three.js r160 staat met MIT-licentie in `vendor/`. De oorspronkelijke kaart en geluidsbron worden apart bewaard; deze Sites-repository staat los van `shipdocs/bunkerguru`.
