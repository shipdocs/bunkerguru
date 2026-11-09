# Bunkertanker — Leonore als visueel voorbeeld

De speelbare tanker heeft een lage zwarte romp, steengrijs dek (RAL 7030), witte achteropbouw met blauwe accenten en een oranje pet (#ffa500) op de stuurhut, witte buitenboeiing voor en achter met een blauw potdeksel, tankhoofden, leidingen, manifolds, loopbrug, bolders, ankerlier en een vakwerk-bunkergiek. De vier door de gebruiker aangeleverde Leonore-foto's dienen als vormreferentie; dit is een vereenvoudigd spelmodel, geen exact werfmodel. Referentiegegevens: [Leonore, ENI 02333003](https://www.binnenvaart.eu/motortankschip/13431-leonore.html), 86 × 9,60 m. De foto's zijn niet in de repository gekopieerd.

De game behoudt het bestaande **110 × 11 m-profiel**, inclusief de gedeelde `hullOutline`, camera, aanvaringscontour, tankinhoud en vaarregels. Er is geen nieuwe scheepskeuze. Andere maten vragen eigen gevalideerde profielen en passende ligplaatsen; een model alleen verandert het schip in de simulatie niet.

## Bediening

Open **Havenmenu → Schip · radar, verlichting & bunkergiek** (desktop: het havenpaneel).

- Radar: aan/uit, ook **R**; 24 omwentelingen per minuut in werkelijke speeltijd.
- Navigatieverlichting: aan/uit, ook **L**. Varend volgens BPR/RPR art. 3.08: wit toplicht op de voormast (225°, 112,5° naar elke kant), een tweede, hoger toplicht achter, zijlichten rood bakboord en groen stuurboord op de stuurhutvleugels (elk 112,5°, van recht vooruit tot 22,5° achterlijker dan dwars, 2° overlap over de boeg) en een wit heklicht (135° naar achteren). Elke gloed is alleen te zien vanuit de eigen sector, gezien vanaf de camera. Aangemeerd (BPR 3.20): navigatielichten uit, één wit licht rondom. Lichtsterkte en exacte afschermhoeken zijn vereenvoudigd.
- Deklicht: twee gerichte lampen verlichten echt het dek; geen extra schaduwkaarten.
- Stuurhuislicht: warme lichtstroken in de ramen.
- Giek: klik achtereenvolgens voor **omhoog → bakboord → stuurboord → geborgen**. Bediening kan als het schip is vastgemaakt. De giek komt eerst omhoog, draait dan naar buiten en centreert vóór het zakken. De slang hangt vanaf de top. Losgooien laat de giek terugbergen.

De uitrusting pauzeert met de game. Schakelaars blijven bewaard in bestaande saves; oudere saves krijgen standaardinstellingen. Giek en slang zijn visueel en veranderen het automatische bunkeren niet. Er is nog geen slangverbinding naar het ontvangende schip of botsingsdetectie voor de giek.

## Bron en bestanden

De bewerkbare Blender-bron staat naast beide GLB-exports in `assets/vessels/bunkertanker-110.blend`. De gecontroleerde PNG-render `bunkertanker-110.png` toont het schip met geborgen giek.

| Bestand                                        | Doel                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `src/render/bunker-tanker.mjs`                 | Gedeelde geometrie, materialen, benoemde draaipunten en animatiesturing   |
| `src/game/vessel-equipment.mjs`                | Standaardinstellingen en veilige migratie                                 |
| `src/ui/vessel-equipment.mjs`                  | Knoppen met getters voor de actuele carrière                              |
| `assets/vessels/bunkertanker-110.glb`          | Geoptimaliseerde export voor Three.js/andere engines, inclusief radarclip |
| `assets/vessels/bunkertanker-110-editable.glb` | Losse onderdelen voor bewerking in Blender                                |
| `scripts/tanker-blender.py`                    | Maakt `.blend` en PNG uit de bewerkbare export                            |

In de game bouwt de factory het schip rechtstreeks met de reeds aanwezige Three.js-versie. Daardoor zijn geen extra GLB-download, loader of nieuwe runtime-afhankelijkheden nodig. De geëxporteerde GLB gebruikt precies dezelfde geometrie. `three` is uitsluitend een vastgezette **ontwikkelafhankelijkheid** voor de officiële GLTFExporter; de bestaande `vendor/three.js` blijft ongewijzigd.

De hoofdgroepen heten `Hull-and-deck`, `Radar-rotor`, `Bunker-boom-slew`, `Bunker-boom-lift`, `Bunker-hose`, `Navigation-lights`, `Deck-lights` en `Wheelhouse-lights`. Statische details worden per bewegingsgroep samengevoegd. Circa 14.400 driehoeken en 16 meshes voor het speelbare schip; echte telefoonsnelheid is daarmee niet bewezen. GLB bewaart geen JavaScript of standaard-zichtbaarheid: stel de lichtgroepen en slang zelf in bij gebruik buiten deze game. De clip `Radar-spin` kan met een AnimationMixer worden afgespeeld; giekstanden en schakelaars bestuurt de game zelf.

```sh
npm ci
npm run model:export
blender --background --python scripts/tanker-blender.py
npm run check
npm run format:check
```

Het Blender-script bewaart de losse onderdelen, radaranimatie, benoemde draaipunten, meter-eenheden en een aparte studiocollectie met camera/licht. Exporteer alleen de scheepshiërarchie als je het model in Blender wijzigt. Blender wijzigt de assen van glTF (Y omhoog) naar Z omhoog; de objecthiërarchie blijft behouden. Blender-wijzigingen worden niet automatisch teruggeschreven naar de procedurele factory: integreer dan bewust de aangepaste GLB met een loader of pas de factory aan en genereer opnieuw.

Validatie: eindige geometrie, gedeelde rompcontour, mesh-/driehoekbudget, radarstop, onafhankelijke lichtcircuits, draaipunten, ruststand, pauze, save-migratie en de echte UI met vervangbare renderer. De bestaande vaar-, botsings- en kaarttests blijven van toepassing.
