// Rendering may be slow on a phone; movement still consumes elapsed real time.
// Small fixed steps preserve collision/steering stability. Long stalls are capped
// to 250 ms so returning from a blocked browser cannot launch the boat across a quay.
export const SIMULATION_STEP = 1 / 60;
export const MAX_FRAME_SECONDS = 0.25;
export function createSimulationClock() {
  let remainder = 0;
  let skipNext = false;
  return {
    reset() {
      remainder = 0;
      skipNext = true;
    },
    advance(elapsed, active, tick) {
      if (!active) {
        this.reset();
        return 0;
      }
      if (skipNext) {
        skipNext = false;
        return 0;
      }
      if (!Number.isFinite(elapsed) || elapsed <= 0) return 0;
      remainder += Math.min(elapsed, MAX_FRAME_SECONDS);
      let simulated = 0;
      while (remainder + 1e-10 >= SIMULATION_STEP) {
        tick(SIMULATION_STEP);
        remainder = Math.max(0, remainder - SIMULATION_STEP);
        simulated += SIMULATION_STEP;
      }
      return simulated;
    },
  };
}
