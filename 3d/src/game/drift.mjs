// Drift and current as the 2D game shows them (engine.js driftInfo, drawDriftLines,
// drawCurrentArrow): heading against course over the ground, and the stream at the bow.
// Pure numbers; navigation-effects.mjs draws them on the water.
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
// null while (nearly) stopped or going astern. deg > 0: set to starboard.
export function driftInfo(s) {
  const sn = Math.sin(s.h),
    cs = Math.cos(s.h),
    gx = sn * s.u + cs * s.v,
    gz = -cs * s.u + sn * s.v,
    sp = Math.hypot(gx, gz);
  if (sp < 0.4) return null;
  const cog = Math.atan2(gx, -gz),
    d = wrap(cog - s.h);
  if (Math.abs(d) > 2.6) return null;
  return { cog, deg: (d * 180) / Math.PI, sp };
}
// Lines only from 3° of drift; longer with speed, stronger with the angle.
export function driftLines(s) {
  const di = driftInfo(s);
  if (!di || Math.abs(di.deg) < 3) return null;
  return {
    ...di,
    length: 40 + di.sp * 12.5,
    alpha: Math.min(0.75, 0.25 + Math.abs(di.deg) / 30),
  };
}
// One arrow ahead of the bow: direction and strength of the water right here.
export function currentArrow(c) {
  const sp = Math.hypot(c.x, c.z);
  if (sp < 0.08) return null;
  return {
    sp,
    dx: c.x / sp,
    dz: c.z / sp,
    length: 16 + sp * 18,
    text: sp.toFixed(1).replace('.', ',') + ' m/s',
  };
}
