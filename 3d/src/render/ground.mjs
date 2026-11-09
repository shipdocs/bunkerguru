import * as T from '../../vendor/three.js';
// Painted ground per district: one small canvas, repeated every GROUND_TILE metres.
// No downloads; without a 2D canvas (tests) the plain district colour remains.
export const GROUND_TILE = 240;
const GREEN = ['north', 'park', 'island', 'base'];
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [16, 8, 0].map((sh) => Math.max(0, Math.min(255, Math.round(((n >> sh) & 255) * f))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
export function groundTexture(kind, col) {
  const N = 512,
    cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const c = cv.getContext('2d');
  let seed = 77 + kind.length * 131;
  const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  const m = N / GROUND_TILE; // pixels per metre
  if (c) {
    c.fillStyle = col;
    c.fillRect(0, 0, N, N);
    // A soft blob that wraps round the tile edge, so the repeat does not show.
    const blob = (x, y, r, style) => {
      c.fillStyle = style;
      for (const dx of [-N, 0, N])
        for (const dy of [-N, 0, N]) {
          c.beginPath();
          c.ellipse?.(x + dx, y + dy, r, r * (0.6 + rnd() * 0.5), rnd() * 3, 0, 7);
          c.fill();
        }
    };
    if (GREEN.includes(kind) || kind === 'town' || kind === 'town2') {
      for (let i = 0; i < 70; i++)
        blob(rnd() * N, rnd() * N, 10 + rnd() * 34, shade(col, 0.9 + rnd() * 0.22));
      // tufts and flowers
      for (let i = 0; i < 500; i++) {
        c.fillStyle = shade(col, rnd() > 0.5 ? 0.82 : 1.14);
        c.fillRect(rnd() * N, rnd() * N, 2, 3);
      }
      if (kind === 'town' || kind === 'town2') {
        // village lanes
        c.strokeStyle = '#d8d0bb';
        c.lineWidth = 6 * m;
        for (const p of [0.25, 0.75]) {
          c.beginPath();
          c.moveTo(0, p * N);
          c.lineTo(N, p * N);
          c.moveTo(p * N, 0);
          c.lineTo(p * N, N);
          c.stroke();
        }
      }
    } else if (kind === 'city') {
      // paving in blocks, lighter squares and a few planted corners
      const step = N / 8;
      for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++) {
          c.fillStyle = shade(col, 0.93 + rnd() * 0.12);
          c.fillRect(i * step + 2, j * step + 2, step - 4, step - 4);
          if (rnd() > 0.82) {
            c.fillStyle = '#9fc07c';
            c.fillRect(i * step + 8, j * step + 8, step * 0.45, step * 0.45);
          }
        }
      c.strokeStyle = shade(col, 0.8);
      c.lineWidth = 3;
      for (let i = 0; i <= 8; i++) {
        c.beginPath();
        c.moveTo(i * step, 0);
        c.lineTo(i * step, N);
        c.moveTo(0, i * step);
        c.lineTo(N, i * step);
        c.stroke();
      }
    } else {
      // port, tanks, containers: concrete slabs, stains, yellow lane marks
      const step = N / 6;
      for (let i = 0; i < 6; i++)
        for (let j = 0; j < 6; j++) {
          c.fillStyle = shade(col, 0.94 + rnd() * 0.1);
          c.fillRect(i * step + 1, j * step + 1, step - 2, step - 2);
        }
      for (let i = 0; i < 26; i++)
        blob(rnd() * N, rnd() * N, 6 + rnd() * 22, shade(col, 0.84 + rnd() * 0.1));
      c.strokeStyle = kind === 'tanks' ? '#b9a66a' : '#e0b84a';
      c.lineWidth = 2.5;
      c.setLineDash?.([14, 10]);
      for (const p of [1 / 6, 4 / 6]) {
        c.beginPath();
        c.moveTo(0, p * N + 6);
        c.lineTo(N, p * N + 6);
        c.stroke();
      }
      c.setLineDash?.([]);
      if (kind === 'tanks') {
        // bund walls round the tank pits
        c.strokeStyle = shade(col, 0.76);
        c.lineWidth = 4;
        c.strokeRect(N * 0.06, N * 0.06, N * 0.4, N * 0.4);
        c.strokeRect(N * 0.56, N * 0.56, N * 0.38, N * 0.38);
      }
    }
  }
  return new T.CanvasTexture(cv);
}
