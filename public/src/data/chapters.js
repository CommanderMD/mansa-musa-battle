/*
 * chapters.js — Content data for CHAPTER 1: The Golden Age of Mali.
 *
 * To add a new era later (Chapter 2..5), append a chapter object with the same
 * shape and register it. The engine reads only this file for content; no scene
 * code needs to change. `track` is a distance-ordered list of spawn events the
 * BattleScene streams down the lane.
 *
 * Historical content (dossier) is kept accurate and respectful — see sources noted
 * inline. "Read more" deep-links to the live Black Achievement Digital Museum.
 */

import { waveSize } from '../config.js';

export const MUSEUM_URL =
  'https://black-achievement-museum.ericarmstrong.workers.dev';

/* Event factories. Distances are world px from start.
 *  - barrels: shoot kegs down (aligned arrows) before they reach you to claim the reward.
 *  - CROWD kegs (mul/add) grow soldiers; WEAPON kegs (weap) advance the weapon: SPREAD 1→2→3,
 *    then FIRE RATE (Rapid I/II/III). DPS = soldiers × spread × fireRate.
 *  - encounter (enc): a barrel PAIR + its counter-wave TELEGRAPHED far up the lane, so you read
 *    the incoming count/shape before committing crowd-vs-weapon.
 *  - wave shape: 'wide' (a wall across the lane — needs soldiers/coverage), 'deep' (a column —
 *    needs DPS/fire-rate), 'mixed' (general).
 */
const enemy = (dist, count, label, shape = 'mixed', side = 'C') => ({ type: 'enemy', dist, count, label, shape, side });
const pickup = (dist, kind, side) => ({ type: 'pickup', dist, kind, side });
// keg rewards — CROWD (xN / +N soldiers) vs WEAPON (advance spread→rate). hp = required hits.
const mul = (v) => ({ op: 'mul', v });
const add = (v) => ({ op: 'add', v });
const weap = () => ({ op: 'arrow', step: 1 });

/* buildLevel — generate a level's track from a compact spec. Wave SIZES are geometric
 * (config.waveSize: ~+14%/encounter, flattening near the end); barrel HP ramps with them so
 * breaking a keg stays real effort as your column (and its per-arrow punch) grows. */
function buildLevel(meta, encs, boss) {
  const total = encs.length;
  const track = [enemy(meta.teachDist, meta.teach, 'Scouts', 'mixed', 'C')];
  let dist = meta.firstDist;
  encs.forEach((e, i) => {
    // Encounter 0 is the CALIBRATION — fixed small wave every level (you always restart at 1
    // soldier). Encounters 1.. ramp geometrically from the per-level baseline.
    const count = i === 0 ? meta.calib : waveSize(meta.base, i - 1, total - 1);
    // Calibration keg is low-HP every level (a lone soldier must break it fast to grow in time);
    // later kegs ramp with the waves so breaking stays real effort as your column grows.
    const hp = i === 0 ? 5 : Math.max(3, Math.round(meta.barrelHp * Math.pow(meta.barrelRatio, i - 1)));
    track.push({
      type: 'encounter', dist,
      left: { side: 'L', hp, reward: e.l },
      right: { side: 'R', hp, reward: e.r },
      wave: { count, shape: e.shape, side: e.side || 'C', label: e.label },
    });
    if (e.pickup) track.push(pickup(dist + 520, e.pickup, e.pside || 'L'));
    dist += meta.gap;
  });
  return { ...meta, length: dist - Math.round(meta.gap * 0.45), track, boss };
}

export const CHAPTER1 = {
  id: 'mali',
  title: 'The Golden Age of Mali',
  anchor: 'Mansa Musa',
  subtitle: 'Chapter 1',
  levels: [
    // L1 — base wave 12, +14%/encounter (12,14,16,17,19 with the flat tail). Teach → calibration
    // (wide wall: take BODIES) → deep (weapon) → wide (crowd) → mixed.
    buildLevel(
      { id: 'm1', name: 'Niani — The March Begins', startCrowd: 1, speedMul: 1.0,
        blurb: 'One soldier. Read the wave, grow the column, line up every volley.',
        teachDist: 450, teach: 2, firstDist: 1200, gap: 1250, calib: 14, base: 14, barrelHp: 6, barrelRatio: 1.5 },
      [
        { l: mul(4), r: weap(), shape: 'wide', label: 'Bandits', pickup: 'gold' }, // CALIBRATION
        { l: weap(), r: add(6), shape: 'deep', label: 'Column' },
        { l: mul(3), r: weap(), shape: 'wide', label: 'Raiders', pickup: 'crystal' },
        { l: mul(3), r: weap(), shape: 'mixed', side: 'L', label: 'War Party' },
        { l: mul(2), r: weap(), shape: 'wide', label: 'Marauders' },
      ],
      { count: 44, name: 'Slaver Caravan' }
    ),
    // L2 — baseline ~1.4× L1 (base 17). Faster lane. wide/deep trade off.
    buildLevel(
      { id: 'm2', name: 'Road to Walata', startCrowd: 1, speedMul: 1.08,
        blurb: 'Faster raids — wide walls and deep columns trade off. Read each one.',
        teachDist: 450, teach: 3, firstDist: 1200, gap: 1250, calib: 12, base: 19, barrelHp: 8, barrelRatio: 1.5 },
      [
        { l: mul(4), r: weap(), shape: 'wide', label: 'Raiders', pickup: 'crystal' }, // CALIBRATION
        { l: weap(), r: mul(3), shape: 'deep', label: 'Spear Column' },
        { l: mul(3), r: weap(), shape: 'wide', label: 'War Band', pickup: 'gold' },
        { l: weap(), r: mul(3), shape: 'deep', side: 'R', label: 'Deep Column' },
        { l: mul(2), r: weap(), shape: 'mixed', side: 'L', label: 'Marauders' },
      ],
      { count: 78, name: 'Desert Warlord' }
    ),
    // L3 — baseline ~1.4× L2 (base 24). Fastest. Largest hordes.
    buildLevel(
      { id: 'm3', name: 'Timbuktu — City of Gold', startCrowd: 1, speedMul: 1.14,
        blurb: 'The fastest, largest hordes. Read every wave and keep both edges sharp.',
        teachDist: 450, teach: 3, firstDist: 1200, gap: 1300, calib: 11, base: 26, barrelHp: 11, barrelRatio: 1.5 },
      [
        { l: mul(4), r: weap(), shape: 'wide', label: 'Raiders', pickup: 'gold' }, // CALIBRATION
        { l: weap(), r: mul(3), shape: 'deep', label: 'Spear Column' },
        { l: mul(3), r: weap(), shape: 'wide', label: 'War Band', pickup: 'crystal' },
        { l: weap(), r: mul(3), shape: 'deep', side: 'R', label: 'Deep Column' },
        { l: mul(2), r: weap(), shape: 'wide', label: 'Horde' },
      ],
      { count: 130, name: 'Sahel Conqueror' }
    ),
  ],
};

/*
 * Dossier awarded on victory. Every line is historically grounded:
 *  - Mansa Musa reigned over the Mali Empire c. 1312–1337 CE.
 *  - His 1324 pilgrimage (hajj) to Mecca crossed the Sahara through Cairo; chroniclers
 *    (al-Umari) recorded the gold his caravan distributed in Egypt.
 *  - Under his rule Timbuktu flourished as a hub of trade and Islamic scholarship;
 *    the Sankore mosque/madrasa grew into a renowned center of learning.
 *  - He is frequently cited as one of the wealthiest individuals in recorded history.
 */
export const DOSSIER = {
  name: 'Mansa Musa',
  era: 'Mali Empire · c. 1280 – c. 1337 CE',
  title: 'The Golden King — Mansa (King of Kings) of Mali',
  facts: [
    'Ruled the Mali Empire at its height (c. 1312–1337), commanding West Africa’s gold and salt trade.',
    'In 1324 he made the hajj to Mecca with an immense caravan; chroniclers wrote of the gold his retinue gave away in Cairo along the way.',
    'He made Timbuktu a celebrated center of trade and learning — the Sankore madrasa drew scholars from across the Muslim world.',
    'Often named among the richest people in recorded history, his pilgrimage put Mali on European and Middle Eastern maps for centuries.',
  ],
  source: MUSEUM_URL,
};
