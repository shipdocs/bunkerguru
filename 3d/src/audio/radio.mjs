// VHF radio from the 2D game (radio.js): browser speech, or radio babble when no voice
// is available. Lines: {who, spk, text}. Needs the sound engine for squelch and babble.
export function createRadio(SND, box = () => document.getElementById('radio'), face = () => '') {

  let on = true, queue = [], busy = false, nextAt = 0, voices = [], mode = 'auto', speechBroken = false, lastErr = '', lastHow = '';
  try { mode = localStorage.getItem('bunker_radiomode') || 'auto'; } catch (e) {}
  try { on = localStorage.getItem('bunker_radio') !== '0'; } catch (e) {}
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
  if (hasSpeech) { const lv = () => { voices = speechSynthesis.getVoices(); }; lv(); speechSynthesis.onvoiceschanged = lv; }
  
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function voiceFor(lang, idx) {
    const want = lang === 'en' ? ['en-GB', 'en-US', 'en'] : ['nl-NL', 'nl-BE', 'nl'];
    for (const w of want) { const vs = voices.filter(v => v.lang && v.lang.replace('_', '-').startsWith(w)); if (vs.length) return vs[idx % vs.length]; }
    return null;
  }
  // één regel uitspreken; speaker = 0..3 bepaalt stemhoogte/stem
  function playLine(line, lang, done) {
    const b = box(); if (b) { b.innerHTML = `<span class="radioFace">${face(line.who)}</span><span><b>📻 ${line.who}</b><br>${line.text}</span>`; b.style.opacity = 1; }
    SND.radioOpen && SND.radioOpen();
    const finish = () => { SND.radioClose && SND.radioClose(); setTimeout(done, 700); };
    if (SND.muted || (SND.speechVol && SND.speechVol() <= 0.01)) { setTimeout(finish, 1200 + line.text.length * 55); return; }
    const doBabble = () => { lastHow = 'gebrabbel'; SND.babble(line.text, line.spk, finish); };
    if (mode === 'babble' || !hasSpeech || (mode === 'auto' && speechBroken)) { doBabble(); return; }
    try {
      const u = new SpeechSynthesisUtterance(line.text);
      u.lang = lang === 'en' ? 'en-GB' : 'nl-NL'; const v = voiceFor(lang, line.spk); if (v) u.voice = v;
      u.pitch = [0.8, 1.15, 0.95, 1.3][line.spk % 4]; u.rate = [1.05, 1.15, 0.95, 1.2][line.spk % 4]; u.volume = SND.speechVol ? SND.speechVol() : 0.8;
      let ended = false, started = false; const end = () => { if (!ended) { ended = true; finish(); } };
      u.onstart = () => { started = true; lastHow = 'spraak' + (u.voice ? ' (' + u.voice.name + ')' : ''); lastErr = ''; };
      u.onend = end;
      u.onerror = ev => { lastErr = (ev && ev.error) || 'onbekend'; if (!started && !ended) { ended = true; if (mode === 'auto') speechBroken = true; doBabble(); } else end(); };
      // spraak die niet binnen 1,5 s start: browser laat hem vallen → gebrabbel
      setTimeout(() => { if (!started && !ended) { ended = true; lastErr = lastErr || 'geen start binnen 1,5 s'; try { speechSynthesis.cancel(); } catch (e) {} if (mode === 'auto') speechBroken = true; doBabble(); } }, 1500);
      setTimeout(() => { if (started) end(); }, 3000 + line.text.length * 110); // vangnet
      if (speechSynthesis.paused) speechSynthesis.resume();
      speechSynthesis.speak(u);
    } catch (e) { setTimeout(finish, 1500); }
  }
  function pump(lang) {
    if (busy || !queue.length) { if (!busy && !queue.length) { const b = box(); if (b) b.style.opacity = 0; } return; }
    busy = true; const line = queue.shift();
    playLine(line, lang, () => { busy = false; pump(lang); });
  }
  return {
    get on() { return on; },
    get mode() { return mode; },
    setMode(m) { mode = m; speechBroken = false; try { localStorage.setItem('bunker_radiomode', m); } catch (e) {} },
    status(lang) { const nl = voices.filter(v => (v.lang || '').toLowerCase().startsWith('nl')).length, en = voices.filter(v => (v.lang || '').toLowerCase().startsWith('en')).length;
      return { speech: hasSpeech, voices: voices.length, nl, en, broken: speechBroken, lastErr, lastHow }; },
    test(lang) { const l = lang === 'en' ? { who: 'Test', spk: 1, text: 'Bunkerguru, this is a radio check, how do you read me, over.' } : { who: 'Test', spk: 1, text: 'Bunkerguru, dit is een radiocheck, hoe ontvangt u mij, over.' }; queue = []; busy = false; this.say([l], lang, true); },
    set(v) { if (on !== !!v) this.toggle(); },
    toggle() { on = !on; try { localStorage.setItem('bunker_radio', on ? '1' : '0'); } catch (e) {} if (!on) { queue = []; if (hasSpeech) speechSynthesis.cancel(); const b = box(); if (b) b.style.opacity = 0; } return on; },
    say(lines, lang, force) { if (!on && !force) return; queue.push(...lines); pump(lang); },
    tick(now, makeChatter, lang) { if (!on) return; if (!nextAt) nextAt = now + 25 + Math.random() * 20; if (now >= nextAt && !busy && !queue.length) { nextAt = now + 75 + Math.random() * 90; const l = makeChatter(); if (l) this.say(l, lang); } },
    reset() { queue = []; nextAt = 0; if (hasSpeech) speechSynthesis.cancel(); const b = box(); if (b) b.style.opacity = 0; busy = false; },
  };
}
