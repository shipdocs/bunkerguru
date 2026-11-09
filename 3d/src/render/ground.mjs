import * as T from '../../vendor/three.js';
// Painted ground per district: one canvas, repeated every GROUND_TILE metres.
// No downloads; without a 2D canvas (tests) the plain district colour remains.
export const GROUND_TILE = 240;
const GREEN = ['north', 'park', 'island', 'base'];
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [16, 8, 0].map((sh) => Math.max(0, Math.min(255, Math.round(((n >> sh) & 255) * f))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
export function groundTexture(kind, col, N = 512) {
  const cv = document.createElement('canvas');
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
      const squash = 0.6 + rnd() * 0.5,
        turn = rnd() * 3;
      for (const dx of [-N, 0, N])
        for (const dy of [-N, 0, N]) {
          c.beginPath();
          c.ellipse?.(x + dx, y + dy, r, r * squash, turn, 0, 7);
          c.fill();
        }
    };
    // Straight line in metres, right across the tile.
    const line = (horizontal, at, width, style, dash) => {
      c.strokeStyle = style;
      c.lineWidth = width * m;
      c.setLineDash?.(dash ? dash.map((d) => d * m) : []);
      c.beginPath();
      if (horizontal) (c.moveTo(0, at * m), c.lineTo(N, at * m));
      else (c.moveTo(at * m, 0), c.lineTo(at * m, N));
      c.stroke();
      c.setLineDash?.([]);
    };
    const speckle = (count, lo, hi, size) => {
      for (let i = 0; i < count; i++) {
        c.fillStyle = shade(col, lo + rnd() * (hi - lo));
        c.fillRect(rnd() * N, rnd() * N, size, size * (1 + rnd()));
      }
    };
    if (GREEN.includes(kind) || kind === 'town' || kind === 'town2') {
      for (let i = 0; i < 90; i++)
        blob(rnd() * N, rnd() * N, (5 + rnd() * 16) * m, shade(col, 0.88 + rnd() * 0.24));
      speckle(N * 3, 0.78, 0.92, 2);
      speckle(N * 2, 1.08, 1.2, 2);
      // buttercups and daisies
      for (let i = 0; i < N / 3; i++) {
        c.fillStyle = rnd() > 0.5 ? '#f3e79a' : '#f4f2e4';
        c.fillRect(rnd() * N, rnd() * N, 2, 2);
      }
      if (kind === 'park' || kind === 'island') {
        // gravel paths wandering through the grass
        c.strokeStyle = '#dccfae';
        c.lineWidth = 3.2 * m;
        for (const y of [60, 180])
          for (const dx of [-N, 0, N]) {
            c.beginPath();
            c.moveTo(dx, y * m);
            c.bezierCurveTo?.(
              dx + N * 0.3,
              (y - 45) * m,
              dx + N * 0.7,
              (y + 45) * m,
              dx + N,
              y * m,
            );
            c.stroke();
          }
      }
      if (kind === 'town' || kind === 'town2') {
        // village lanes with a kerb, and hedged gardens behind the houses
        for (const p of [60, 180])
          for (const horizontal of [true, false]) {
            line(horizontal, p, 7.5, '#bdb39c');
            line(horizontal, p, 6, '#d9d0b8');
          }
        for (let i = 0; i < 26; i++) {
          // garden plots: a darker lawn or a vegetable bed
          c.fillStyle = rnd() > 0.3 ? shade(col, 0.86 + rnd() * 0.08) : '#b9a878';
          c.fillRect(rnd() * N, rnd() * N, (8 + rnd() * 10) * m, (8 + rnd() * 10) * m);
        }
      }
    } else if (kind === 'city') {
      // warm clinker paving in bays, kerb lines, planters and a red cycle path
      const step = N / 8;
      for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++) {
          c.fillStyle = shade(col, 0.92 + rnd() * 0.14);
          c.fillRect(i * step, j * step, step, step);
        }
      speckle(N * 5, 0.86, 1.1, 2);
      c.strokeStyle = shade(col, 0.82);
      c.lineWidth = Math.max(1, 0.5 * m);
      for (let i = 0; i <= 8; i++) {
        c.beginPath();
        c.moveTo(i * step, 0);
        c.lineTo(i * step, N);
        c.moveTo(0, i * step);
        c.lineTo(N, i * step);
        c.stroke();
      }
      line(true, 120, 3, '#c98a6c');
      line(true, 120, 0.25, '#f1e6cf', [3, 3]);
      line(false, 30, 6.5, '#8c9395');
      line(false, 30, 0.3, '#eee6cc', [4, 6]);
      for (let i = 0; i < 9; i++) {
        const x = (Math.floor(rnd() * 8) + 0.3) * step,
          y = (Math.floor(rnd() * 8) + 0.3) * step;
        c.fillStyle = '#8fb86a';
        c.fillRect(x, y, step * 0.4, step * 0.4);
        c.fillStyle = '#6f9f58';
        c.fillRect(x + step * 0.1, y + step * 0.1, step * 0.2, step * 0.2);
      }
    } else {
      // port, tanks, containers: concrete slabs, stains, lane marks, rails, parking
      const step = N / 8;
      for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++) {
          c.fillStyle = shade(col, 0.92 + rnd() * 0.13);
          c.fillRect(i * step + 1, j * step + 1, step - 1, step - 1);
        }
      speckle(N * 4, 0.84, 1.08, 2);
      for (let i = 0; i < 40; i++)
        blob(rnd() * N, rnd() * N, (2 + rnd() * 5) * m, shade(col, 0.88 + rnd() * 0.08));
      if (kind === 'tanks') {
        // bund walls round the tank pits, pipe tracks, tufts of grass
        for (let i = 0; i < 14; i++) blob(rnd() * N, rnd() * N, (3 + rnd() * 6) * m, '#b3bd92');
        c.strokeStyle = shade(col, 0.7);
        c.lineWidth = 1.6 * m;
        c.strokeRect(N * 0.05, N * 0.05, N * 0.4, N * 0.4);
        c.strokeRect(N * 0.55, N * 0.55, N * 0.4, N * 0.4);
        c.strokeRect(N * 0.55, N * 0.08, N * 0.38, N * 0.34);
        c.strokeRect(N * 0.07, N * 0.56, N * 0.36, N * 0.38);
        line(true, 120, 5, shade(col, 0.82));
        for (const o of [-1.4, 0, 1.4]) line(true, 120 + o, 0.5, o ? '#d8d2bd' : '#d9a74a');
        line(false, 120, 4.5, '#8c9395');
      } else {
        // a service road, lane arrows, rails set in the paving, parking bays
        line(false, 40, 8, '#7d868a');
        line(false, 40, 0.3, '#f0e7cc', [5, 7]);
        line(true, 200, 0.5, '#e0b84a', [6, 4]);
        line(true, 80, 0.5, '#e0b84a', [6, 4]);
        for (const r of [140, 146]) {
          line(true, r, 2.4, shade(col, 0.78));
          line(true, r, 2.2, '#5d5a55', [0.4, 1.2]);
          for (const o of [-0.75, 0.75]) line(true, r + o, 0.22, '#3d3f44');
        }
        c.fillStyle = shade(col, 0.86);
        c.fillRect(150 * m, 20 * m, 62 * m, 34 * m);
        c.strokeStyle = '#f2ecd8';
        c.lineWidth = Math.max(1, 0.3 * m);
        for (let x = 150; x <= 212; x += 3.1) {
          c.beginPath();
          c.moveTo(x * m, 20 * m);
          c.lineTo(x * m, 26 * m);
          c.moveTo(x * m, 48 * m);
          c.lineTo(x * m, 54 * m);
          c.stroke();
        }
        if (kind === 'containers') {
          // stacking lanes marked out in yellow
          c.strokeStyle = '#e0b84a';
          c.lineWidth = Math.max(1, 0.35 * m);
          for (let y = 96; y < 130; y += 7) c.strokeRect(60 * m, y * m, 80 * m, 6.2 * m);
        }
      }
    }
  }
  return new T.CanvasTexture(cv);
}
