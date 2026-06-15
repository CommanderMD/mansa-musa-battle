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

/* Event factories keep the track readable. Distances are in world px from start. */
const gates = (dist, left, right) => ({ type: 'gateRow', dist, left, right });
const enemy = (dist, count, label) => ({ type: 'enemy', dist, count, label });
const pickup = (dist, kind, side) => ({ type: 'pickup', dist, kind, side });
const weapon = (dist, side) => ({ type: 'gateRow', dist, left: side === 'L' ? { op: 'weapon' } : { op: 'mul', v: 2 }, right: side === 'L' ? { op: 'mul', v: 2 } : { op: 'weapon' } });

export const CHAPTER1 = {
  id: 'mali',
  title: 'The Golden Age of Mali',
  anchor: 'Mansa Musa',
  subtitle: 'Chapter 1',
  levels: [
    {
      id: 'm1',
      name: 'Niani — The March Begins',
      blurb: 'Rally the column outside the capital and pick your gates wisely.',
      startCrowd: 8,
      length: 4200,
      track: [
        pickup(420, 'gold', 'L'),
        gates(700, { op: 'add', v: 8 }, { op: 'mul', v: 2 }), // ~16
        enemy(1150, 10, 'Bandits'),
        pickup(1450, 'crystal', 'R'),
        gates(1750, { op: 'mul', v: 3 }, { op: 'sub', v: 5 }), // greedy x3 vs trap → ~45
        enemy(2250, 18, 'Raiders'),
        pickup(2550, 'gold', 'R'),
        weapon(2850, 'L'),
        gates(3250, { op: 'add', v: 10 }, { op: 'mul', v: 2 }), // ~80
        enemy(3700, 30, 'War Party'),
      ],
      boss: { count: 80, name: 'Slaver Caravan', threshold: 55 },
    },
    {
      id: 'm2',
      name: 'Road to Walata',
      blurb: 'Cross the savanna toward the trade roads. Tougher waves, richer gates.',
      startCrowd: 10,
      length: 5000,
      track: [
        gates(600, { op: 'mul', v: 2 }, { op: 'add', v: 10 }), // ~20
        enemy(1050, 13, 'Raiders'),
        pickup(1350, 'crystal', 'L'),
        gates(1650, { op: 'mul', v: 3 }, { op: 'sub', v: 5 }), // ~54
        pickup(1950, 'gold', 'R'),
        enemy(2300, 26, 'Desert Wolves'),
        weapon(2650, 'R'),
        gates(3050, { op: 'mul', v: 3 }, { op: 'mul', v: 2 }), // both reward → big
        enemy(3500, 45, 'War Party'),
        pickup(3800, 'crystal', 'R'),
        gates(4150, { op: 'add', v: 10 }, { op: 'sub', v: 5 }),
        enemy(4550, 60, 'Marauders'),
      ],
      boss: { count: 130, name: 'Desert Warlord', threshold: 90 },
    },
    {
      id: 'm3',
      name: 'Timbuktu — City of Gold',
      blurb: 'Defend the jewel of the empire and its great library at Sankore.',
      startCrowd: 12,
      length: 5600,
      track: [
        gates(620, { op: 'mul', v: 3 }, { op: 'add', v: 10 }), // ~36
        enemy(1100, 22, 'Raiders'),
        pickup(1400, 'gold', 'L'),
        weapon(1700, 'L'),
        gates(2050, { op: 'mul', v: 2 }, { op: 'sub', v: 5 }), // ~70
        enemy(2500, 40, 'War Party'),
        pickup(2800, 'crystal', 'R'),
        gates(3150, { op: 'mul', v: 3 }, { op: 'mul', v: 2 }),
        enemy(3650, 70, 'Marauders'),
        weapon(3950, 'R'),
        gates(4350, { op: 'add', v: 10 }, { op: 'mul', v: 3 }),
        enemy(4850, 95, 'Horde'),
      ],
      boss: { count: 175, name: 'Sahel Conqueror', threshold: 120 },
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
