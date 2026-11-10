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
      engineOff: !!s.engineOff,
      tele: s.tele,
      speed: Math.hypot(s.u, s.v),
      bow: !s.moored && (keys.bowR ? 1 : 0) - (keys.bowL ? 1 : 0),
      moored: s.moored,
      pumping: s.pumping,
    });
  }
  // One-shot effects of the 2D game: hit, alarm, coin, sink, rope, radio…
  fx(name, ...args) {
    if (!this.sound || this.muted || !this.active) return;
    this.sound[name]?.(...args);
  }
  clutch(reversing) {
    if (this.active && !this.muted) this.sound?.clutch(reversing);
  }
  horn() {
    this.start();
    if (this.active && !this.muted) this.sound.horn();
  }
  // Volume per channel (0–100), as in the 2D sound panel. Readable before the first
  // click has started the audio; setting one starts it (a slider move is a gesture).
  get vol() {
    if (this.sound) return this.sound.vol;
    const v = { master: 80, sfx: 80, music: 60, radio: 80 };
    try {
      Object.assign(v, JSON.parse(localStorage.getItem('bunkerguru3d_legacy_vol') || '{}'));
    } catch {}
    return v;
  }
  setVol(channel, value) {
    this.start();
    this.sound.setVol(channel, value);
  }
  get musicOn() {
    if (this.sound) return !!this.sound.musicOn;
    // Before the first sound: the saved choice (on unless switched off), as legacy-audio reads it.
    try {
      return globalThis.localStorage?.getItem('bunkerguru3d_legacy_music') !== '0';
    } catch {
      return true;
    }
  }
  toggleMusic() {
    this.start();
    return this.sound.toggleMusic();
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
