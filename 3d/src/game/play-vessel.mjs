import { timeScaleOf } from './time-scale.mjs';
import { profileOf } from './ship-profile.mjs';
import { clamp } from './math.mjs';
const approach = (x, target, amount) => x + clamp(target - x, -amount, amount);
export function stopShip(s) {
  s.teleIdx = 3;
  s.braking = true;
}

// Deliberately assisted game handling. Size and load still matter a little, but
// a short input must produce a useful manoeuvre on the existing 110 m ship.
export function playStep(s, dt, keys = {}, contact, onClutch = () => {}, tele = 0) {
  const p = profileOf(s),
    load = clamp(s.cargo / p.tankCapacity, 0, 1);
  const agility = Math.pow(110 / p.length, 0.18) / (1 + 0.2 * load),
    power = Math.sqrt(p.motor / 6.2);
  const scale = timeScaleOf(s),
    total = clamp(dt, 0, 0.05) * scale;
  const count = Math.max(1, Math.ceil(total / (1 / 60))),
    h = total / count;
  const helmDirection = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  for (let i = 0; i < count; i++) {
    const stopping = !!s.braking;
    // Arrow/button holds adjust the set angle; releasing input keeps that angle.
    s.rudderCmd = Number.isFinite(keys.helm)
      ? clamp(keys.helm, -1, 1)
      : clamp((s.rudderCmd ?? s.rudder ?? 0) + helmDirection * 2.5 * h, -1, 1);
    const command = s.rudderCmd;
    s.rudder += (s.rudderCmd - s.rudder) * (1 - Math.exp(-h * 6));
    if (s.moored) {
      s.u = s.v = s.r = s.rpm = 0;
      s.braking = false;
      continue;
    }
    const wanted = stopping || s.engineOff ? 0 : tele,
      direction = Math.sign(wanted);
    if (direction !== 0 && direction !== s.engDir) {
      onClutch(s.engDir !== 0);
      s.engDir = direction;
    }
    s.startT = 0;
    s.tele = wanted;
    s.rpm = approach(s.rpm || 0, wanted, (stopping ? 2 : 1.1) * h);
    if (!direction && Math.abs(s.rpm) < 0.001) s.engDir = 0;
    const targetSpeed = stopping
      ? 0
      : s.rpm >= 0
        ? s.rpm * 7.2 * power * (1 - 0.08 * load)
        : (s.rpm / 0.6) * 2.5 * power;
    const reducing = Math.abs(targetSpeed) < Math.abs(s.u) || targetSpeed * s.u < 0;
    const acceleration = (stopping ? 1.35 : reducing ? 0.7 : 0.95) * agility;
    const oldU = s.u;
    s.u = approach(s.u, targetSpeed, acceleration * h);
    const bow = (keys.bowR ? 1 : 0) - (keys.bowL ? 1 : 0),
      bowPower = Math.max(0, 1 - Math.abs(s.u) / 3.5);
    const flow = clamp(Math.abs(s.u) / 2.4 + Math.max(0, s.rpm) * 0.25, 0, 1);
    const helm = s.rudder * (0.5 + 0.5 * Math.abs(s.rudder));
    // Reverse steering follows headway; it cannot spin a stopped vessel.
    const ahead = Math.abs(s.u) > 0.03 ? Math.sign(s.u) : Math.sign(s.rpm);
    const targetYaw = stopping
      ? 0
      : clamp(helm * 0.16 * flow * ahead + bow * 0.11 * p.bow * bowPower, -0.2, 0.2) * agility;
    const oldR = s.r;
    s.r +=
      (targetYaw - s.r) * (1 - Math.exp(-h * (stopping ? 5 : Math.abs(command) < 0.01 ? 4 : 2.8)));
    const targetSway = stopping ? 0 : bow * 0.22 * bowPower;
    s.v += (targetSway - s.v) * (1 - Math.exp(-h * 4));
    s.h += (oldR + s.r) * 0.5 * h;
    const u = (oldU + s.u) * 0.5;
    s.x += (Math.sin(s.h) * u + Math.cos(s.h) * s.v) * h;
    s.z += (-Math.cos(s.h) * u + Math.sin(s.h) * s.v) * h;
    if (contact) contact(s, h);
    if (stopping && Math.abs(s.u) < 0.025 && Math.abs(s.v) < 0.025 && Math.abs(s.r) < 0.002) {
      s.u = s.v = s.r = s.rpm = 0;
      s.braking = false;
    }
  }
}
