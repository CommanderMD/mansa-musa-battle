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
      speedMul: 1.0,
      length: 7000,
      track: [
        // a) TEACH ALIGNMENT: 1 soldier lines up and shoots two scouts (no choice).
        enemy(450, 2, 'Scouts', 'mixed', 'C'),
        // b) THE CALIBRATION at 1 soldier: a WIDE wall of 13 is telegraphed up the lane — take
        //    BODIES (x4 → 4 fans out and clears it). The WEAPON pick stays 1 soldier → overrun.
        enc(1150, { side: 'L', ...mul(2, 4) }, { side: 'R', ...weap(2) },
          { count: 13, shape: 'wide', side: 'C', label: 'Bandits' }),
        pickup(1650, 'gold', 'L'),
        // c) Introduce the DEEP column once you're safer: sustained DPS / fire-rate — WEAPON shines.
        enc(2550, { side: 'L', ...weap(3) }, { side: 'R', ...add(3, 5) },
          { count: 18, shape: 'deep', side: 'C', label: 'Column' }),
        // d) WIDE wall: bodies fan out and blanket the lane — CROWD shines.
        enc(3650, { side: 'L', ...mul(3, 2) }, { side: 'R', ...weap(3) },
          { count: 28, shape: 'wide', side: 'C', label: 'Raiders' }),
        // e) Mixed horde — waves scale with your power, so alignment still matters.
        enc(4850, { side: 'L', ...mul(4, 2) }, { side: 'R', ...weap(3) },
          { count: 40, shape: 'mixed', side: 'L', label: 'War Party' }),
      ],
      boss: { count: 50, name: 'Slaver Caravan' },
    },
    {
      id: 'm2',
      name: 'Road to Walata',
      blurb: 'Faster raids — wide walls and deep columns trade off. Read each one.',
      startCrowd: 1,
      speedMul: 1.12,
      length: 7400,
      track: [
        enemy(450, 3, 'Scouts', 'mixed', 'C'),
        // calibration right away (you know the lesson) — a wide wall needs bodies.
        enc(1150, { side: 'L', ...mul(2, 4) }, { side: 'R', ...weap(2) },
          { count: 14, shape: 'wide', side: 'C', label: 'Raiders' }),
        pickup(1650, 'crystal', 'L'),
        // deep → weapon
        enc(2350, { side: 'L', ...weap(3) }, { side: 'R', ...mul(3, 2) },
          { count: 22, shape: 'deep', side: 'C', label: 'Spear Column' }),
        // wide → crowd
        enc(3450, { side: 'L', ...mul(3, 2) }, { side: 'R', ...weap(3) },
          { count: 34, shape: 'wide', side: 'C', label: 'War Band' }),
        pickup(3950, 'gold', 'R'),
        // deep → weapon
        enc(4650, { side: 'L', ...weap(3) }, { side: 'R', ...mul(4, 2) },
          { count: 46, shape: 'deep', side: 'R', label: 'Deep Column' }),
        // big mixed
        enc(5850, { side: 'L', ...mul(4, 2) }, { side: 'R', ...weap(3) },
          { count: 58, shape: 'mixed', side: 'L', label: 'Marauders' }),
      ],
      boss: { count: 90, name: 'Desert Warlord' },
    },
    {
      id: 'm3',
      name: 'Timbuktu — City of Gold',
      blurb: 'The fastest, largest hordes. Read every wave and keep both edges sharp.',
      startCrowd: 1,
      speedMul: 1.18,
      length: 7800,
      track: [
        enemy(450, 3, 'Scouts', 'wide', 'C'),
        enc(1150, { side: 'L', ...mul(2, 4) }, { side: 'R', ...weap(2) },
          { count: 12, shape: 'wide', side: 'C', label: 'Raiders' }),
        pickup(1650, 'gold', 'L'),
        enc(2350, { side: 'L', ...weap(3) }, { side: 'R', ...mul(3, 2) },
          { count: 22, shape: 'deep', side: 'C', label: 'Spear Column' }),
        enc(3450, { side: 'L', ...mul(3, 2) }, { side: 'R', ...weap(3) },
          { count: 40, shape: 'wide', side: 'C', label: 'War Band' }),
        pickup(3950, 'crystal', 'R'),
        enc(4650, { side: 'L', ...weap(3) }, { side: 'R', ...mul(4, 2) },
          { count: 54, shape: 'deep', side: 'R', label: 'Deep Column' }),
        enc(5850, { side: 'L', ...mul(4, 2) }, { side: 'R', ...weap(3) },
          { count: 72, shape: 'wide', side: 'C', label: 'Horde' }),
      ],
      boss: { count: 140, name: 'Sahel Conqueror' },
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
