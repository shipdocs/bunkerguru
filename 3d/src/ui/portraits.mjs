// Hand-drawn style portraits as inline SVG: the faces of the harbour. No downloads.
const face = ({ skin = '#f1c7a1', hat, hatCol = '#2c3e50', beard, hair = '#5a3b22', extra = '' }) =>
  `<svg viewBox="0 0 64 64" aria-hidden="true">
  <rect width="64" height="64" rx="10" fill="#1d3b47"/>
  <path d="M8 64c2-14 12-20 24-20s22 6 24 20z" fill="${hatCol}" opacity=".85"/>
  <ellipse cx="32" cy="32" rx="14" ry="16" fill="${skin}"/>
  <path d="M18 28c0-10 6-16 14-16s14 6 14 16c-3-5-8-8-14-8s-11 3-14 8z" fill="${hair}"/>
  ${beard ? `<path d="M19 34c2 12 7 16 13 16s11-4 13-16c-4 4-8 5-13 5s-9-1-13-5z" fill="${beard}"/>` : ''}
  <circle cx="26" cy="31" r="2" fill="#222"/><circle cx="38" cy="31" r="2" fill="#222"/>
  <path d="M27 40q5 3 10 0" stroke="#7a3b2a" stroke-width="2" fill="none" stroke-linecap="round"/>
  ${hat || ''}${extra}</svg>`;
const cap = (col) =>
  `<path d="M16 22c2-9 9-13 16-13s14 4 16 13z" fill="${col}"/><rect x="14" y="20" width="36" height="5" rx="2" fill="${col}"/><rect x="30" y="12" width="4" height="4" fill="#ffd84a"/>`;
export const PORTRAITS = {
  'Bunker Bert': face({ hat: cap('#c0392b'), hatCol: '#c0392b', beard: '#7a4a28' }),
  'Truus Tank': face({
    skin: '#e8b48c',
    hair: '#2b1b12',
    hatCol: '#8e44ad',
    hat: `<path d="M16 24c4-12 28-12 32 0z" fill="#8e44ad"/><circle cx="46" cy="24" r="3" fill="#8e44ad"/>`,
  }),
  VTS: face({
    hair: '#3a3a3a',
    hatCol: '#2980b9',
    extra: `<path d="M16 30a16 16 0 0 1 32 0" stroke="#111" stroke-width="3" fill="none"/><rect x="12" y="28" width="6" height="10" rx="2" fill="#111"/><rect x="46" y="28" width="6" height="10" rx="2" fill="#111"/><path d="M46 36q-4 8-12 8" stroke="#111" stroke-width="2" fill="none"/>`,
  }),
  Havenmeester: face({ hat: cap('#1a2e4a'), hatCol: '#1a2e4a', beard: '#cfcfcf', hair: '#cfcfcf' }),
  Machinist: face({
    hatCol: '#556b2f',
    hair: '#222',
    extra: `<path d="M20 44h24" stroke="#333" stroke-width="3"/><circle cx="44" cy="18" r="4" fill="#888"/>`,
  }),
  Sleepboot: face({ hat: cap('#e67e22'), hatCol: '#e67e22', beard: '#333' }),
  Bunkerguru: face({ hat: cap('#ba6539'), hatCol: '#ba6539' }),
};
export function portraitFor(who = '') {
  if (PORTRAITS[who]) return PORTRAITS[who];
  if (/sector|vts|post|radio|verkeer/i.test(who)) return PORTRAITS.VTS;
  return PORTRAITS.Havenmeester;
}
