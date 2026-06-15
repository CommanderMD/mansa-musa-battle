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

/* Event factories keep the track readable. Distances are in world px from start.
 * Barrels are the multiplier source now: shoot them down with arrows before they reach
 * the crowd. `items` is 1 or 2 barrels ({ side, hp, reward }); pairs force a greedy-vs-safe
 * choice (you can only focus one — the other chips you). reward = { op:'mul'|'add'|'weapon', v }.
 */
const barrels = (dist, items) => ({ type: 'barrels', dist, items });
const mul = (hp, v) => ({ hp, reward: { op: 'mul', v } });
const add = (hp, v) => ({ hp, reward: { op: 'add', v } });
const arrowsUp = (hp) => ({ hp, reward: { op: 'weapon' } });
const enemy = (dist, count, label) => ({ type: 'enemy', dist, count, label });
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
      blurb: 'Rally the archers and shoot down the reward kegs before they reach the column.',
      startCrowd: 8,
      length: 4300,
      track: [
        pickup(420, 'gold', 'L'),
        // tutorial pair: safe +12 (hp4, breakable now) vs greedy x3 (hp9, needs a bigger crowd)
        barrels(750, [{ side: 'L', ...add(4, 12) }, { side: 'R', ...mul(9, 3) }]),
        enemy(1250, 8, 'Bandits'),
        pickup(1550, 'crystal', 'R'),
        // now ~breakable: greedy x3 (hp9) vs safe +14 (hp4)
        barrels(1900, [{ side: 'L', ...mul(9, 3) }, { side: 'R', ...add(4, 14) }]),
        enemy(2450, 16, 'Raiders'),
        pickup(2750, 'gold', 'R'),
        barrels(3050, [{ side: 'C', ...arrowsUp(4) }]), // ARROWS+ upgrade
        barrels(3450, [{ side: 'L', ...add(4, 20) }, { side: 'R', ...mul(10, 2) }]),
        enemy(3950, 26, 'War Party'),
      ],
      boss: { count: 55, name: 'Slaver Caravan', threshold: 45 },
    },
    {
      id: 'm2',
      name: 'Road to Walata',
      blurb: 'Cross the savanna toward the trade roads. Tougher kegs, richer rewards.',
      startCrowd: 10,
      length: 5100,
      track: [
        barrels(650, [{ side: 'L', ...add(4, 12) }, { side: 'R', ...mul(9, 3) }]),
        enemy(1150, 12, 'Raiders'),
        pickup(1450, 'crystal', 'L'),
        barrels(1750, [{ side: 'L', ...mul(10, 3) }, { side: 'R', ...add(4, 16) }]),
        pickup(2050, 'gold', 'R'),
        enemy(2400, 22, 'Desert Wolves'),
        barrels(2750, [{ side: 'C', ...arrowsUp(4) }]),
        barrels(3150, [{ side: 'L', ...mul(12, 3) }, { side: 'R', ...mul(7, 2) }]),
        enemy(3650, 38, 'War Party'),
        pickup(3950, 'crystal', 'R'),
        barrels(4250, [{ side: 'L', ...add(5, 25) }, { side: 'R', ...mul(13, 2) }]),
        enemy(4750, 52, 'Marauders'),
      ],
      boss: { count: 95, name: 'Desert Warlord', threshold: 75 },
    },
    {
      id: 'm3',
      name: 'Timbuktu — City of Gold',
      blurb: 'Defend the jewel of the empire and its great library at Sankore.',
      startCrowd: 12,
      length: 5700,
      track: [
        barrels(650, [{ side: 'L', ...add(4, 14) }, { side: 'R', ...mul(9, 3) }]),
        enemy(1150, 16, 'Raiders'),
        pickup(1450, 'gold', 'L'),
        barrels(1750, [{ side: 'C', ...arrowsUp(4) }]),
        barrels(2150, [{ side: 'L', ...mul(11, 3) }, { side: 'R', ...add(5, 20) }]),
        enemy(2600, 30, 'War Party'),
        pickup(2900, 'crystal', 'R'),
        // the brief's greedy keg: x10 (hp14, needs a big crowd) vs safe +25 (hp4)
        barrels(3250, [{ side: 'L', ...mul(14, 10) }, { side: 'R', ...add(4, 25) }]),
        enemy(3750, 55, 'Marauders'),
        barrels(4050, [{ side: 'C', ...arrowsUp(5) }]),
        barrels(4450, [{ side: 'L', ...add(6, 30) }, { side: 'R', ...mul(16, 3) }]),
        enemy(4950, 80, 'Horde'),
      ],
      boss: { count: 150, name: 'Sahel Conqueror', threshold: 110 },
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
