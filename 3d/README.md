# Bunkerguru 3D

De 3D-versie (Three.js) van [Bunkerguru](../README.md), te spelen op `/3d/`. Zelfde spel als de 2D-versie: dezelfde kaarten, hetzelfde vaarmodel, dezelfde regels. Alleen de weergave is 3D.

## Spelen

Kies een haven (Amsterdam, Rotterdam, Europoort, Antwerpen of de Oefenhaven). Open de planning (N), neem een klus aan, laad bij de gele terminal door er stil te liggen, vaar naar het zeeschip en kom langszij in de groene zone (parallel, vaart eruit, M = vast). Bunkeren gaat dan vanzelf.

- ↑/↓ telegraaf, één stand per tik (vol achteruit … vol vooruit). De motor volgt traag; omkeren gaat via de keerkoppeling.
- ←/→ of stuurwiel: roer. Het roer blijft staan; spatie of 0° = midscheeps. Q/E boegschroef (werkt alleen bij weinig vaart).
- S of AFSTOPPEN: volle kracht achteruit tot stil, dan STOP. M vastmaken/losgooien.
- J varen naar: het open water wordt overgeslagen tot vlak voor je bestemming (tijd, getij, verkeer en concurrenten lopen door).
- N planning · B winkel (aan een terminal) · C brug/sluis oproepen · K grote kaart · T snelvaart (6×, nog eens: 12×) · H hoorn · V marifoon · G geluid · P muziek · F camera · Esc pauze.

Op een telefoon: stuurwiel of ◀ ▶ vasthouden (roer blijft staan, 0° = midscheeps), ＋/− telegraaf, AFSTOPPEN, ⚓ vastmaken/los, BOEG-knoppen; slepen = rondkijken, knijpen = zoomen; 🗺 kaart en ☰ havenmenu bovenin. Dwars houden geeft het meeste zicht. Toetsaanwijzingen worden op een aanraakscherm vervangen door de naam van de knop (`src/ui/touch-text.mjs`).

Op de kaart: T = terminal, P = wachtplaats (rusten tegen vermoeidheid), W = werf (reparatie, 3 🪙 per punt). Boven 40 schade lek je lading. Klussen zijn kort, lang, spoed of getij (vóór hoogwater). Op tijd en schadevrij geeft bonus en reputatie bij de rederij. Bunker Bert en Truus Tank varen ook klussen, pakken er soms een van de planning af en racen af en toe mee naar jouw schip: wie het eerst langszij ligt, krijgt de klus.

Elke aanleg krijgt 1–3 ⚓ (vaart, hoek, ruimte tot kade of schip); STRAK! langs een zeeschip levert een fooi op. Zinken kost een kwart van je goud en wat reputatie; de sleepboot brengt je naar de werf.

Vaargedrag **schipper** (standaard) is het 2D-vaarmodel; **arcade** is geholpen en vergevingsgezind (startscherm). Vaartempo 3× is het tempo van het 2D-spel.

## Ontwikkelen

Node.js 22 of nieuwer. `index.html` werkt direct vanuit de repository (GitHub Pages); `npm run build` maakt daarnaast een losse `dist/`.

```sh
npm ci
npm run dev          # http://localhost:4173
npm run check        # tests, build, bestandsverwijzingen, integratietest op de build
npm run format       # prettier
node scripts/sync-maps.mjs   # na een wijziging in ../maps/*.js
```

| Onderdeel                              | Bestand                                                   |
| -------------------------------------- | --------------------------------------------------------- |
| Kaarten (kopie van `../maps/*.js`)     | `src/maps/classic/`, omzetting `src/maps/classic-map.mjs` |
| Water, stroom, getij, route-advies     | `src/maps/index.mjs`                                      |
| Vaarmodel schipper / arcade            | `src/game/sim-vessel.mjs`, `src/game/play-vessel.mjs`     |
| Spelstap, afmeren, laden, bunkeren     | `src/game/simulation.mjs`                                 |
| Planning, winkel, betaling, reputatie  | `src/game/harbor.mjs`                                     |
| Verkeer, bruggen/sluizen, concurrenten | `src/game/traffic.mjs`, `gates.mjs`, `rivals.mjs`         |
| Incidenten en VTS                      | `src/game/events.mjs`                                     |
| Opslag en migratie                     | `src/game/state.mjs`, `src/app/storage.mjs`               |
| 3D-wereld, decor, schepen              | `src/render/`                                             |
| HUD, havenkantoor, kaart               | `src/ui/`, `index.html`, `styles/`                        |
| Geluid en marifoon                     | `src/audio/`                                              |

Zie [architectuur](docs/ARCHITECTURE.md) en [scheepsregels](VESSEL_RULES.md).

## Tests

- `tests/schipper.test.mjs` haalt `physics()` uit `../engine.js` en vergelijkt het 3D-vaarmodel stap voor stap, ook met stroom en wind. Verandert het 2D-vaarmodel, dan faalt deze test tot het 3D-model mee is.
- `tests/maps.test.mjs` controleert per kaart: alle terminals, wachtplaatsen en klanten liggen op water, passen de romp en accepteren vastmaken; routes lopen niet over land; 30 minuten verkeer en concurrenten blijven op het water en maken klussen af.
- `tests/ui-smoke.test.mjs` bouwt de echte scène en speelt een klus via de echte knoppen.

- `tests/haven.test.mjs` controleert per haven dat elk herkenningspunt op land staat, buiten ligplaatsen, en binnen het driehoekenbudget; plus het weerbeeld en de hoorn van de concurrenten.

Niet getest: echte WebGL-prestaties op een telefoon. Engels dekt alle vaste teksten; plaatsnamen, scheepsnamen en rederijen blijven Nederlands.

## Taal

Nederlands is de taal van de code, zoals in 2D. Engels (knop **English** op het startscherm, of `?lang=en`) is een laag eroverheen: `src/i18n/index.mjs` vertaalt elke tekst op het moment dat hij het spel verlaat (tekst op de pagina, tooltips, de stem van de marifoon; het label JOUW SCHIP en de kaartgrens in de 3D-wereld). `src/i18n/en.mjs` bevat de Nederlandse stukken met hun Engels; het langste stuk wint en een stuk past alleen op hele woorden. Nieuwe tekst toevoegen: schrijf hem in het Nederlands en zet het stuk in `en.mjs`. `tests/i18n.test.mjs` faalt als een vaste tekst uit `index.html` geen Engels heeft. De kaarten leveren hun eigen vertalingen (`i18n` in `../maps/*.js`).

## Geluid

Havenmenu → **Geluid · volume per kanaal**: totaal, motor en effecten, muziek en marifoon, bewaard per browser; muziek aan/uit met de knop of P.

## Miniatuurbeeld (tilt-shift)

In de uitgebreide beeldstand wordt het beeld als miniatuur getoond: scherp in een band over je schip, naar boven en beneden steeds waziger, met iets meer kleur (`src/render/tilt-shift.mjs`). Het is één extra schermvullende stap; het bespaart op zichzelf geen tekenwerk. In de zuinige stand (telefoons) en in het stuurhuis staat het uit.

## Ranglijst per haven

Onder de planning staat de ranglijst van de haven: de vijf beste diensten in deze browser (`src/game/ranking.mjs`, opslag `bunkerguru3d-rank-<kaart>`). Een dienst is één verblijf in een haven binnen één carrière; elke afgeronde klus telt erbij. Score per klus zoals in 2D: 1000, plus 3 punten per seconde die je voor de ETA klaar bent (hooguit 900), min 10 per punt schade, plus VTS-punten. De 2D-versie telde de tijd onder vijf minuten; hier telt de marge op de ETA, omdat klussen in 3D een eigen deadline hebben.

## Stroom en drift

De stroom is in 3D de helft van de waarde op de 2D-kaart (`CURRENT_FEEL = 0.5` in `src/maps/index.mjs`): op de piek 1,5 m/s in Rotterdam, 1,75 m/s op de Schelde en 2 m/s op de Waterweg, dicht bij de echte rivier. De factor geldt voor rivier, neren voor de havenmonden en zijkanalen; het vaarmodel zelf blijft gelijk aan `engine.js`. Een nieuwe carrière begint rond de kentering, zodat de eb pas opkomt als je onderweg bent.

Op het startscherm stel je het water zelf bij (`src/game/feel-settings.mjs`, bewaard bij de carrière). **Traagheid** bepaalt hoe lang de romp erover doet om vaart te maken en te verliezen; kracht en topsnelheid blijven die van `engine.js`. Gemeten op tempo 3×, volle kracht vooruit vanuit stilstand en daarna STOP: licht (het oude 3D-gevoel) 25 km/u na 5 s en 125 m uitlopen, normaal (standaard) 10 s en 270 m, zwaar 20 s en 400 m, echt (een beladen tanker) 35 s en 560 m. **Stroom** (zwak, normaal, sterk: ×0,5, ×1, ×1,5) geldt voor de rivier en de neren voor de havenmonden samen.

Zoals in 2D zie je drift op het water: wit doorgetrokken is waar de kop heen wijst, geel gestippeld de koers over de grond (vanaf 3° verschil). Voor de boeg staat een cyaan pijl met de stroomrichting en -sterkte op die plek (`src/game/drift.mjs`, getekend in `navigation-effects.mjs`).

## Havens

**Rotterdam Stad** ligt op de echte kaart: de waterlijn van de Nieuwe Maas van de Eemhaven tot de Van Brienenoordbrug komt uit OpenStreetMap (© OpenStreetMap-bijdragers, ODbL), met de Waalhaven en haar pieren, Eemhaven, Merwehaven, Maashaven, Rijnhaven en de S-bocht om het Noordereiland. Ligplaatsen, terminals, bruggen en herkenningspunten staan op hun echte plek; noord is boven. Zie "Echte havens" in `docs/ARCHITECTURE.md`. Bij de andere havens is de indeling die van de 2D-kaart (rechtgetrokken rivier, bekkens als rechthoeken). Wat erop staat is cartoon, maar staat waar het in het echt staat. `src/render/landmarks.mjs` bevat per haven de herkenningspunten in de s/n-eenheden van `../maps/*.js`, zodat een plek naast de kaart te leggen is:

- **Rotterdam Stad**: Euromast, Depot Boijmans, Zalmhaventoren, Witte Huis, Kubuswoningen, Markthal, Laurenskerk, De Rotterdam, Hotel New York, Maastoren, Maassilo, De Kuip; Erasmusbrug, Willemsbrug, De Hef en Van Brienenoordbrug met hun eigen silhouet.
- **Nieuwe Waterweg · Botlek**: Maeslantkering, windpark op de Landtong, Groote Kerk Maassluis, verkeerspost, raffinaderijen Europoort, Botlek en Shell Pernis met fakkels, Botlekbrug, Schiedamse molens, Wilton-Fijenoord.
- **Amsterdam Westpoort**: Hoogovens, windpark, kolenoverslag, Zaandam en de Zaanse molens, Hemwegcentrale, graansilo, NDSM-kraan, REM-eiland, Pontsteiger, A'DAM Toren.
- **Antwerpen Schelde**: kerncentrale Doel, radartoren Zandvliet, BASF, Fort Liefkenshoek, Fort Lillo met molen De Eenhoorn, Havenhuis, Het Steen, kathedraal, Boerentoren, MAS, Linkeroever met Sint-Annastrand.

Kades hebben een muur met deksloof, bolders en fenders; polderoevers een steenbestorting. Containerkranen staan waar de kaart containers heeft. De grond is per wijk geschilderd (`ground.mjs`). `scenery.mjs` kleedt de kaart aan zonder de indeling te raken: de buurt bepaalt of een bouwblok oude stad (baksteen, zadeldak), flat of glazen kantoor wordt; langs stadskades staat een rij grachtenpanden achter bomen, langs havenkades loodsen, stapels en vrachtwagens, langs olieterreinen leidingbruggen. Ramen tekent de shader (een passend raster per gevel, 's nachts deels verlicht), een zachte schaduwrand op de grond zet elk gebouw neer. Het water kent de afstand tot de oever (`water.mjs`): ondiep is lichter, onder de kademuur donker, met schuim tegen de wal. Buiten de kaartrand loopt de polder door tot een heiige horizon. In zuinig beeld vervalt de aankleding die alleen sier is. Een nieuw herkenningspunt: regel in `LANDMARKS` (soort, naam, s, n, vrije straal r) en zo nodig een bouwblok in `createLandmarks`.

Weer zoals in 2D: elke 8–15 minuten een nieuw weerbeeld (helder, bewolkt, regen, buien) met weerbericht op de marifoon; wind voel je vanaf 4 Bft en staat achter de klok. Bij regen en buien regent het ook echt. Concurrenten geven een stoot op de hoorn en soms een opmerking over de marifoon als je voor hun boeg ligt.

Three.js r160 staat met MIT-licentie in `vendor/`.

## Bunkertanker

De speelbare tanker is vormgegeven naar de Leonore, op de bestaande spelmaat van 110 × 11 meter. Open **Schip · radar, verlichting & bunkergiek** in het havenmenu voor de radar, drie lichtcircuits en de beweegbare bunkergiek. R schakelt de radar, L de navigatieverlichting. Zie [model, Blender-export en bediening](docs/BUNKERTANKER.md).
