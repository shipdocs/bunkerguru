// A short tick under the thumb where the device has a vibration motor (Android).
// Silent everywhere else; never throws.
export function haptic(pattern = 12, nav = globalThis.navigator) {
  try {
    return typeof nav?.vibrate === 'function' ? !!nav.vibrate(pattern) : false;
  } catch {
    return false;
  }
}
