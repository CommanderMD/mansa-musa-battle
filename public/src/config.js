/*
 * config.js — Global tuning + palette for "Black Excellence: Multiplier Battle".
 *
 * All gameplay balance lives here so the other four eras can clone the engine and
 * only swap data/ + palette. Keep magic numbers OUT of the scenes; put them here.
 */

/* Build version — bump to v4, v5… for future refinements. Shown on boot/map. */
export const VERSION = 'v3';

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
  clashLineY: GAME_H - 230, // where the crowd "stands" and combat resolves
  crowdY: GAME_H - 170, // crowd anchor (a touch below the clash line, nearer the player)
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
  scrollSpeed: 100, // world px/sec the lane flows toward the player (v3: slowed for readability)
  steerLerp: 0.4, // how snappily the crowd follows the finger (v3: tighter, near-instant w/ light smoothing)
  // Bow tiers — purely cosmetic now (name + arrow color), indexed by arrows-per-unit.
  weaponTiers: [
    { name: 'Short Bows', color: 0xf6d77a },
    { name: 'War Bows', color: 0xf3a64b },
    { name: 'Composite Bows', color: 0xe8b43c },
    { name: 'Double Bows', color: 0x9be8ff },
    { name: 'Royal Volley', color: 0xbff4ff },
  ],
  maxArrowsPerUnit: 16, // cap on the weapon-upgrade path
  // Enemy clash (kept Lanchester square-law). yourDmg scales with FIREPOWER = count×apu, so
  // weapon barrels help clear waves too — but only COUNT adds bodies to absorb enemy losses.
  clashDmgPerFirepower: 0.16, // at apu=1 this matches the old tier-0 damage
  enemyDmgCoeff: 0.07, // per-enemy-unit damage/tick dealt to crowd
  clashTickMs: 130, // attrition resolution cadence during a clash

  // Archery: continuous volleys fired up the lane at descending barrels. More crowd +
  // higher bow tier = more arrows, faster. This is the reinforcing loop: a bigger army
  // breaks high-HP barrels in time, which grows the army. Tuned (with barrelSpeedMul's
  // short window) so a starting crowd breaks ~hp4-5, a mid crowd ~hp10, a big crowd shreds
  // whole pairs — so greedy high-HP kegs are a real gamble early and a reward once you snowball.
  // v3: arrows fly STRAIGHT UP from the units' x — no homing. A barrel is only hit if an
  // arrow's x overlaps the barrel as it passes that row, so steering to ALIGN is the skill.
  // Speed is fast-but-trackable by eye; a misaligned arrow sails past and off the top.
  arrow: { speed: 440, lifespanMs: 2600 },
  fire: {
    baseInterval: 560, // ms between volleys at crowd 0 (v3: more deliberate cadence)
    intervalPerUnit: 1.2, // faster as the crowd grows
    minInterval: 230,
    arrowsBase: 1,
    arrowsPerUnits: 8, // +1 base arrow per this many units (then ×arrowsPerUnit) — size = more arrows
    arrowsMaxVisual: 26, // sprite cap; beyond this, each arrow carries extra hit-power
  },
  // Barrels roll DOWN a touch faster than the lane flows (v3: gentler, so there's time to aim).
  barrelSpeedMul: 1.35,
  // Damage a barrel deals to the crowd if it reaches them still alive: ceil(remHP * coeff).
  barrelReachDmg: 0.5,
};
