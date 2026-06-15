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
const barrels = (dist, items) => ({ type: 'barrels', dist, items });
const mul = (hp, v) => ({ hp, reward: { op: 'mul', v } });   // CROWD ×v soldiers
const add = (hp, v) => ({ hp, reward: { op: 'add', v } });   // CROWD +v soldiers
const weap = (hp, step = 1) => ({ hp, reward: { op: 'arrow', step } }); // WEAPON +step
const enemy = (dist, count, label, shape = 'mixed', side = 'C') => ({ type: 'enemy', dist, count, label, shape, side });
const enc = (dist, left, right, wave) => ({ type: 'encounter', dist, left, right, wave });
const pickup = (dist, kind, side) => ({ type: 'pickup', dist, kind, side });

export const CHAPTER1 = {
  id: 'mali',
  title: 'The Golden Age of Mali',
  anchor: 'Mansa Musa',
  subtitle: 'Chapter 1',
  levels: [
    {
      id: 'm1',
      name: 'Niani — The March Begins',
      blurb: 'One soldier. Break the kegs, line up your arrows, and grow the column.',
      startCrowd: 1,
      length: 6600,
      track: [
        // 0) TEACH ALIGNMENT (1 soldier, no choice): line up and shoot a tiny scout group.
        enemy(450, 2, 'Scouts', 'mixed', 'C'),
        // 1) THE CALIBRATION at 1 soldier: read the incoming 10 — take BODIES (x4 → 4 clears
        //    them), NOT weapon (1 soldier even at 2 arrows is overrun).
        enc(1150, { side: 'L', ...mul(2, 4) }, { side: 'R', ...weap(2) },
          { count: 12, shape: 'mixed', side: 'C', label: 'Bandits' }),
        pickup(1650, 'gold', 'L'),
        // 2) A bigger WIDE wall vs ~4 soldiers — still need bodies (x4 → 16). Weapon = overrun.
        enc(2350, { side: 'L', ...mul(3, 4) }, { side: 'R', ...weap(3) },
          { count: 26, shape: 'wide', side: 'C', label: 'Raiders' }),
        pickup(2850, 'crystal', 'R'),
        // 3) Now safe at ~16 — a DEEP column: take WEAPON to build DPS / fire-rate (deep's answer).
        enc(3550, { side: 'L', ...weap(3) }, { side: 'R', ...add(3, 8) },
          { count: 30, shape: 'deep', side: 'C', label: 'Column' }),
        // 4) Snowball — mixed and wide hordes (power now outpaces the threat).
        enc(4650, { side: 'L', ...mul(4, 3) }, { side: 'R', ...weap(3) },
          { count: 42, shape: 'mixed', side: 'L', label: 'War Party' }),
        enc(5750, { side: 'L', ...mul(4, 2) }, { side: 'R', ...weap(3) },
          { count: 52, shape: 'wide', side: 'C', label: 'Marauders' }),
      ],
      boss: { count: 64, name: 'Slaver Caravan' },
    },
    {
      id: 'm2',
      name: 'Road to Walata',
      blurb: 'The raids come thicker — wide walls and deep columns. Pick the right upgrade.',
      startCrowd: 1,
      length: 7200,
      track: [
        enemy(450, 2, 'Scouts', 'mixed', 'C'),
        // calibration — a touch harder than L1 (12, wide): bodies first.
        enc(1150, { side: 'L', ...mul(2, 4) }, { side: 'R', ...weap(2) },
          { count: 12, shape: 'wide', side: 'C', label: 'Raiders' }),
        pickup(1650, 'crystal', 'L'),
        enc(2350, { side: 'L', ...mul(3, 4) }, { side: 'R', ...weap(3) },
          { count: 30, shape: 'wide', side: 'C', label: 'War Band' }),
        // deep columns → weapon's turn
        enc(3550, { side: 'L', ...weap(3) }, { side: 'R', ...mul(4, 3) },
          { count: 36, shape: 'deep', side: 'L', label: 'Spear Column' }),
        pickup(4050, 'gold', 'R'),
        enc(4750, { side: 'L', ...mul(4, 3) }, { side: 'R', ...weap(3) },
          { count: 48, shape: 'wide', side: 'C', label: 'Marauders' }),
        enc(5950, { side: 'L', ...weap(3) }, { side: 'R', ...mul(5, 3) },
          { count: 60, shape: 'deep', side: 'R', label: 'Deep Column' }),
      ],
      boss: { count: 110, name: 'Desert Warlord' },
    },
    {
      id: 'm3',
      name: 'Timbuktu — City of Gold',
      blurb: 'Defend the jewel of the empire — the largest hordes yet. Read each wave.',
      startCrowd: 1,
      length: 7800,
      track: [
        enemy(450, 2, 'Scouts', 'wide', 'C'),
        // calibration — hardest opener (14, wide): you MUST take bodies.
        enc(1150, { side: 'L', ...mul(2, 4) }, { side: 'R', ...weap(2) },
          { count: 12, shape: 'wide', side: 'C', label: 'Raiders' }),
        pickup(1650, 'gold', 'L'),
        enc(2350, { side: 'L', ...mul(3, 4) }, { side: 'R', ...weap(3) },
          { count: 34, shape: 'wide', side: 'C', label: 'War Band' }),
        enc(3550, { side: 'L', ...weap(3) }, { side: 'R', ...mul(4, 4) },
          { count: 44, shape: 'deep', side: 'L', label: 'Deep Column' }),
        pickup(4050, 'crystal', 'R'),
        enc(4750, { side: 'L', ...mul(5, 3) }, { side: 'R', ...weap(3) },
          { count: 58, shape: 'wide', side: 'C', label: 'Horde' }),
        enc(5950, { side: 'L', ...weap(3) }, { side: 'R', ...mul(5, 3) },
          { count: 74, shape: 'deep', side: 'R', label: 'Spear Wall' }),
      ],
      boss: { count: 165, name: 'Sahel Conqueror' },
    },
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
