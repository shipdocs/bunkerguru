# Bunkerguru

Read README.md and docs/ARCHITECTURE.md before restructuring modules. Read VESSEL_RULES.md before changing vessel rendering, controls, physics, collisions, scale or camera framing.

- Edit src/, index.html and styles/; dist/ is generated and must not be edited or committed.
- The 3D game ports the 2D game (`../engine.js`, `../maps/*.js`). Maps: run `node scripts/sync-maps.mjs`, never edit `src/maps/classic/`. The schipper handling must stay equal to `engine.js` physics (tests/schipper.test.mjs).
- Use src/game/ship-profile.mjs as the single source of vessel dimensions. Do not tune individual ships with arbitrary steering multipliers.
- Preserve persistent helm, browser storage keys, save migration and the original physics oracle.
- Keep simulation independent of DOM/WebGL; pass current state through getters to long-lived input/UI handlers.
- Use npm run check after relevant changes; it includes source tests, build validation and the integration test against built files.
- Use npm run format and npm run format:check for authored files. Keep vendor code and original reference sources intact.
- GitHub Pages serves this folder directly as /3d/ (no build needed).
