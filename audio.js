// ---------- geluid (Web Audio, alles gegenereerd) ----------
const SND = (() => {
  let ac = null, master, engOsc, engOsc2, engGain, engFilt, bowGain, washGain, muted = false;
  try { muted = localStorage.getItem('bunker_mute') === '1'; } catch (e) {}
  function noiseBuf() { const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; } return b; }
  function loopNoise(filtType, freq, q) { const s = ac.createBufferSource(); s.buffer = noiseBuf(); s.loop = true; const f = ac.createBiquadFilter(); f.type = filtType; f.frequency.value = freq; f.Q.value = q || 0.7; const g = ac.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start(); return { g, f }; }
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ac.destination);
    // dieselmotor: twee zaagtanden, laagdoorlaat, lichte tremolo
    engFilt = ac.createBiquadFilter(); engFilt.type = 'lowpass'; engFilt.frequency.value = 220; engGain = ac.createGain(); engGain.gain.value = 0;
    engOsc = ac.createOscillator(); engOsc.type = 'sawtooth'; engOsc2 = ac.createOscillator(); engOsc2.type = 'square';
    const lfo = ac.createOscillator(), lfoG = ac.createGain(); lfo.frequency.value = 9; lfoG.gain.value = 0.12; lfo.connect(lfoG); lfoG.connect(engGain.gain); lfo.start();
    engOsc.connect(engFilt); engOsc2.connect(engFilt); engFilt.connect(engGain); engGain.connect(master); engOsc.start(); engOsc2.start();
    const b = loopNoise('bandpass', 900, 1.5); bowGain = b.g;
    const w = loopNoise('lowpass', 600, 0.5); washGain = w.g;
  }
  function update(st) { // st: {tele, speed (m/s door water), bow, moored, running}
    if (!ac || muted) return; const now = ac.currentTime, on = st.running ? 1 : 0;
    const rpm = 0.35 + Math.abs(st.tele) * 0.65;
    engOsc.frequency.setTargetAtTime(38 + rpm * 34, now, 0.4); engOsc2.frequency.setTargetAtTime(19 + rpm * 17, now, 0.4);
    engFilt.frequency.setTargetAtTime(160 + rpm * 260, now, 0.4);
    engGain.gain.setTargetAtTime(on * (0.10 + Math.abs(st.tele) * 0.16), now, 0.3);
    bowGain.gain.setTargetAtTime(on * (st.bow ? 0.35 : 0), now, 0.15);
    washGain.gain.setTargetAtTime(on * Math.min(0.5, st.speed * 0.07), now, 0.4);
  }
  function tone(type, f0, f1, dur, vol, delay) { if (!ac || muted) return; const t0 = ac.currentTime + (delay || 0); const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05); }
  function burst(freq, dur, vol, type) { if (!ac || muted) return; const s = ac.createBufferSource(); s.buffer = noiseBuf(); const f = ac.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; const g = ac.createGain(), t0 = ac.currentTime; g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); s.connect(f); f.connect(g); g.connect(master); s.start(); s.stop(t0 + dur + 0.05); }
  return {
    init, update,
    hit(power) { burst(300, 0.4 + power * 0.03, Math.min(1, 0.3 + power * 0.04)); tone('triangle', 90, 40, 0.35, Math.min(0.8, 0.2 + power * 0.03)); },
    horn() { if (!ac || muted) return; for (const f of [146.8, 185]) tone('sawtooth', f, f * 0.99, 1.1, 0.12); },
    rope() { burst(1800, 0.12, 0.25, 'highpass'); tone('square', 220, 140, 0.12, 0.08, 0.05); },
    coin() { [988, 1319, 1568].forEach((f, i) => tone('square', f, f, 0.12, 0.08, i * 0.08)); },
    sink() { tone('sine', 220, 50, 2.5, 0.3); for (let i = 0; i < 6; i++) tone('sine', 500 + Math.random() * 600, 900, 0.1, 0.1, 0.3 + i * 0.25); },
    radio() { burst(2500, 0.25, 0.15, 'bandpass'); tone('square', 1200, 1200, 0.06, 0.05, 0.25); },
    toggle() { muted = !muted; try { localStorage.setItem('bunker_mute', muted ? '1' : '0'); } catch (e) {} if (master) master.gain.setTargetAtTime(muted ? 0 : 0.5, ac.currentTime, 0.05); return muted; },
    get muted() { return muted; },
  };
})();
