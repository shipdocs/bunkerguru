// Touch screens have no keys: hints that name a key are rewritten to name the button
// on the screen. Dutch in, Dutch out; the English overlay translates afterwards.
const SWAPS = [
  ['Open de planning (N) en kies een klus.', 'Tik op Planning en kies een klus.'],
  ['Oefenklus / havenkantoor (N) →', 'Oefenklus / havenkantoor →'],
  ['Planning openen (N) →', 'Planning openen →'],
  ['Trossen zitten vast – eerst M = los', 'Trossen zitten vast – tik eerst ⚓ Trossen los'],
  ['(of M = vast)', '(of tik ⚓ Vastmaken)'],
  ['M = trossen vast', 'Tik nu ⚓ Vastmaken'],
  ['en maak vast met M.', 'en tik ⚓ Vastmaken.'],
  ['en vastmaken (M)', 'en ⚓ Vastmaken'],
  [' · M = los', ' · ⚓ = los'],
  [' · B = winkel', ' · winkel: ☰'],
  ['dicht · C = oproepen', 'dicht · oproepen: ☰ Brug/sluis'],
  [
    'Stuurhuis · Z/X brugvleugels · slepen = rondkijken · scrollen = verrekijker',
    'Stuurhuis · slepen = rondkijken · 🔭 = verrekijker',
  ],
  ['Kies met 1–6 of tik.', 'Tik op een klus om hem aan te nemen.'],
  [
    '⏸ GEPAUZEERD · TIK OP EEN KLUS · KLIK ERNAAST OM VERDER TE VAREN',
    '⏸ GEPAUZEERD · TIK OP EEN KLUS · TIK ERNAAST OM VERDER TE VAREN',
  ],
];
export function touchText(text) {
  if (typeof text !== 'string') return text;
  for (const [from, to] of SWAPS) if (text.includes(from)) text = text.replace(from, to);
  return text;
}
export const TOUCH_SWAPS = SWAPS;
// A phone or tablet: the finger is the main pointer.
export function isTouch() {
  try {
    return !!globalThis.matchMedia?.('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}
// Hints as this screen needs them: untouched with a keyboard, rewritten on touch.
export const hintFor = (touch) => (touch ? touchText : (text) => text);
