/*
 * config.js — Global tuning + palette for "Black Excellence: Multiplier Battle".
 *
 * All gameplay balance lives here so the other four eras can clone the engine and
 * only swap data/ + palette. Keep magic numbers OUT of the scenes; put them here.
 */

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
  scrollSpeed: 150, // world px/sec the lane flows toward the player
  steerLerp: 0.18, // how snappily the crowd follows the finger
  weaponTiers: [
    // dmg = per-crowd-unit damage/tick. Combat is Lanchester square-law: the crowd
    // wins when C/E > sqrt(enemyDmgCoeff / dmg). Tuned so a modest size edge wins
    // decisively and greedy multiplication pays off, while bad gate choices cascade.
    { name: 'Spears', fireRate: 420, dmg: 0.16, color: 0xf6d77a },
    { name: 'Bows', fireRate: 320, dmg: 0.22, color: 0xf3a64b },
    { name: 'Cavalry', fireRate: 240, dmg: 0.28, color: 0xe8b43c },
    { name: 'Royal Guard', fireRate: 180, dmg: 0.36, color: 0x9be8ff },
  ],
  enemyDmgCoeff: 0.07, // per-enemy-unit damage/tick dealt to crowd (win boundary C/E ≈ 0.66)
  clashTickMs: 130, // attrition resolution cadence during a clash
};
