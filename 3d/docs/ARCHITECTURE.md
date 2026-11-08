# Onderhoud en architectuur

## Bron en publicatie

`src/main.mjs` start één `createGame()` uit `src/app/create-game.mjs`. Alleen deze applicatie-eigenaar vervangt de actuele spelstaat bij een nieuwe carrière. Bediening en havenkantoor krijgen een `getState()`-functie, zodat zij na die vervanging nooit een verouderd schip aanpassen.

`public/` bevat de handgeschreven HTML en stijlen. `vendor/` bevat ongewijzigde externe broncode en licenties. `scripts/build.mjs` kopieert deze drie bronnen naar `dist/` en voegt alleen de CSS-lagen samen. De browser gebruikt gewone ES-modules, zonder transpiler of framework.

De publicatie blijft statisch. `.openai/hosting.json` wijst naar `dist/`; de Sites-workflow bouwt vóór het verpakken met `npm run build`. Tests gebruiken rechtstreeks `src/`, en `npm run test:built` voert de applicatie-integratietest nogmaals uit op `dist/`. Zo kunnen verouderde buildbestanden geen groen testresultaat maskeren.

## Overgezet uit het 2D-spel

De kaarten staan als kopie in `src/maps/classic/` (gemaakt door `scripts/sync-maps.mjs` uit `../maps/*.js`). `src/maps/classic-map.mjs` doet hetzelfde als `loadMap` in `engine.js`: K-schaal, terminals/wachtplaatsen/ligplaatsen tegen hun kade, en zet alles om naar meters (x langs de rivier, zee aan −x; z dwars, noord = −z). Eén kaart is actief per paginalading (`?map=`, of de laatst gekozen); wisselen herlaadt de pagina. `src/maps/index.mjs` levert water, stroom/getij en route-advies (A\* op 24 m).

Tijd: `s.clock` telt gesimuleerde seconden. De 2D-timers (laden, pompen, vermoeidheid, getij, deadlines) liepen op echte seconden terwijl de fysica 3× zo snel liep; daarom rekent `harbor.mjs` met `LOGIC = 1/3`. Op tempo 3× voelt alles precies als het 2D-spel.

Runtime-wereld (`createWorldState`): verkeer, bruggen/sluizen, concurrenten en incidenten. Alleen geld en positie van de concurrenten worden bewaard.

## Verantwoordelijkheden

- **`game/`** bevat spelstaat, spelregels, vaarmodel en botsingen. Het heeft geen DOM, WebGL of browseropslag nodig. `state.mjs` is de enige plek voor nieuwe spelvelden en opslagmigratie. `simulation.mjs` voert acties en simulatiestappen uit.
- **`maps/`** levert dezelfde geometrie aan botsingen, rendering en kaart. `amsterdam-source.mjs` bewaart de oorspronkelijke gegevens; `waterway-layout.mjs` legt de speelbare breedtes vast. Pas zichtbare kades en botsingsgrenzen nooit los van elkaar aan.
- **`input/`** vertaalt toetsen en pointers naar opdrachten. Het verandert nooit rechtstreeks positie of koers. `wheel.mjs` verwerkt draaibewegingen en pointer-capture; `helm.mjs` bewaakt het blijvende roer; loslaten wist alleen actieve invoer.
- **`render/`** maakt en actualiseert Three.js-objecten. `world.mjs` bouwt de wereld, `ship-model.mjs` de schepen, `primitives.mjs` de herbruikbare vormen en `navigation-effects.mjs` route, trossen en schuim. `camera-controller.mjs` beheert camerabediening; `camera.mjs` berekent de camerastand zonder DOM.
- **`ui/`** bevat de kaart, instrumenten, mobiele panelen en havenkantoor. UI krijgt alleen benodigde gegevens en callbacks; het maakt geen renderer en start geen eigen animatielus.
- **`app/`** verbindt deze onderdelen: één animatielus, één spelklok, opslag en pauzestatus. `storage.mjs` vangt ontbrekende/volle browseropslag af; spelen blijft mogelijk.
- **`audio/`** bevat de adapter en de oorspronkelijke procedurele geluiden.

Nieuwe code hoort bij de verantwoordelijkheid, niet automatisch in `create-game.mjs`. Bouw geen algemene eventbus of extra centrale statecontainer voor een eenvoudige knop. Geef afhankelijkheden expliciet mee. De renderer wordt via `createRenderer` geïnjecteerd; integratietests hoeven geen broncode meer te herschrijven om WebGL te vervangen.

## Tijd en eenheden

Posities en afmetingen zijn meters; `u`/`v` zijn m/s, `h` is koers in radialen en `r` rad/s. De HUD vermenigvuldigt snelheid met 3,6. Noord is −z. Het model draait in Three.js om `-h`.

`simulation-clock.mjs` vertaalt verstreken echte tijd naar stappen van 1/60 s. `simulation.mjs` past de gekozen 1×/2×/3×-factor toe, samen met het vaarmodel. Vermenigvuldig renderafstanden of de snelheidsmeter nooit afzonderlijk om de vaart te corrigeren. Pauzetijd wordt niet ingehaald. HUD en route verversen per 0,2 s, niet per aantal getekende frames.

## Stijlen

`public/styles/main.css` is de geordende lijst van stijllagen. De volgorde bewaart het bestaande uiterlijk:

1. `base.css`: algemene componenten en desktopbasis.
2. `compact.css`: compacte basisindeling.
3. `port.css`: havenkantoor en dialoogvensters.
4. `mobile.css`: mobiele panelen en bediening.
5. `theme.css`: havenkleuren en definitieve visuele afwerking.
6. `helm.css`, `chart.css`, `graphics.css`, `engine.css`: gerichte componentregels.

De bestaande cascade is behouden. Houd nieuwe regels bij de betreffende component; voeg niet opnieuw losse reparatieregels onderaan het HTML-bestand toe. Controleer portrait en landscape bij wijzigingen. De publicatie heeft één samengevoegd `styles/main.css`, terwijl de bron bewerkbaar blijft per onderwerp.

## Behoud en tests

- Houd de sleutels `bunkerguru3d-v1`, `bunkerguru-graphics` en `bunkerguru-muted` compatibel.
- Het roer centreert uitsluitend op een bewuste 0°-opdracht. Pauze, afstoppen, release/cancel en hervatten bewaren de hoek.
- `legacy-vessel.mjs` dient alleen voor vergelijking; `play-vessel.mjs` is het actieve vaarmodel. `tests/legacy-physics.cjs` blijft de oorspronkelijke oracle. De dode, te trage tussenafstelling is verwijderd.
- `tests/ui-smoke.test.mjs` bouwt de echte scene en voert de echte knoppen uit met een kleine DOM/renderer-vervanger. Het controleert ook reset naar een nieuwe carrière en 144 m varen in tien seconden bij 10 FPS op het standaard 2×-tempo. Dit bewijst geen WebGL-prestaties.
- `scripts/check-build.mjs` volgt de gepubliceerde HTML-, CSS- en moduleverwijzingen en weigert ontbrekende bestanden.
- Voer `npm run check` uit vóór publicatie; `npm run format:check` bewaakt de gezamenlijke opmaak. Geen netwerk nodig voor build en tests; alleen `npm ci` haalt het vastgezette ontwikkelhulpmiddel op.
