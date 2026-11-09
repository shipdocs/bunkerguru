// English overlay: Dutch pieces in, English out; Dutch mode touches nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { tr, setLang, getLang, addPhrases } = await import('../src/i18n/index.mjs');
const { PHRASES } = await import('../src/i18n/en.mjs');

test('Dutch is the default and passes every text through unchanged', () => {
  assert.equal(getLang(), 'nl');
  assert.equal(tr('✅ Klaar! 🪙 +480 vracht'), '✅ Klaar! 🪙 +480 vracht');
});

test('pieces glued together by the game come out as one English line', () => {
  setLang('en');
  assert.equal(
    tr('✅ Klaar! 🪙 +480 vracht +120 op tijd +150 schadevrij = 750 🪙 · 1450 punten'),
    '✅ Done! 🪙 +480 freight +120 on time +150 damage-free = 750 🪙 · 1450 points',
  );
  assert.equal(
    tr('Koers 244° · roer 60° · schade 0 · moe 1%'),
    'Heading 244° · rudder 60° · damage 0 · tired 1%',
  );
  assert.equal(tr('Matroos · 0 klussen · dagdoel 0/3'), 'Deckhand · 0 jobs · daily goal 0/3');
  assert.equal(tr('ZEER LANGZ.'), 'DEAD SLOW');
  assert.equal(tr('VOL VOOR'), 'FULL AHEAD');
});

test('whole words only, wind points only after "wind" or a weather icon', () => {
  setLang('en');
  assert.equal(
    tr('⚠️ Losgeslagen! Slangen eraf. Opnieuw langszij (of M = vast).').includes('Cast'),
    false,
  );
  assert.equal(tr('🕐 6:04 · EB 0,8 m/s ▲ · ☀ ZW 2 Bft'), '🕐 6:04 · EBB 0,8 m/s ▲ · ☀ SW 2 Bft');
  assert.equal(tr('Weerbericht: wind O 7, buien.'), 'Weather report: wind E 7, squalls.');
  assert.equal(tr('Z/X'), 'Z/X', 'the keys Z and O are not wind directions');
  assert.equal(tr('MV RIJNHAVEN'), 'MV RIJNHAVEN', 'ship names stay');
  assert.equal(tr('35 graden bakboord'), '35 degrees port');
  assert.equal(tr('Haven'), 'Harbour', 'the tab');
  assert.equal(tr('Haven Maassluis'), 'Haven Maassluis', 'the name');
});

test('text wrapped in the HTML file matches its phrase; map phrases join in', () => {
  setLang('en');
  assert.equal(tr('\n        Pech op het\n        water?\n      '), ' Stuck on the water? ');
  addPhrases({ 'oostwand Rijnhaven': 'east wall of the Rijnhaven' });
  assert.equal(
    tr('Vol. Naar MV RIJNHAVEN, oostwand Rijnhaven. Let op stroming en verkeer!'),
    'Full. On to MV RIJNHAVEN, east wall of the Rijnhaven. Mind the current and the traffic!',
  );
});

test('the table is sound: no empty or duplicate Dutch piece, English never empty', () => {
  const seen = new Set();
  for (const [nl, en] of PHRASES) {
    assert(nl && en, 'empty entry near ' + nl);
    assert(!seen.has(nl), 'duplicate: ' + nl);
    seen.add(nl);
  }
});

test('every fixed text in index.html changes in English', async () => {
  setLang('en');
  const html = (await readFile(new URL('../index.html', import.meta.url), 'utf8')).replace(
    /<script[\s\S]*?<\/script>/g,
    '',
  );
  // Names, numbers and symbols need no translation.
  const same =
    /^(BUNKERGURU|Bunkerguru 3D|AMSTERDAM WESTPOORT|STOP|Tanks|Fenders|Camera|English|· shipdocs\/bunkerguru|[^A-Za-z]*)$/;
  const left = [];
  for (const m of html.matchAll(/>([^<>]+)</g)) {
    const t = m[1]
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (/[A-Za-z]{3}/.test(t) && !same.test(t) && tr(t) === t) left.push(t);
  }
  assert.deepEqual(left, []);
  setLang('nl');
});
