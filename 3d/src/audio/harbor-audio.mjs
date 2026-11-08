import { createLegacySound } from './legacy-audio.mjs';
// Adapter only: keep the old game's thumps, rumble, turbo and pneumatic clutch.
export class HarborAudio {
  constructor() {
    this.sound = null;
    this.active = false;
    this.muted = false;
    try {
      this.muted = localStorage.getItem('bunkerguru-muted') === '1';
    } catch {}
  }
  start() {
    if (!this.sound) this.sound = createLegacySound();
    this.sound.init();
    this.sound.setMuted(this.muted);
    this.sound.setActive(this.active);
  }
  update(s, active, keys = {}) {
    this.active = active;
    if (!this.sound) return;
    this.sound.setActive(active);
    this.sound.update({
      running: active,
      rpm: s.rpm,
      tele: s.tele,
      speed: Math.hypot(s.u, s.v),
      bow: !s.moored && (keys.bowR ? 1 : 0) - (keys.bowL ? 1 : 0),
      moored: s.moored,
      pumping: s.pumping,
    });
  }
  clutch(reversing) {
    if (this.active && !this.muted) this.sound?.clutch(reversing);
  }
  horn() {
    this.start();
    if (this.active && !this.muted) this.sound.horn();
  }
  toggle() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('bunkerguru-muted', this.muted ? '1' : '0');
    } catch {}
    this.sound?.setMuted(this.muted);
    return this.muted;
  }
}
