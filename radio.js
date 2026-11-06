// ---------- marifoon: af en toe radioverkeer (Web Speech API + ruis via SND) ----------
const RADIO = (() => {
  let on = true, queue = [], busy = false, nextAt = 0, voices = [];
  try { on = localStorage.getItem('bunker_radio') !== '0'; } catch (e) {}
  const hasSpeech = 'speechSynthesis' in window;
  if (hasSpeech) { const lv = () => { voices = speechSynthesis.getVoices(); }; lv(); speechSynthesis.onvoiceschanged = lv; }
  const box = () => document.getElementById('radio');
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function voiceFor(lang, idx) {
    const want = lang === 'en' ? ['en-GB', 'en-US', 'en'] : ['nl-NL', 'nl-BE', 'nl'];
    for (const w of want) { const vs = voices.filter(v => v.lang && v.lang.replace('_', '-').startsWith(w)); if (vs.length) return vs[idx % vs.length]; }
    return null;
  }
  // één regel uitspreken; speaker = 0..3 bepaalt stemhoogte/stem
  function playLine(line, lang, done) {
    const b = box(); if (b) { b.innerHTML = `<b>📻 ${line.who}</b><br>${line.text}`; b.style.opacity = 1; }
    SND.radioOpen && SND.radioOpen();
    const finish = () => { SND.radioClose && SND.radioClose(); setTimeout(done, 700); };
    if (!hasSpeech || SND.muted) { setTimeout(finish, 1200 + line.text.length * 55); return; }
    try {
      const u = new SpeechSynthesisUtterance(line.text);
      u.lang = lang === 'en' ? 'en-GB' : 'nl-NL'; const v = voiceFor(lang, line.spk); if (v) u.voice = v;
      u.pitch = [0.8, 1.15, 0.95, 1.3][line.spk % 4]; u.rate = [1.05, 1.15, 0.95, 1.2][line.spk % 4]; u.volume = 0.8;
      let ended = false; const end = () => { if (!ended) { ended = true; finish(); } };
      u.onend = end; u.onerror = end; setTimeout(end, 2500 + line.text.length * 90); // vangnet
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
    toggle() { on = !on; try { localStorage.setItem('bunker_radio', on ? '1' : '0'); } catch (e) {} if (!on) { queue = []; if (hasSpeech) speechSynthesis.cancel(); const b = box(); if (b) b.style.opacity = 0; } return on; },
    say(lines, lang, force) { if (!on && !force) return; queue.push(...lines); pump(lang); },
    tick(now, makeChatter, lang) { if (!on) return; if (!nextAt) nextAt = now + 25 + Math.random() * 20; if (now >= nextAt && !busy && !queue.length) { nextAt = now + 75 + Math.random() * 90; const l = makeChatter(); if (l) this.say(l, lang); } },
    reset() { queue = []; nextAt = 0; if (hasSpeech) speechSynthesis.cancel(); const b = box(); if (b) b.style.opacity = 0; busy = false; },
  };
})();
