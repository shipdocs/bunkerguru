// English, as an overlay on the Dutch game. The game builds its texts in Dutch, in
// pieces ('✅ Klaar! 🪙 +' + pay + ' vracht'…), exactly as the 2D game does. Instead of
// threading a language through some four hundred call sites, the texts are translated
// where they leave the game: every text node and tooltip on the page (watchDom), the
// VHF voice (tr on each line) and labels drawn on a canvas (tr in textSprite).
// PHRASES holds Dutch pieces and their English; the longest match wins, and a piece
// only matches as whole words, so 'los' never fires inside 'losgeslagen'.
import { PHRASES, RULES } from './en.mjs';
export const LANG_KEY = 'bunkerguru3d-lang';
export const LANGS = ['nl', 'en'];
let lang = 'nl';
try {
  const q = new URLSearchParams(globalThis.location?.search || '').get('lang'),
    saved = globalThis.localStorage?.getItem(LANG_KEY);
  lang = LANGS.includes(q) ? q : LANGS.includes(saved) ? saved : 'nl';
} catch {}
export const getLang = () => lang;
export function setLang(l) {
  if (!LANGS.includes(l)) return lang;
  lang = l;
  cache.clear();
  try {
    globalThis.localStorage?.setItem(LANG_KEY, l);
  } catch {}
  return lang;
}
const LETTER = 'A-Za-zÀ-ÿ';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let matcher = null,
  table = null;
// Map texts (berth positions, river names) bring their own translations: maps/*.js i18n.
export function addPhrases(pairs) {
  for (const [nl, en] of Object.entries(pairs || {})) extra.set(nl, en);
  matcher = null;
  cache.clear();
}
const extra = new Map();
function build() {
  table = new Map([...PHRASES, ...extra]);
  const keys = [...table.keys()].sort((a, b) => b.length - a.length);
  matcher = new RegExp(
    keys
      .map(
        (k) =>
          (new RegExp(`^[${LETTER}]`).test(k) ? `(?<![${LETTER}])` : '') +
          esc(k) +
          (new RegExp(`[${LETTER}]$`).test(k) ? `(?![${LETTER}])` : ''),
      )
      .join('|'),
    'g',
  );
}
const cache = new Map();
export function tr(text) {
  if (lang === 'nl' || typeof text !== 'string' || !text) return text;
  let out = cache.get(text);
  if (out !== undefined) return out;
  if (!matcher) build();
  // Text from the HTML file is wrapped and indented: one space reads the same.
  out = text.replace(/\s*\n\s*/g, ' ');
  for (const [re, to] of RULES) out = out.replace(re, to);
  out = out.replace(matcher, (m) => table.get(m));
  if (cache.size > 4000) cache.clear();
  cache.set(text, out);
  return out;
}
// Translate the page as it changes. Text the game writes again every tick is served
// from the cache; our own writes are recognised and left alone.
const ATTRS = ['title', 'aria-label', 'placeholder'];
export function watchDom(doc = globalThis.document) {
  if (lang === 'nl' || !doc?.body || !globalThis.MutationObserver || !doc.createTreeWalker) return;
  doc.documentElement.lang = lang;
  const done = new WeakMap();
  const text = (n) => {
    if (done.get(n) === n.data) return;
    const t = tr(n.data);
    done.set(n, t);
    if (t !== n.data) n.data = t;
  };
  const attrs = (el) => {
    for (const a of ATTRS) {
      const v = el.getAttribute?.(a);
      if (v) {
        const t = tr(v);
        if (t !== v) el.setAttribute(a, t);
      }
    }
  };
  const walk = (root) => {
    if (root.nodeType === 3) return text(root);
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE)$/.test(root.tagName)) return;
    attrs(root);
    const w = doc.createTreeWalker(root, 5); // elements and text
    for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeType === 3 ? text(n) : attrs(n);
  };
  walk(doc.body);
  if (doc.title) doc.title = tr(doc.title);
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') text(m.target);
      else if (m.type === 'attributes') attrs(m.target);
      else for (const n of m.addedNodes) walk(n);
    }
  }).observe(doc.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS,
  });
}
