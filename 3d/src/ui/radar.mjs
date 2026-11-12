import { SHAPE, land, bridges, customers, rectOutline, toWorld } from '../maps/index.mjs';
import { tr } from '../i18n/index.mjs';
// Sailing on radar in fog: a full-screen, heading-up radar picture instead of the 3D
// view. Quays and bridges echo, every vessel shows as a blip with its AIS name, a
// sweep turns at 24 rpm and the echoes glow on behind it and fade until it comes round
// again. Your own ship in the middle to scale, the heading line straight up, range
// rings and a true-bearing scale that turns as you turn. World coordinates, as the
// chart (ui/chart.mjs): x east, z south, heading h with the bow along (sin h, −cos h).
export const RANGES = [500, 1000, 2000, 4000]; // metres to the outer ring
const SWEEP = (Math.PI * 2) / 2.5; // one turn in 2.5 s

// Echo-giving lines, made once: the real waterline, or the land blocks of a classic map.
const coast = SHAPE
  ? SHAPE.rings.map((r) => r.map((p) => [p.x, p.z]))
  : land.filter((l) => l.kind !== 'pillar').map((l) => rectOutline(l).map((p) => [p.x, p.z]));
const decks = bridges.map((b) =>
  b.ax !== undefined
    ? [
        [b.ax, b.az],
        [b.bx, b.bz],
      ]
    : [toWorld(b.x, b.z0), toWorld(b.x, b.z1)].map((p) => [p.x, p.z]),
);

// Where a world point lands on the screen: heading up, own ship at (cx, cy).
export function radarProject(s, k, cx, cy, x, z) {
  const dx = x - s.x,
    dz = z - s.z,
    sn = Math.sin(s.h),
    cs = Math.cos(s.h);
  return [cx + (dx * cs + dz * sn) * k, cy - (dx * sn - dz * cs) * k];
}
// A heading as a compass reading: 0 = north, 090 = east.
export const bearing = (h) =>
  String(Math.round(((((h * 180) / Math.PI) % 360) + 360) % 360) % 360).padStart(3, '0');

export function createRadar(canvas, { insets = () => ({ top: 0, bottom: 0 }) } = {}) {
  const g = canvas.getContext?.('2d');
  const echo = typeof document !== 'undefined' ? document.createElement('canvas') : null,
    e = echo?.getContext('2d');
  let range = 1,
    sweep = 0,
    w = 0,
    h = 0,
    dpr = 1;
  function fit() {
    dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const cw = Math.round(canvas.clientWidth * dpr),
      ch = Math.round(canvas.clientHeight * dpr);
    if (cw === canvas.width && ch === canvas.height) return;
    canvas.width = echo.width = w = cw;
    canvas.height = echo.height = h = ch;
  }
  // Blip for a vessel: an echo stretched along her length, at least a few pixels.
  function blip(c, s, k, cx, cy, x, z, hh, length, beam) {
    const [px, py] = radarProject(s, k, cx, cy, x, z);
    c.save();
    c.translate(px, py);
    c.rotate(hh - s.h);
    const L = Math.max(5 * dpr, length * k),
      B = Math.max(3.5 * dpr, beam * k * 1.6);
    c.beginPath();
    c.ellipse(0, 0, B / 2, L / 2, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    return [px, py];
  }
  function draw(s, world, dt, radarOn = true) {
    if (!echo || !g) return;
    fit();
    sweep = (sweep + SWEEP * dt) % (Math.PI * 2);
    const ins = insets(),
      top = ins.top * dpr,
      bottom = h - ins.bottom * dpr,
      R = Math.max(60, Math.min(w / 2 - 14 * dpr, (bottom - top) / 2 - 10 * dpr)),
      cx = w / 2,
      cy = top + (bottom - top) / 2,
      span = RANGES[range],
      k = R / span;
    // The screen: dark, a faint glow towards the middle.
    const bg = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
    bg.addColorStop(0, '#08263a');
    bg.addColorStop(1, '#01070d');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.save();
    g.beginPath();
    g.arc(cx, cy, R, 0, Math.PI * 2);
    g.fillStyle = '#031621';
    g.fill();
    g.clip();
    if (radarOn) {
      // Echoes on their own layer, then the afterglow behind the sweep.
      e.setTransform(1, 0, 0, 1, 0, 0);
      e.clearRect(0, 0, w, h);
      e.lineJoin = e.lineCap = 'round';
      e.strokeStyle = '#ffd84a';
      e.lineWidth = Math.max(2.5 * dpr, 6 * k);
      e.shadowColor = '#ffb020';
      e.shadowBlur = 6 * dpr;
      const far = span * 1.5;
      e.beginPath();
      for (const line of [...coast, ...decks]) {
        let pen = false;
        for (let i = 0; i <= line.length; i++) {
          const p = line[i % line.length];
          if (i === line.length && line.length < 3) break; // a bridge deck is not a ring
          if (Math.abs(p[0] - s.x) > far || Math.abs(p[1] - s.z) > far) {
            pen = false;
            continue;
          }
          const [x, y] = radarProject(s, k, cx, cy, p[0], p[1]);
          pen ? e.lineTo(x, y) : e.moveTo(x, y);
          pen = true;
        }
      }
      e.stroke();
      e.fillStyle = '#fff1a8';
      const ais = [];
      const vessel = (x, z, hh, L, B, name) => {
        if (Math.hypot(x - s.x, z - s.z) > far) return;
        ais.push([blip(e, s, k, cx, cy, x, z, hh, L, B), name]);
      };
      for (const b of world.traffic)
        vessel(b.wx ?? b.x, b.wz ?? b.z, b.wh ?? b.h, b.length, b.beam, b.name);
      for (const r of world.rivals)
        if (r.mode !== 'sunk') vessel(r.wx ?? r.x, r.wz ?? r.z, r.wh ?? r.h, 110, 11, r.name);
      for (const b of customers) vessel(b.shipX, b.shipZ, b.h, b.length, b.beam, b.name);
      e.shadowBlur = 0;
      if (e.createConicGradient) {
        const glow = e.createConicGradient(sweep - Math.PI / 2, cx, cy);
        glow.addColorStop(0, 'rgba(0,0,0,.22)');
        glow.addColorStop(0.75, 'rgba(0,0,0,.5)');
        glow.addColorStop(1, 'rgba(0,0,0,1)');
        e.globalCompositeOperation = 'destination-in';
        e.fillStyle = glow;
        e.fillRect(0, 0, w, h);
        e.globalCompositeOperation = 'source-over';
      }
      g.drawImage(echo, 0, 0);
      // AIS names next to the blips: small and quiet, the echoes come first.
      g.font = `${11 * dpr}px system-ui, sans-serif`;
      g.fillStyle = 'rgba(159,230,255,.75)';
      g.textAlign = 'left';
      for (const [[x, y], name] of ais) g.fillText(name, x + 7 * dpr, y - 5 * dpr);
      // The sweep: a bright line with a soft fan behind it.
      const ang = sweep - Math.PI / 2;
      if (g.createConicGradient) {
        const fan = g.createConicGradient(ang - 0.5, cx, cy);
        fan.addColorStop(0, 'rgba(120,230,255,0)');
        fan.addColorStop(0.0795, 'rgba(120,230,255,.16)');
        fan.addColorStop(0.08, 'rgba(120,230,255,0)');
        g.fillStyle = fan;
        g.fillRect(cx - R, cy - R, R * 2, R * 2);
      }
      g.strokeStyle = 'rgba(170,240,255,.8)';
      g.lineWidth = 1.5 * dpr;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R);
      g.stroke();
    }
    // Range rings.
    g.strokeStyle = 'rgba(120,220,255,.28)';
    g.lineWidth = 1 * dpr;
    for (let i = 1; i <= 4; i++) {
      g.beginPath();
      g.arc(cx, cy, (R * i) / 4, 0, Math.PI * 2);
      g.stroke();
    }
    // Heading line: from the ship straight up to the edge.
    g.strokeStyle = 'rgba(255,255,255,.85)';
    g.lineWidth = 1.5 * dpr;
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx, cy - R);
    g.stroke();
    // Own ship to scale (at least visible), a vector of where she goes in a minute.
    const L = Math.max(14 * dpr, 110 * k),
      B = Math.max(5 * dpr, 11.4 * k);
    g.fillStyle = 'rgba(255,255,255,.18)';
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1.5 * dpr;
    g.beginPath();
    g.moveTo(cx, cy - L / 2);
    g.lineTo(cx + B / 2, cy - L / 2 + B * 0.9);
    g.lineTo(cx + B / 2, cy + L / 2);
    g.lineTo(cx - B / 2, cy + L / 2);
    g.lineTo(cx - B / 2, cy - L / 2 + B * 0.9);
    g.closePath();
    g.fill();
    g.stroke();
    if (s.gx !== undefined || s.u !== undefined) {
      const sn = Math.sin(s.h),
        cs = Math.cos(s.h),
        vx = s.gx ?? sn * (s.u || 0) + cs * (s.v || 0),
        vz = s.gz ?? -cs * (s.u || 0) + sn * (s.v || 0);
      const [px, py] = radarProject(s, k, cx, cy, s.x + vx * 60, s.z + vz * 60);
      g.setLineDash([5 * dpr, 4 * dpr]);
      g.strokeStyle = '#7fffd4';
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(px, py);
      g.stroke();
      g.setLineDash([]);
    }
    g.restore();
    // Bearing scale round the edge: true bearings, turning as the ship turns.
    g.strokeStyle = 'rgba(159,230,255,.7)';
    g.fillStyle = 'rgba(159,230,255,.85)';
    g.font = `${10 * dpr}px system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.beginPath();
    g.arc(cx, cy, R, 0, Math.PI * 2);
    g.stroke();
    for (let d = 0; d < 360; d += 5) {
      const a = (d * Math.PI) / 180 - s.h - Math.PI / 2,
        ca = Math.cos(a),
        sa = Math.sin(a),
        len = (d % 30 ? (d % 10 ? 4 : 7) : 10) * dpr;
      g.beginPath();
      g.moveTo(cx + ca * R, cy + sa * R);
      g.lineTo(cx + ca * (R - len), cy + sa * (R - len));
      g.stroke();
      if (d % 30 === 0 && R > 120 * dpr)
        g.fillText(String(d).padStart(3, '0'), cx + ca * (R - 20 * dpr), cy + sa * (R - 20 * dpr));
    }
    // Readouts inside the screen, clear of the panels: the heading big under the top
    // of the heading line, mode and range along the bottom.
    g.textBaseline = 'alphabetic';
    g.textAlign = 'center';
    g.fillStyle = '#ffffff';
    g.font = `600 ${20 * dpr}px system-ui, sans-serif`;
    g.fillText(bearing(s.h) + '°', cx, cy - R + 46 * dpr);
    g.font = `${10 * dpr}px system-ui, sans-serif`;
    g.fillStyle = '#9fe6ff';
    g.fillText(tr('KOERS'), cx, cy - R + 60 * dpr);
    const km = (m) => (m >= 1000 ? (m / 1000).toLocaleString() + ' km' : m + ' m');
    g.font = `600 ${12 * dpr}px system-ui, sans-serif`;
    g.fillText('HEAD UP', cx, cy + R - 50 * dpr);
    g.font = `${11 * dpr}px system-ui, sans-serif`;
    g.fillText(
      `${tr('BEREIK')} ${km(span)} · ${tr('RINGEN')} ${km(span / 4)}`,
      cx,
      cy + R - 34 * dpr,
    );
    if (!radarOn) {
      g.fillStyle = '#ffd84a';
      g.font = `600 ${16 * dpr}px system-ui, sans-serif`;
      g.fillText(tr('RADAR STAAT UIT'), cx, cy - 30 * dpr);
    }
  }
  return {
    draw,
    get range() {
      return RANGES[range];
    },
    zoom(step) {
      range = Math.max(0, Math.min(RANGES.length - 1, range + step));
      return RANGES[range];
    },
  };
}
