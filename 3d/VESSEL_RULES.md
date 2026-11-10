# Vessel rules — Bunkerguru 3D

**Update (schipper):** normal gameplay now uses `src/game/sim-vessel.mjs`, the exact `physics()` of the 2D game (`engine.js`): DYN 0.4 inertia, rudder side force and drift, slow two-stroke rpm, pneumatic reversing clutch, current shear over the hull, wind. `tests/schipper.test.mjs` extracts `physics()` from `../engine.js` and compares step by step (still water, and with current, wind and cargo). Do not change `sim-vessel.mjs` without changing `engine.js` (or the reverse). One simulated second equals one physics second of the 2D game; tempo 3× equals the 2D game's `TIME = 3`. AFSTOPPEN in schipper mode puts the engine full astern via the clutch until the ship lies still, then STOP — no magic brake. Collision damage, cooldown (0.6 s 2D = 1.8 simulated s) and fender upgrade follow `engine.js`.

The **arcade** handling described below remains available as a player option (`state.handling = 'arcade'`).

These rules apply to all current and future ships. One profile is the source of truth; do not compensate for a ship's size with unrelated constants in rendering, input or collisions.

## Units and current vessel

- One scene unit is one metre. Velocity is m/s, angular velocity rad/s, time seconds, cargo tonnes.
- The playable boat is the original **110 × 11 m**, **1200 t** tank capacity (`legacy` profile ID). Confirmed against `shipdocs/bunkerguru/engine.js`: `L:110`, `B:11`, base tank capacity 1200, normalized motor 6.2 and bow 1.
- Reference profiles retained for regression: compact **44 × 7.5 m**, 500 t; large **135 × 11.45 m**, 2000 t.
- Length and beam must feed model construction, hull shape, collision probes, wake origin, and camera framing. The active 110 m profile controls the visible hull, handling, collision samples, wake origin, camera and berth zone together.
- Gameplay uses north = -z; positive heading turns starboard. Three.js model yaw = -heading.

## Shared assisted handling — playability first

The user explicitly replaced the earlier realism request with responsive, enjoyable controls. Normal gameplay uses `play-vessel.mjs`. Keep one common model across all hull profiles. Keep responsive propulsion and braking; the user explicitly requires persistent helm.

- The wheel turns ±180° for ±60° rudder; grabbing it does not jump the command.
- Left/right hold adjusts the rudder angle; release keeps the selected angle. The rotary steering wheel stays set on release, cancellation, lost capture and blur. Only an explicit 0° command centres the helm; pause, tab switching, braking and save restore preserve it. The actual rudder follows smoothly, so no heading snaps occur.
- Telegraph selects reverse, stop, slow, half, full (original indices 0/3/5/6/8). One press from STOP gives useful forward motion. Q/E remain independent bow-thruster controls.
- Space or AFSTOPPEN latches an active brake, selects STOP, preserves helm and reduces surge, sway and yaw until stationary. A new throttle input cancels the brake. It is an intentional game assist, not realistic crash-stop physics.
- Motor RPM responds within about one second. Forward target speed uses normalized RPM × 7.2 m/s, slightly reduced by cargo; reverse is capped at 2.5 m/s for the original motor. Acceleration, turn rate and braking share `(110 / length)^0.18 / (1 + 0.2 * cargoFraction)`; size/load differences remain mild. Mission target never changes handling at equal cargo.
- Progressive helm response keeps small corrections useful. Course stabilization arrests residual yaw after an explicit amidships command. Bow effectiveness fades to zero at 3.5 m/s; a stationary rudder alone cannot turn the hull.
- Integrate contacts every substep, at no more than 1/60 s. Same input sequence must stay consistent across 30–120 frame/s.
- The original source comparison remains through explicit `{legacy:true}` on `vesselStep` in tests. The `legacy` hull profile ID selects original dimensions, not original physics. Preserve exact parity with the old source oracle.
- Original motor 6.2 and bow 1 are normalized game coefficients, not horsepower or newtons.

## Time and migration

The render loop uses `src/app/simulation-clock.mjs`: elapsed time is accumulated into fixed 1/60 s steps. Do not discard time on every frame below 20 FPS. The 250 ms stall cap and pause reset prevent unbounded catch-up. See `docs/SPEED.md`.

Default **2× playing tempo**, optional **1× calm** and **3× fast**. `src/game/time-scale.mjs` is the shared source for all three settings. Existing saves migrate once via `paceVersion`; subsequent explicit choices persist. Traffic, pumping and contract deadlines share the time multiplier. Dialogs and pause suspend all simulation. Previous saves migrate once to playing tempo with the saved helm; position, progress, cargo and money survive. Subsequent deliberate tempo changes are preserved.

## Collisions

Use `hullSamples(profile)` over ±0.46 × length with half the actual beam as probe radius. The compact reference retains its original seven samples; the 110 m hull uses twelve overlapping probes to avoid gaps along the longer hull. Longitudinal spacing stays below one beam. A broad-phase hull extent check skips distant walls before probing. Apply contacts at every physics substep. The original normal-velocity response, yaw damping on contact, impact threshold, damage formula and cooldown are retained. Tangential movement should remain possible while sliding beside a quay. The Amsterdam map derives land collision rectangles from the original map source. All six receiver colliders follow their actual axis, length and beam; east–west berths require east–west alignment. Moving traffic uses capsules based on actual length/beam, sampled against the same player hull probes. Relative velocity determines damage; this is not the original map's fault-allocation system.

## Adding a ship

1. Add immutable profile data in `src/game/ship-profile.mjs` with id, name, metre dimensions, tank capacity and normalized force coefficients.
2. Set the active state's `shipId`; render and physics resolve it through `profileOf`. No ship selector or purchase flow is implemented yet.
3. Ensure the mission target fits tank capacity and the berth accommodates the actual length/beam. Layout, entrance, turning-area, berth and traffic validation is required before enabling another ship. The 110 m hull is now validated against the narrowed Amsterdam layout; the 135 m reference is not selectable.
4. Keep legacy parity tests. Test longer/shorter response at equal initial speed and rudder, collider dimensions, rendered shape and save defaults.
5. Do not claim empirical hydrodynamic realism: these are assisted game equations tuned to player feedback.

Current environment is sheltered, with no wind/current, fatigue or random failures. Those systems are separate from the shared vessel model and have not been ported into the MVP.

## Repeatable handling checks

At 1× with the active 110 × 11 m ship and full 1200 t cargo, calm water and no contacts:

- First ahead setting: about **7.2 km/h after four seconds**.
- Full ahead: over **20 km/h within nine seconds**, bounded top speed about 24 km/h loaded.
- Hard helm at slow ahead: approximately **91° in fourteen seconds**. Explicitly setting 0° damps the turn within two seconds; releasing input alone keeps the turn going.
- AFSTOPPEN from 20 km/h: about **4.9 seconds / 13.7 metres**. The engine stays at STOP afterwards.

These are deterministic acceptance scenarios for an assisted game, not vessel performance data. Tests also cover proportional small helm, reverse steering, braking while turning, load/length differences, real terminal departure, migration, mobile cancellation, and the unchanged old-source oracle.

## Active original-sized vessel and waterways

`waterway-layout.mjs` defines the playable width bands. Main-canal stretches vary from 190 to 280 m; basin entrances vary from 60 to 220 m, widening inside up to 420 m. The narrow unassigned side canals may require backing out. Working harbours have tested turning positions, all six receivers and both terminals fit the full active hull, and moving traffic is tested along its length and beam. Visible quays, land collision rectangles and the chart all use the same resulting geometry. The map remains a schematic inspired by Amsterdam, not a surveyed chart.

State version 6: the harbours are warped (river bends, leaning basins; `src/maps/warp.mjs`, see docs/ARCHITECTURE.md). The vessel equations are untouched: the player sails and collides in the warped world, quays are the map rectangles seen through the warp, a moored seagoing ship is a rigid box along its curved quay. A version 5 position is carried to the same spot in the warped harbour; career, money, jobs and upgrades survive every version.

Map version 4 migrates older careers to the revised Westhaven terminal with the new hull; cargo, contracts, money, reputation, jobs and upgrades survive, the engine stops, and the active deadline restarts. A current-version 110 m save retains its position. Existing contracts stay 500/300/200 t as partial loads; changing mission size never changes tank capacity or handling at equal cargo.
