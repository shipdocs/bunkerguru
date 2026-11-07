# Bunkerguru – Bunkerboot ARA

Cartoon arcade game: run a bunker barge on the Nieuwe Waterweg and Oude Maas. Load at a terminal, dodge traffic and current, come alongside seagoing ships, make fast, bunker, earn gold, upgrade your boat and beat your rivals Bunker Bert and Truus Tank.

**Play:** https://shipdocs.github.io/bunkerguru/

No dependencies: plain canvas + JS. `engine.js` is the game, `maps/*.js` are the maps (Europoort Calland, Rotterdam Stad, Amsterdam Westpoort, Antwerpen Schelde). NL/EN. Esc opens the map menu. Procedural sound via Web Audio (`audio.js`): engine, bow thruster, wash, horn (H), mute (G), background music "Drunken Sailor" (traditional, public domain) on P. VHF radio chatter (`radio.js`, browser speech) every few minutes, V to toggle. Sound panel (O): volume per channel (master, engine/effects, music, VHF) with on/off, saved per browser. Zoom with +/−/mouse wheel/pinch.

Controls: ↑/↓ telegraph · ←/→ rudder · Q/E bow thruster · Space rudder amidships · M moor/cast off · T fast forward · B shop · N next job · R restart · L language

Ships: your bunker tanker and the rivals are 110 × 11 m. Waiting berths (blue P / E.5 sign): moor there to save progress and rest; 'Continue' on the start screen resumes from the last waiting berth. Fatigue builds while sailing (~15 min). Drift is shown as heading (solid) vs course over ground (dashed) plus foam on the pushed side.
