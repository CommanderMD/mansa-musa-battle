/*
 * audio.js — Zero-asset sound via the Web Audio API. Returns a single sfx(name) fn so
 * scenes can call this.sfx('pop'). Synthesized blips keep the build self-contained;
 * swap for sampled audio later if desired. Audio context unlocks on first user gesture.
 */
export function makeSfx() {
  let ctx = null;
  const ensure = () => {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  function tone(freq, dur, type = 'sine', gain = 0.12, slideTo = null) {
    const c = ensure();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  }

  const fns = {
    pop: () => tone(440, 0.16, 'triangle', 0.16, 880),
    weapon: () => { tone(330, 0.12, 'square', 0.1); setTimeout(() => tone(660, 0.16, 'square', 0.1), 70); },
    clash: () => tone(120, 0.1, 'sawtooth', 0.14, 70),
    hit: () => tone(200, 0.07, 'square', 0.08, 120),
    coin: () => tone(880, 0.1, 'sine', 0.12, 1320),
    win: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.14), i * 110)); },
    lose: () => { [440, 330, 220].forEach((f, i) => setTimeout(() => tone(f, 0.28, 'sawtooth', 0.12), i * 130)); },
    gate: () => tone(520, 0.08, 'sine', 0.07, 720),
  };

  return (name) => { try { (fns[name] || (() => {}))(); } catch (e) {} };
}
