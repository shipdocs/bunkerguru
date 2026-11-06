// ---------- geluid (Web Audio, alles gegenereerd) ----------
const SND = (() => {
  let ac = null, master, engOsc, engOsc2, engGain, engFilt, bowGain, washGain, muted = false, musicOn = true, musicGain = null, musicTimer = null;
  try { musicOn = localStorage.getItem('bunker_music') !== '0'; } catch (e) {}
  try { muted = localStorage.getItem('bunker_mute') === '1'; } catch (e) {}
  // volumes 0–100 per kanaal
  let vol = { master: 80, sfx: 80, music: 60, radio: 80 }, sfx = null, radioBus = null;
  try { Object.assign(vol, JSON.parse(localStorage.getItem('bunker_vol') || '{}')); } catch (e) {}
  const gMaster = () => muted ? 0 : vol.master / 100 * 0.65, gMusic = () => musicOn ? vol.music / 100 * 0.55 : 0;
  function applyVol() { if (!ac) return; const t = ac.currentTime; master.gain.setTargetAtTime(gMaster(), t, 0.05); sfx.gain.setTargetAtTime(vol.sfx / 100, t, 0.05); musicGain.gain.setTargetAtTime(gMusic(), t, 0.1); radioBus.gain.setTargetAtTime(vol.radio / 100, t, 0.05); }
  function noiseBuf() { const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; } return b; }
  function loopNoise(filtType, freq, q) { const s = ac.createBufferSource(); s.buffer = noiseBuf(); s.loop = true; const f = ac.createBiquadFilter(); f.type = filtType; f.frequency.value = freq; f.Q.value = q || 0.7; const g = ac.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(sfx); s.start(); return { g, f }; }
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = gMaster(); master.connect(ac.destination);
    sfx = ac.createGain(); sfx.gain.value = vol.sfx / 100; sfx.connect(master); radioBus = ac.createGain(); radioBus.gain.value = vol.radio / 100; radioBus.connect(master);
    // dieselmotor: twee zaagtanden, laagdoorlaat, lichte tremolo
    engFilt = ac.createBiquadFilter(); engFilt.type = 'lowpass'; engFilt.frequency.value = 220; engGain = ac.createGain(); engGain.gain.value = 0;
    engOsc = ac.createOscillator(); engOsc.type = 'sawtooth'; engOsc2 = ac.createOscillator(); engOsc2.type = 'square';
    const lfo = ac.createOscillator(), lfoG = ac.createGain(); lfo.frequency.value = 9; lfoG.gain.value = 0.12; lfo.connect(lfoG); lfoG.connect(engGain.gain); lfo.start();
    engOsc.connect(engFilt); engOsc2.connect(engFilt); engFilt.connect(engGain); engGain.connect(sfx); engOsc.start(); engOsc2.start();
    const b = loopNoise('bandpass', 900, 1.5); bowGain = b.g;
    const w = loopNoise('lowpass', 600, 0.5); washGain = w.g;
    musicGain = ac.createGain(); musicGain.gain.value = gMusic(); musicGain.connect(master);
    startMusic();
  }
  // ---------- muziek: "Drunken Sailor" (traditioneel, rechtenvrij), D dorisch ----------
  // ABC-notatie, 1 eenheid = achtste noot. Couplet + refrein, 16 maten.
  const N = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.0, A: 440.0, B: 493.88, c: 523.25, d: 587.33 };
  const TUNE = [
    ['A',2],['A',1],['A',1],['A',2],['A',1],['A',1], ['A',2],['D',2],['F',2],['A',2],
    ['G',2],['G',1],['G',1],['G',2],['G',1],['G',1], ['G',2],['C',2],['E',2],['G',2],
    ['A',2],['A',1],['A',1],['A',2],['A',1],['A',1], ['A',2],['B',2],['c',2],['d',2],
    ['c',2],['A',2],['G',2],['E',2], ['D',4],['D',4],
    ['A',4],['A',4], ['A',2],['D',2],['F',2],['A',2],
    ['G',4],['G',4], ['G',2],['C',2],['E',2],['G',2],
    ['A',4],['A',4], ['A',2],['B',2],['c',2],['d',2],
    ['c',2],['A',2],['G',2],['E',2], ['D',4],['D',4],
  ];
  const CHORDS = ['Dm','Dm','C','C','Dm','Dm','C','Dm', 'Dm','Dm','C','C','Dm','Dm','C','Dm'];
  const CH = { Dm: [146.83, 174.61, 220.0], C: [130.81, 164.81, 196.0] }, ROOT = { Dm: 73.42, C: 65.41 };
  const EIGHTH = 0.24; // ~125 bpm
  let events = null, loopLen = 0, step = 0, nextT = 0, pass = 0;
  function buildEvents() {
    events = []; let t = 0;
    for (const [n, d] of TUNE) { events.push({ t, kind: 'lead', f: N[n] * 2, d }); t += d; }
    loopLen = t; // 128 achtsten
    CHORDS.forEach((c, bar) => { const b0 = bar * 8;
      events.push({ t: b0, kind: 'bass', f: ROOT[c], d: 3 }, { t: b0 + 4, kind: 'bass', f: ROOT[c] * 1.5, d: 3 });
      for (const o of [2, 6]) events.push({ t: b0 + o, kind: 'chord', fs: CH[c], d: 1.5 });
      for (const o of [0, 4]) events.push({ t: b0 + o, kind: 'kick' }); for (const o of [2, 6]) events.push({ t: b0 + o, kind: 'snare' });
    });
    events.sort((a, b) => a.t - b.t);
  }
  function lead(f, t0, dur, harm) { // accordeon: twee licht ontstemde zaagtanden met vibrato
    const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; lp.connect(g); g.connect(musicGain);
    const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5.5; vg.gain.value = f * 0.006; vib.connect(vg);
    for (const det of [-7, 7]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; vg.connect(o.frequency); o.connect(lp); o.start(t0); o.stop(t0 + dur + 0.1); }
    vib.start(t0); vib.stop(t0 + dur + 0.1);
    const v = harm ? 0.035 : 0.06; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.02); g.gain.setValueAtTime(v, t0 + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }
  function pluck(f, t0, dur, vol, type) { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g); g.connect(musicGain); o.start(t0); o.stop(t0 + dur + 0.05); }
  function drum(kind, t0) {
    if (kind === 'kick') { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(120, t0); o.frequency.exponentialRampToValueAtTime(40, t0 + 0.15); g.gain.setValueAtTime(0.35, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2); o.connect(g); g.connect(musicGain); o.start(t0); o.stop(t0 + 0.25); }
    else { const s = ac.createBufferSource(); s.buffer = snareBuf; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500; const g = ac.createGain(); g.gain.setValueAtTime(0.18, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12); s.connect(f); f.connect(g); g.connect(musicGain); s.start(t0); s.stop(t0 + 0.15); }
  }
  let snareBuf = null;
  function schedule() {
    if (!ac || !musicOn) return;
    while (nextT < ac.currentTime + 0.25) {
      const e = events[step], t0 = nextT;
      if (e.kind === 'lead') { lead(e.f, t0, e.d * EIGHTH * 0.92, false); if (pass % 2 === 1) lead(e.f * 0.75, t0, e.d * EIGHTH * 0.92, true); } // 2e keer met tweede stem (kwart lager)
      else if (e.kind === 'bass') pluck(e.f, t0, e.d * EIGHTH, 0.22, 'triangle');
      else if (e.kind === 'chord') for (const f of e.fs) pluck(f, t0, e.d * EIGHTH, 0.05, 'square');
      else drum(e.kind, t0);
      const prevT = e.t; step++;
      if (step >= events.length) { step = 0; pass++; nextT += (loopLen - prevT) * EIGHTH; }
      else nextT += (events[step].t - prevT) * EIGHTH;
    }
  }
  function startMusic() {
    if (!ac) return; if (!events) buildEvents();
    if (!snareBuf) { snareBuf = ac.createBuffer(1, ac.sampleRate * 0.2, ac.sampleRate); const d = snareBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    if (musicTimer) return; step = 0; pass = 0; nextT = ac.currentTime + 0.2; musicTimer = setInterval(schedule, 60);
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }
  function update(st) { // st: {tele, speed (m/s door water), bow, moored, running}
    if (!ac || muted) return; const now = ac.currentTime, on = st.running ? 1 : 0;
    const rpm = 0.35 + Math.abs(st.tele) * 0.65;
    engOsc.frequency.setTargetAtTime(38 + rpm * 34, now, 0.4); engOsc2.frequency.setTargetAtTime(19 + rpm * 17, now, 0.4);
    engFilt.frequency.setTargetAtTime(160 + rpm * 260, now, 0.4);
    engGain.gain.setTargetAtTime(on * (0.10 + Math.abs(st.tele) * 0.16), now, 0.3);
    bowGain.gain.setTargetAtTime(on * (st.bow ? 0.35 : 0), now, 0.15);
    washGain.gain.setTargetAtTime(on * Math.min(0.5, st.speed * 0.07), now, 0.4);
  }
  function tone(type, f0, f1, dur, vol, delay, out) { if (!ac || muted) return; const t0 = ac.currentTime + (delay || 0); const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g); g.connect(out || sfx); o.start(t0); o.stop(t0 + dur + 0.05); }
  function burst(freq, dur, vol, type, out) { if (!ac || muted) return; const s = ac.createBufferSource(); s.buffer = noiseBuf(); const f = ac.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; const g = ac.createGain(), t0 = ac.currentTime; g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); s.connect(f); f.connect(g); g.connect(out || sfx); s.start(); s.stop(t0 + dur + 0.05); }
  return {
    init, update,
    hit(power) { burst(300, 0.4 + power * 0.03, Math.min(1, 0.3 + power * 0.04)); tone('triangle', 90, 40, 0.35, Math.min(0.8, 0.2 + power * 0.03)); },
    horn() { if (!ac || muted) return; for (const f of [146.8, 185]) tone('sawtooth', f, f * 0.99, 1.1, 0.12); },
    horn5() { if (!ac || muted) return; for (let i = 0; i < 5; i++) for (const f of [220, 277]) tone('sawtooth', f, f, 0.18, 0.07, i * 0.3); }, // attentiesein: 5 korte stoten
    rope() { burst(1800, 0.12, 0.25, 'highpass'); tone('square', 220, 140, 0.12, 0.08, 0.05); },
    coin() { [988, 1319, 1568].forEach((f, i) => tone('square', f, f, 0.12, 0.08, i * 0.08)); },
    sink() { tone('sine', 220, 50, 2.5, 0.3); for (let i = 0; i < 6; i++) tone('sine', 500 + Math.random() * 600, 900, 0.1, 0.1, 0.3 + i * 0.25); },
    radio() { burst(2500, 0.25, 0.15, 'bandpass', radioBus); tone('square', 1200, 1200, 0.06, 0.05, 0.25, radioBus); },
    radioOpen() { burst(2200, 0.18, 0.18, 'bandpass', radioBus); },
    // marifoon-gebrabbel: lettergrepen met formanten door een radiofilter, als er geen spraak beschikbaar is
    babble(text, spk, done) {
      if (!ac || muted) { setTimeout(done, 900 + text.length * 50); return; }
      const t0 = ac.currentTime + 0.05, base = [105, 175, 130, 210][spk % 4], rate = [0.11, 0.095, 0.125, 0.09][spk % 4];
      const words = text.split(/\s+/).filter(Boolean); let t = t0;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.6;
      const sh = ac.createWaveShaper(); const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(x * 2.5); } sh.curve = c;
      const out = ac.createGain(); out.gain.value = 0.9; bp.connect(sh); sh.connect(out); out.connect(radioBus);
      const V = [[730, 1090], [530, 1840], [270, 2290], [570, 840], [300, 870], [660, 1720], [440, 1020]];
      for (const w of words) {
        const syl = Math.max(1, Math.round(w.replace(/[^a-zA-Zàáäëéèïöüú]/g, '').length / 3));
        for (let s = 0; s < syl; s++) {
          const d = rate * (0.8 + Math.random() * 0.6), f = base * (0.9 + Math.random() * 0.25) * (s === syl - 1 && /[?]/.test(w) ? 1.25 : 1);
          const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (0.92 + Math.random() * 0.12), t + d);
          const [f1, f2] = V[Math.floor(Math.random() * V.length)], g = ac.createGain();
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.015); g.gain.setValueAtTime(0.5, t + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
          for (const [ff, q] of [[f1, 6], [f2, 9]]) { const bf = ac.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = ff; bf.Q.value = q; o.connect(bf); bf.connect(g); }
          g.connect(bp); o.start(t); o.stop(t + d + 0.02); t += d + 0.012;
        }
        t += rate * (/[,.]/.test(w) ? 2.2 : 0.6);
      }
      const ms = (t - ac.currentTime) * 1000; setTimeout(() => { out.disconnect(); done(); }, ms + 100);
    },
    radioClose() { burst(3000, 0.12, 0.2, 'highpass', radioBus); tone('square', 1400, 1400, 0.05, 0.03, 0.1, radioBus); },
    toggle() { muted = !muted; try { localStorage.setItem('bunker_mute', muted ? '1' : '0'); } catch (e) {} applyVol(); return muted; },
    toggleMusic() { musicOn = !musicOn; try { localStorage.setItem('bunker_music', musicOn ? '1' : '0'); } catch (e) {} if (ac) { applyVol(); if (musicOn) startMusic(); else setTimeout(stopMusic, 400); } return musicOn; },
    get muted() { return muted; }, get musicOn() { return musicOn; },
    get vol() { return Object.assign({}, vol); },
    setVol(k, v) { vol[k] = Math.max(0, Math.min(100, Math.round(v))); try { localStorage.setItem('bunker_vol', JSON.stringify(vol)); } catch (e) {} applyVol(); },
    setMuted(m) { if (muted !== !!m) this.toggle(); }, setMusic(m) { if (musicOn !== !!m) this.toggleMusic(); },
    speechVol() { return muted ? 0 : Math.min(1, (vol.master / 100) * (vol.radio / 100) * 1.1); },
  };
})();
