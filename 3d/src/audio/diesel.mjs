// Engine voice: a three-cylinder four-stroke slow-speed diesel ("langzaamloper") on
// compressed-air start. Chosen in the Motorlab (engine 1 + start A): 150 rpm at idle,
// 420 rpm at full power, every cylinder a pof of its own (tok… tok… tok).
// Pure DSP, no Web Audio: render(out, sampleRate) fills a Float32Array, so it runs in
// an AudioWorklet in the game (diesel-worklet.mjs) and directly in the tests.
export const DIESEL = {
  cyl: 3,
  idle: 150,
  max: 420,
  thump: 34,
  bark: 300,
  lope: 0.22,
  clatter: 0.08,
  decay: 0.16,
  // Air start A: valve hiss, crankshaft chuffing at ~70 rpm, catches after 2.6 s.
  crank: 2.6,
  crankRpm: 70,
  settle: 1.4,
  // A heavy flywheel: full power takes its time to wind up (rpm per second).
  spoolUp: 22,
  spoolDown: 40,
};

export function createDiesel(cfg = DIESEL, rnd = Math.random) {
  const c = cfg;
  const amp = Array.from(
    { length: c.cyl },
    (_, i) =>
      1 +
      c.lope * Math.sin((i / c.cyl) * Math.PI * 2 + 0.7) * 0.6 +
      c.lope * (((i * 7) % 5) / 5 - 0.4),
  );
  const E = {
    mode: 'off', // off | crank | run
    t: 0, // seconds in the current mode
    rpm: 0,
    power: 0, // telegraph power 0..1 asked by the game
    want: false, // the game wants the engine running
    cyl: 0,
    phase: 0,
    fires: 0, // count of firings (tests)
    pulse: 0,
    bark: 0,
    beat: 0,
    tick: 0,
    hiss: 0,
    extra: 0,
    tPhase: 0,
    bPhase: 0,
    lpBark: 0,
    rum: 0,
    h1: 0,
    h2: 0,
    out: 0,
    turboRef: 0,
    turboT: 0,
    turboAmp: 0,
    turboPh: 0,
  };
  // Target rpm for the current state: idle plus the telegraph's share of the range.
  const runTarget = () => c.idle + E.power * (c.max - c.idle);
  function set(mode) {
    E.mode = mode;
    E.t = 0;
  }
  function step(dt) {
    E.t += dt;
    // The game switches the engine on: air start; off: run down.
    if (E.want && E.mode === 'off') {
      set('crank');
      E.hiss = 1.2;
    } else if (!E.want && E.mode !== 'off') set('off');
    let target = 0;
    if (E.mode === 'crank') {
      target = c.crankRpm;
      if (E.t >= c.crank) {
        set('run');
        E.extra = 1; // first fires: a fat, sooty bark
        E.rpm = Math.max(E.rpm, c.idle * 0.6);
      }
    }
    if (E.mode === 'run') target = E.t < c.settle ? c.idle * 1.35 : runTarget();
    // Flywheel: winding up costs time, slowing down a little less.
    const d = target - E.rpm,
      lim = (d > 0 ? (E.mode === 'run' && E.t >= c.settle ? c.spoolUp : 120) : c.spoolDown) * dt;
    E.rpm += Math.max(-lim, Math.min(lim, d));
    if (E.mode === 'off' && E.rpm < 1) E.rpm = 0;
  }
  function sample(dt, sr) {
    const fast = Math.min(1, E.rpm / c.max);
    // Four-stroke: every cylinder fires once per two revolutions.
    const fps = (E.rpm / 60) * (c.cyl / 2);
    E.phase += fps * dt;
    if (E.phase >= 1 && fps > 0.2) {
      E.phase -= 1;
      E.cyl = (E.cyl + 1) % c.cyl;
      const a = amp[E.cyl] * (0.92 + rnd() * 0.16);
      if (E.mode === 'run') {
        const load = 0.55 + E.power * 0.9;
        E.pulse += a * load * 0.6;
        E.bark += a * (0.3 + E.power * 0.6 + E.extra * 0.6) * 1.3;
        E.beat += (0.9 + rnd() * 0.2) * a * (0.8 + E.power * 0.5) * (1 + E.extra * 0.5);
        E.tPhase = E.bPhase = 0;
        E.fires++;
      } else if (E.mode === 'crank') {
        E.pulse += a * 0.18; // compression without fire: a soft chuff
        E.bark += a * 0.25;
        E.hiss += 0.25;
      } else if (E.rpm > 20) {
        E.pulse += a * 0.12; // running down: the pistons still sigh
      }
      E.tick += c.clatter * (0.6 + rnd() * 0.8);
    }
    const k = 1 - fast * 0.4;
    E.pulse *= Math.exp(-dt / (c.decay * k));
    E.bark *= Math.exp(-dt / (c.decay * 0.6 * k + 0.006));
    E.beat *= Math.exp(-dt / (c.decay * 0.9 * (1 - fast * 0.5)));
    E.tick *= Math.exp(-dt / 0.004);
    E.hiss *= Math.exp(-dt / (E.mode === 'crank' ? 0.6 : 0.12));
    E.extra *= Math.exp(-dt / 0.6);
    E.tPhase += c.thump * (1 + fast * 0.8) * dt;
    E.bPhase += c.thump * 0.75 * (1 + fast * 0.6) * dt * (1.4 - Math.min(1, E.beat) * 0.4);
    const thump = Math.sin(E.tPhase * Math.PI * 2) * E.pulse;
    const beat = Math.sin(E.bPhase * Math.PI * 2) * E.beat;
    const noise = rnd() * 2 - 1;
    const fc = c.bark * (1 + E.power * 2.2 + E.extra);
    E.lpBark += (noise * E.bark - E.lpBark) * (1 - Math.exp((-2 * Math.PI * fc) / sr));
    E.h1 += (noise - E.h1) * 0.45;
    E.h2 += (E.h1 - E.h2) * 0.08;
    const hiss = (E.h1 - E.h2) * Math.min(1, E.hiss) * 0.35;
    const tick = noise * E.tick;
    E.rum += (noise - E.rum) * 0.004;
    const rumble = E.rum * Math.min(1, E.rpm / c.idle) * 0.9;
    // Turbo: sings while the revs change, fades after ~3 s at steady power.
    if (Math.abs(E.rpm - E.turboRef) > c.max * 0.03) {
      E.turboRef = E.rpm;
      E.turboT = 0;
    } else E.turboT += dt;
    const fade = E.turboT < 3 ? 1 : Math.max(0.08, Math.exp(-(E.turboT - 3) / 4));
    const tt = E.mode === 'run' ? Math.max(0, (fast - 0.55) / 0.45) ** 2 * 0.04 * fade : 0;
    E.turboAmp += (tt - E.turboAmp) * 0.0005;
    E.turboPh += (700 + fast ** 1.5 * 1700) * dt;
    const turbo =
      Math.sin(E.turboPh * Math.PI * 2) * E.turboAmp +
      Math.sin(E.turboPh * Math.PI * 4) * E.turboAmp * 0.4;
    let s = beat * 0.9 + thump * 0.45 + E.lpBark * 1.4 + tick * 0.5 + rumble + hiss + turbo;
    s = Math.tanh(s * 1.3) * 0.7;
    E.out += (s - E.out) * 0.6;
    return E.out;
  }
  return {
    state: E,
    // The game: engine wanted on/off and telegraph power (0..1, astern as its size).
    set(on, power) {
      E.want = !!on;
      E.power = Math.max(0, Math.min(1, Math.abs(power || 0)));
    },
    // Fill a buffer; the state machine steps per sample (cheap enough at 48 kHz).
    render(out, sr) {
      const dt = 1 / sr;
      for (let i = 0; i < out.length; i++) {
        step(dt);
        out[i] = sample(dt, sr);
      }
      return out;
    },
  };
}
