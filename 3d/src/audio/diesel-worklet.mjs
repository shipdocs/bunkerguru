// The diesel on the audio thread (AudioWorklet): the sound is computed where the
// speakers are fed, so a busy main thread (drawing the 3D harbour on a modest laptop)
// can no longer starve it and make it crackle. Same DSP as diesel.mjs, same state.
import { createDiesel } from './diesel.mjs';

class DieselProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.diesel = createDiesel();
    this.port.onmessage = (e) => this.diesel.set(e.data.on, e.data.power);
  }
  process(inputs, outputs) {
    const out = outputs[0] && outputs[0][0];
    if (out) this.diesel.render(out, sampleRate);
    return true;
  }
}
registerProcessor('bunkerguru-diesel', DieselProcessor);
