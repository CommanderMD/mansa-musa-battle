/*
 * juice.js — Tiny reusable "game feel" helpers: screen shake, hit flash, particle
 * bursts, gold sparkle, and floating pop text. Scenes call these; they own no state.
 */
import { PALETTE } from '../config.js';

export const Juice = {
  shake(scene, intensity = 0.006, dur = 150) {
    scene.cameras.main.shake(dur, intensity);
  },

  flash(scene, color = 0xffffff, dur = 90, alpha = 0.5) {
    scene.cameras.main.flash(dur, (color >> 16) & 255, (color >> 8) & 255, color & 255, false, null, alpha);
  },

  /* A short outward burst of `n` particles in `color`. */
  burst(scene, x, y, color = PALETTE.gold, n = 12, spd = 160) {
    const e = scene.add.particles(x, y, 'spark', {
      speed: { min: spd * 0.4, max: spd },
      angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 250, max: 520 },
      quantity: n,
      tint: color,
      blendMode: 'ADD',
      emitting: false,
    });
    e.setDepth(900);
    e.explode(n);
    scene.time.delayedCall(700, () => e.destroy());
    return e;
  },

  /* Persistent gentle sparkle (e.g. on a chest or the crowd when huge). */
  sparkle(scene, x, y, color = PALETTE.goldLight) {
    const e = scene.add.particles(x, y, 'spark', {
      speed: { min: 6, max: 24 },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 600,
      frequency: 120,
      tint: color,
      blendMode: 'ADD',
    });
    e.setDepth(890);
    return e;
  },

  /* Floating text that rises and fades — for "x2", "+10", "-5", combat numbers. */
  popText(scene, x, y, text, color = '#ffffff', size = 30) {
    const t = scene.add.text(x, y, text, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: size + 'px',
      fontStyle: 'bold',
      color,
      stroke: '#2a1c0c',
      strokeThickness: 5,
    });
    t.setOrigin(0.5).setDepth(950).setScale(0.2);
    scene.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.out' });
    scene.tweens.add({
      targets: t,
      y: y - 70,
      alpha: 0,
      duration: 900,
      delay: 160,
      ease: 'Cubic.in',
      onComplete: () => t.destroy(),
    });
    return t;
  },

  /* A scale "punch" on any game object — the satisfying multiply pop. */
  punch(scene, obj, amt = 1.25, dur = 160) {
    const sx = obj.scaleX, sy = obj.scaleY;
    scene.tweens.add({
      targets: obj,
      scaleX: sx * amt,
      scaleY: sy * amt,
      duration: dur * 0.4,
      yoyo: true,
      ease: 'Quad.out',
      onComplete: () => obj.setScale(sx, sy),
    });
  },
};
