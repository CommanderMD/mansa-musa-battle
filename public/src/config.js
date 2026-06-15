/*
 * config.js — Global tuning + palette for "Black Excellence: Multiplier Battle".
 *
 * All gameplay balance lives here so the other four eras can clone the engine and
 * only swap data/ + palette. Keep magic numbers OUT of the scenes; put them here.
 */

/* Build version — bump to v5, v6… for future refinements. Shown on boot/map. */
export const VERSION = 'v5';

/* Logical design resolution (mobile portrait, ~9:16). Phaser FIT-scales this. */
export const GAME_W = 480;
export const GAME_H = 854;

/* Warm gold/green Mali palette — used by procedural textures and UI. */
export const PALETTE = {
  goldLight: 0xf6d77a,
  gold: 0xe8b43c,
  goldDeep: 0xb6831f,
  green: 0x3f7d4e,
  greenDeep: 0x255038,
  sand: 0xd9b777,
  sandDark: 0xb8965a,
  road: 0xc9a86a,
  roadEdge: 0x9c7f43,
  sky: 0xf3e2b0,
  skyTop: 0xe8c879,
  player: 0x2f6fb0, // royal blue robes (player crowd)
  playerTrim: 0xf6d77a,
  enemy: 0x9a3326, // raider red
  enemyTrim: 0x4a1a12,
  crystal: 0x46c7e8,
  ink: 0x2a1c0c,
  parchment: 0xe9d3a3,
  victoryBlue: 0x2f6fb0,
};

/* CSS hex helpers for DOM/text styling. */
export const hex = (n) => '#' + n.toString(16).padStart(6, '0');

/* The receding road trapezoid, in logical px. Narrow at top (vanishing), wide at base. */
export const LANE = {
  topY: 150, // horizon-ish
  baseY: GAME_H,
  topHalfW: 46,
  baseHalfW: 190,
  centerX: GAME_W / 2,
  crowdY: GAME_H - 170, // crowd anchor row — where arrows launch and enemies make contact
};

/* Map a screen Y to a perspective scale (small far away, large up close). */
export function depthScale(y) {
  const t = Phaser.Math.Clamp((y - LANE.topY) / (LANE.baseY - LANE.topY), 0, 1);
  return Phaser.Math.Linear(0.45, 1.15, t);
}

/* Half-width of the drivable road at a given screen Y. */
export function laneHalfWidth(y) {
  const t = Phaser.Math.Clamp((y - LANE.topY) / (LANE.baseY - LANE.topY), 0, 1);
  return Phaser.Math.Linear(LANE.topHalfW, LANE.baseHalfW, t);
}

export const BALANCE = {
  startCrowd: 8,
  renderCap: 110, // max unit sprites drawn; logical count can exceed this

  // ── v5 GROUNDED SPEEDS (px/s) ──  Anchored to a quick-time march (~120 steps/min ≈ 3.4 mph):
  // a deliberate, readable pace. Enemies march at scrollSpeed; barrels roll SLOWER; arrows are
  // fast but eye-trackable.
  scrollSpeed: 88, // the march — enemies & lane flow toward the player (slow, steady, readable)
  steerLerp: 0.4, // crowd follows the finger near-instantly with light smoothing
  enemySpeedMul: 1.0, // enemies march at the base march speed (~88 px/s)
  barrelSpeedMul: 0.62, // barrels ROLL slower than the marchers (~55 px/s)
  arrow: { speed: 430, lifespanMs: 3200 }, // fast but trackable by eye

  // v4/v5 weapon progression: SPREAD = arrows shown per volley, HARD-CAPPED AT 3. Once spread
  // is maxed, weapon kegs raise FIRE RATE only (Rapid I/II/III) — never more arrows. Each shown
  // arrow carries the whole column's punch (hitPower = soldier count), so DPS = count × spread × rate.
  maxSpread: 3,
  maxRateTier: 3,
  weaponColors: [0xf6d77a, 0xf3a64b, 0xe8b43c, 0x9be8ff, 0xbff4ff, 0xffffff],
  fire: {
    baseInterval: 500, // ms between volleys at rate tier 0 (deliberate cadence)
    rateStepMul: 0.8, // each Rapid tier → interval / (1 + 0.8*tier)
    minInterval: 130,
  },

  // Enemy combat is PURE PROJECTILE-KILL: arrows kill raiders on x-overlap; any survivor that
  // reaches the crowd row removes one of your units (1-for-1).
  enemyClusterSize: 9, // a wave streams down as clusters of ~this many raiders
  enemyHpPerUnit: 2, // arrow hits to kill one raider (boss raiders take 3)

  // ── v5 ENEMY GROWTH (geometric, industry-standard) ──  Within a level each successive
  // encounter's wave grows by `growthRatio`; the last couple flatten toward linear (piecewise)
  // so it stays hard-but-fair. Per level, the baseline steps up by `levelStep`. The PLAYER's
  // power (x-crowd kegs) grows faster, so smart play snowballs ahead.
  growthRatio: 1.14, // +14% per encounter within a level
  levelStep: 1.4, // each level's baseline ≈ 1.4× the previous
  flattenTail: 2, // the last N encounters ramp linearly (gentler) instead of geometric

  // How far up-lane a telegraphed counter-wave spawns behind its barrel pair (perspective px).
  // Larger in v5 because barrels roll slowly — keeps the wave arriving AFTER the chosen keg.
  telegraphGap: 360,
  // Damage a barrel deals to the crowd if it reaches them still alive: ceil(remHP * coeff).
  barrelReachDmg: 0.5,
};

/* Wave size for encounter `i` (0-based) of a level: geometric ramp from `base`, flattening over
 * the final `flattenTail` encounters of `total` so it doesn't blow up near the boss. */
export function waveSize(base, i, total) {
  const { growthRatio: r, flattenTail: tail } = BALANCE;
  const kneeIdx = Math.max(0, total - tail); // geometric up to the knee, then linear
  if (i <= kneeIdx) return Math.round(base * Math.pow(r, i));
  const atKnee = base * Math.pow(r, kneeIdx);
  const linStep = atKnee * (r - 1); // continue at the knee's absolute increment (linear tail)
  return Math.round(atKnee + linStep * (i - kneeIdx));
}
