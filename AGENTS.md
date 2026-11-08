# Bunkerguru

Read README.md and docs/ARCHITECTURE.md before restructuring modules. Read VESSEL_RULES.md before changing vessel rendering, controls, physics, collisions, scale or camera framing.

- Edit src/ and public/; dist/ is generated and must not be edited or committed.
- Use src/game/ship-profile.mjs as the single source of vessel dimensions. Do not tune individual ships with arbitrary steering multipliers.
- Preserve persistent helm, browser storage keys, save migration and the original physics oracle.
- Keep simulation independent of DOM/WebGL; pass current state through getters to long-lived input/UI handlers.
- Use npm run check after relevant changes; it includes source tests, build validation and the integration test against built files.
- Use npm run format and npm run format:check for authored files. Keep vendor code and original reference sources intact.
- Publish the output of npm run build with the existing Sites project identity and audience.
