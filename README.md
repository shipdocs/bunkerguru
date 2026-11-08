# Bunkerguru – Bunkerboot ARA

Cartoon arcade game: run a bunker barge on the Nieuwe Waterweg and Oude Maas. Load at a terminal, dodge traffic and current, come alongside seagoing ships, make fast, bunker, earn gold, upgrade your boat and beat your rivals Bunker Bert and Truus Tank.

**Play:** https://shipdocs.github.io/bunkerguru/

No dependencies: plain canvas + JS. `engine.js` is the game, `maps/*.js` are the maps (Nieuwe Waterweg · Botlek, Rotterdam Stad, Amsterdam Westpoort, Antwerpen Schelde). NL/EN. Esc opens the map menu. Procedural sound via Web Audio (`audio.js`): engine, bow thruster, wash, horn (H), mute (G), background music "Drunken Sailor" (traditional, public domain) on P. VHF radio chatter (`radio.js`, browser speech) every few minutes, V to toggle. Sound panel (O): volume per channel (master, engine/effects, music, VHF) with on/off, saved per browser. Zoom with +/−/mouse wheel/pinch.

Controls: ↑/↓ telegraph · ←/→ rudder · Q/E bow thruster · Space rudder amidships · M moor/cast off · T fast forward · B shop · N next job · R restart · L language

Ships: your bunker tanker and the rivals are 110 × 11 m. Waiting berths (blue P / E.5 sign): moor there to save progress and rest; 'Continue' on the start screen resumes from the last waiting berth. Fatigue builds while sailing (~15 min). Drift is shown as heading (solid) vs course over ground (dashed) plus foam on the pushed side.


New players start with a six-step practice voyage in a sheltered harbour. Use **🎓 Practice voyage** to repeat it. It teaches casting off, slow ahead, stopping and loading, sailing to a ship, and making fast to bunker. Practice has no current or rivals and does not change career gold or overwrite the regular saved voyage.

The player boat has orange hull accents, a cyan outline and a temporary label. **Details** expands the compact status panel. Cyan route advice appears on the water and map, with collision-aware labels that prioritize the boat and mission destinations. Routes avoid static land and moored ships with clearance for the beam; they do not account for moving traffic, turning radius or current. Docking assistance shows speed, alignment and mooring readiness, with an early reduce-power reminder. Touch controls use dark backgrounds and explicit bow-thruster/mooring labels.

Validation: `node --test tests/navigation.cjs` covers detours, unreachable targets and map label placement. For browser integration checks, serve this directory (`python -m http.server 8000`) and run `node tests/browser.cjs` with Playwright and Chromium available. Override `BUNKER_TEST_URL`, `CHROMIUM_PATH` or `BUNKER_ARTIFACTS` when needed. The browser test instruments its own served copy of the engine to check docking conditions and completion; no test API is included in the game.


Graphics use a shared top-down style for buildings, tanks, trees and cranes, with consistent shadows. The district layout keeps buildings off roads and water, groups industrial buildings and container yards, and adds pipe racks to tank parks. Water uses a muted gradient and subtle animated waves instead of the repeating high-contrast image texture. The original ship detail remains visible under selective orange hull accents.

The canvas backing store follows device pixel density up to 2×, with a six-megapixel target budget, while controls, camera, map hit targets and simulation coordinates stay in CSS/world pixels. Run `node --test tests/navigation.cjs tests/graphics.cjs` for geometry/layout checks and `node tests/graphics-browser.cjs` for all four harbours, DPR3 rendering, rotation, map taps and missing-image fallback.

## Nieuw (nov 2026)
- **Opdrachtenbeurs**: drie klussen (kort / getij of lang / spoed) met ETA of tijvenster; op tijd = +25 %, te laat = korting. Toetsen 1/2/3. Wat je laat liggen, pakken de concurrenten.
- **Reputatie per rederij**: tarief ×0,8–×1,2; vaste klanten vanaf 75.
- **Dagdoel en ranglijst** per kaart (lokaal opgeslagen).
- **Weer en dag/nacht**: weerbericht via VHF, staande wind, regen en buien, vaarlichten en kadeverlichting 's nachts.
- **Sluis en brug**: Kallosluis (Antwerpen) en Koninginnebrug (Rotterdam) oproepen met **C**.
- **VTS**: wacht-aanwijzingen bij havenmonden; opvolgen levert punten, negeren kost reputatie.
- **Schade blijft**: lekkage boven 40 schade, reparatie alleen op de werf (W op de kaart, 3 goud/pt).
- **Incidenten**: blackout, roer klemt, mist, windvlaag, drijvende container, zeeschip met storing; met alarm.
- **Motor**: langzaamloper met keerkoppeling (pneumatisch), tyfoon 80 Hz, 60° roer, meer massatraagheid.
