import { MAP, land, basins, terminals, waits, customers } from '../maps/index.mjs';
import { routePoints } from '../game/harbor.mjs';
import { target } from '../game/simulation.mjs';
// Harbour chart: land, route, traffic, rivals, gates, terminals (T), waiting places
// (P, W = yard) and seagoing ships. North up, cropped to the water.
const zs = basins.flatMap((b) => [b.z0, b.z1]).concat([-MAP.riverHalf, MAP.riverHalf]);
const Z0 = Math.max(MAP.zMin, Math.min(...zs) - 120),
  Z1 = Math.min(MAP.zMax, Math.max(...zs) + 120);
export function createChart(canvas) {
  const W = MAP.halfWidth;
  const map = canvas.getContext('2d');
  const scale = Math.min(192 / (W * 2), 94 / (Z1 - Z0)),
    ox = 100 - 0,
    oz = 50 - ((Z0 + Z1) / 2) * scale;
  const project = (x, z) => [ox + x * scale, oz + z * scale];
  // Strategy layer (fase 3): open jobs on their ships, where the rivals are heading.
  let hits = [];
  function chart(s, world) {
    hits = [];
    const big = !!canvas.closest?.('#chartPanel')?.classList?.contains?.('expanded');
    map.setTransform(3, 0, 0, 3, 0, 0);
    map.clearRect(0, 0, 200, 100);
    map.fillStyle = '#21434a';
    map.fillRect(0, 0, 200, 100);
    for (const l of land) {
      const [x, y] = project(l.x0, l.z0);
      map.fillStyle =
        l.kind === 'pillar'
          ? '#c8c8c8'
          : ['north', 'park', 'island', 'base'].includes(l.kind)
            ? '#657d65'
            : '#829084';
      map.fillRect(
        x,
        y,
        Math.max(0.5, (l.x1 - l.x0) * scale),
        Math.max(0.5, (l.z1 - l.z0) * scale),
      );
    }
    for (const g of world.gates) {
      const [x, y] = project(g.x0, g.z0);
      map.fillStyle = g.state === 'open' ? '#2ecc71' : g.state === 'prep' ? '#f1c40f' : '#e74c3c';
      map.fillRect(
        x - 0.5,
        y - 0.5,
        Math.max(1.2, (g.x1 - g.x0) * scale),
        Math.max(1.2, (g.z1 - g.z0) * scale),
      );
    }
    const t = target(s);
    if (t && !s.moored) {
      map.strokeStyle = '#c5e4b8';
      map.lineWidth = 0.6;
      map.setLineDash([2, 2]);
      map.beginPath();
      routePoints(s, t).forEach((p, i) => {
        const [x, y] = project(p.x, p.z);
        i ? map.lineTo(x, y) : map.moveTo(x, y);
      });
      map.stroke();
      map.setLineDash([]);
    }
    map.font = '3.6px sans-serif';
    map.textAlign = 'center';
    for (const b of basins) {
      const [x, y] = project((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
      map.save();
      map.translate(x, y);
      map.rotate(-Math.PI / 2);
      map.fillStyle = 'rgba(220,231,220,.75)';
      map.fillText(b.name, 0, 1);
      map.restore();
    }
    for (const b of customers) {
      const [x, y] = project(b.shipX, b.shipZ);
      map.fillStyle = b === t ? '#8ae5c2' : b.color;
      const L = b.length * scale,
        B = 2.2;
      if (b.h) map.fillRect(x - L / 2, y - B / 2, L, B);
      else map.fillRect(x - B / 2, y - L / 2, B, L);
    }
    // Where each rival is going: a dashed line in its colour.
    map.lineWidth = 0.5;
    map.setLineDash([1.5, 1.5]);
    for (const r of world.rivals) {
      const d = r.mode !== 'idle' && r.mode !== 'sunk' ? customers[r.target] : null;
      if (!d) continue;
      const [ax, ay] = project(r.x, r.z),
        [bx, by] = project(d.shipX, d.shipZ);
      map.strokeStyle = r.color;
      map.beginPath();
      map.moveTo(ax, ay);
      map.lineTo(bx, by);
      map.stroke();
    }
    map.setLineDash([]);
    // Open jobs, numbered like the planning (1–6), pay shown on the big chart.
    let n = 0;
    for (const o of s.offers || []) {
      if (o.taken) continue;
      n++;
      const b = customers[o.berth];
      if (!b) continue;
      const [x, y] = project(b.shipX, b.shipZ);
      const r = big ? 3.4 : 2.4;
      map.fillStyle = o.twist ? '#e8873a' : o.kind === 'spoed' ? '#ff6b5a' : '#f4d35e';
      map.beginPath();
      map.arc(x, y - r - 1.5, r, 0, 7);
      map.fill();
      map.fillStyle = '#10262c';
      map.font = 'bold ' + (big ? 4 : 3) + 'px sans-serif';
      map.fillText(String(n), x, y - r - 1.5 + (big ? 1.4 : 1.1));
      if (big) {
        map.font = '3px sans-serif';
        map.fillStyle = '#fff4d0';
        map.fillText(o.pay + '', x, y - 2 * r - 2.6);
      }
      hits.push({ x, y: y - r - 1.5, id: o.id, n });
    }
    map.textAlign = 'center';
    const tag = (p, txt, col) => {
      const [x, y] = project(p.x, p.z);
      map.fillStyle = col;
      map.fillRect(x - 2.2, y - 2.2, 4.4, 4.4);
      map.fillStyle = '#10262c';
      map.font = 'bold 3.6px sans-serif';
      map.fillText(txt, x, y + 1.3);
    };
    for (const tm of terminals) tag(tm, 'T', tm === t ? '#ffe46b' : '#d6c48a');
    for (const w of waits) tag(w, w.yard ? 'W' : 'P', w.yard ? '#ffd54a' : '#9fd0ff');
    for (const b of world.traffic) {
      const [x, y] = project(b.x, b.z);
      map.fillStyle = '#e9ab76';
      map.beginPath();
      map.arc(x, y, 1.2, 0, 7);
      map.fill();
    }
    for (const r of world.rivals) {
      if (r.mode === 'sunk') continue;
      const [x, y] = project(r.x, r.z);
      map.fillStyle = r.color;
      map.beginPath();
      map.arc(x, y, 1.6, 0, 7);
      map.fill();
    }
    for (const f of world.events.flotsam) {
      const [x, y] = project(f.x, f.z);
      map.fillStyle = '#ff7043';
      map.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
    }
    const [x, y] = project(s.x, s.z);
    map.save();
    map.translate(x, y);
    map.rotate(s.h);
    map.fillStyle = '#ffdd92';
    map.beginPath();
    map.moveTo(0, -3);
    map.lineTo(2, 3);
    map.lineTo(-2, 3);
    map.fill();
    map.restore();
    map.fillStyle = '#eee3c4';
    map.font = '4px sans-serif';
    map.textAlign = 'left';
    map.fillRect(6, 95, 500 * scale, 0.6);
    map.fillText('500 m', 6, 93);
  }
  // The job marker under a click (canvas CSS pixels), or null.
  chart.hit = (px, py) => {
    const rc = canvas.getBoundingClientRect?.();
    if (!rc || !rc.width) return null;
    const x = (px / rc.width) * 200,
      y = (py / rc.height) * 100;
    let best = null,
      bd = 6;
    for (const h of hits) {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d < bd) [best, bd] = [h, d];
    }
    return best;
  };
  return chart;
}
