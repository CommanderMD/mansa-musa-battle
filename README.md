# Black Excellence: Multiplier Battle
### Chapter 1 — The Golden Age of Mali · Anchor: Mansa Musa

A mobile-portrait **2.5D "archery march" lane auto-battler** in the spirit of crowd-army
clash games. Steer a marching column of Mali archers up a receding lane; they auto-loose
**arrow volleys** at **destructible reward barrels** rolling toward you — shoot a barrel's
HP to zero before it reaches the column to grow your army (greedy high-HP kegs vs safe ones
is the core choice). Smash through raider waves, grab gold and crystals, and beat the boss
formation at the lane's end. Win a level and you unlock a historically accurate
**dossier** on Mansa Musa, with a "Read more" link to the live
[Black Achievement Digital Museum](https://black-achievement-museum.ericarmstrong.workers.dev).

Built as a **self-contained static site** (Phaser 3 from CDN, all art generated procedurally
at runtime — zero binary assets), so it deploys cleanly on Cloudflare Workers static assets.

> The 2.5D look = flat placeholder art + perspective scaling + a painted receding lane.
> Not top-down, not real 3D.

---

## Controls

| Input | Action |
| --- | --- |
| **Drag** (touch or mouse, anywhere) | Steer the whole crowd left/right |
| (automatic) | The crowd auto-fires arrow volleys at the **nearest** barrel — steer to choose which one |
| **PLAY / CONTINUE / RETRY** buttons | Navigate menus |

**v3 — aim by alignment:** arrows now fire **straight up** from the crowd (no auto-homing).
A barrel is only hit if your arrows actually **overlap its x-position** as they pass — so you
must steer the crowd to **line up under** the keg you want. Misaligned arrows visibly sail past
and off the top. A wider/bigger army sprays more arrows (and helps), but **alignment is the skill**.

The column auto-advances and auto-shoots; you control **which barrel your archers focus** (by
lining up under it).
Each barrel shows two numbers: a **hit-count (HP)** that ticks down as arrows bite, and a
**reward**. There are **two barrel types**:

- **CROWD kegs** (gold/green) — grow the army: default **x4** (also `x2`, `x3`, `+N`).
- **WEAPON kegs** (blue, `WEAPON+`) — advance the weapon: **SPREAD** `1 → 2 → 3 arrows` per
  unit, then (once maxed) **FIRE RATE** — `RAPID I → II → III`. You start at **1 soldier, 1 arrow**.

**Total DPS = soldiers × spread × fire-rate.** A keg PAIR is an exclusive choice — break one and
the other is dismissed. Each choice is **telegraphed**: its counter-wave is visible up the lane in
the distance, so read the incoming count/shape before committing. Waves come in shapes:
**wide walls** (need soldiers/coverage) and **deep columns** (need DPS/fire-rate). Early on, bodies
matter most (1 soldier can't out-shoot 12 — take the x4); pick wrong for the incoming wave and the
survivors crash in and **overrun you 1-for-1**. Power grows exponentially, so once you snowball you
steamroll — the hard reads are early.

### The loop
1. **World map** — pick an unlocked node, press the gold **PLAY** button.
2. **Battle** — shoot down reward barrels — gold **crowd kegs** (`x3 +25` units) and blue
   **weapon kegs** (`🏹x2` arrows/unit) — grab gold chests + crystals, and clash with enemy
   waves (top-center counter = enemy strength).
3. **Enemies are killed by your arrows** (v3) — waves advance down the lane as targets;
   line up under them and your volleys delete them (each raider takes 1–2 hits). Any survivors
   that reach your column collide and remove an **equal number of your units (1-for-1)**. So
   out-DPS the wave before contact, or get gutted. Effective DPS = units × arrows-per-unit ×
   fire-rate, and it only lands where you're aligned.
4. **Boss** — just a very large enemy block: out-DPS it before contact, or get crushed.
4. **Victory** — winged banner, reward tiles, and a Mansa Musa dossier card. The next level
   unlocks. **Defeat** — retry.

Progress (gold, crystals, unlocked levels) is saved to `localStorage`.

---

## Run locally

It's a static site — any static server works:

```bash
# option A: wrangler (matches production)
npx wrangler dev

# option B: any static server
npx serve public
# or
python3 -m http.server -d public 8000
```

Then open the printed URL. (Opening `index.html` via `file://` will not work because it
uses ES modules — serve it over HTTP.)

---

## Deploy (Cloudflare Workers static assets)

This repo is wired for the TechSmart pipeline (Workers static assets + GitHub auto-deploy).

```bash
npx wrangler deploy
```

…or **double-click `DEPLOY.command`** (it runs `wrangler login` then `wrangler deploy`).
Live URL: `https://mansa-musa-battle.<account-subdomain>.workers.dev`.

For GitHub auto-deploy, connect the repo in the Cloudflare dashboard → Workers & Pages →
Create → Import a repository → keep the deploy command `npx wrangler deploy`. Set the
Cloudflare project name to **`mansa-musa-battle`** (match the worker name).

---

## Project structure

```
mansa-musa-battle/
├── wrangler.jsonc            # Workers static-assets config (serves ./public)
├── package.json              # wrangler dev/deploy scripts
├── DEPLOY.command            # double-click publish helper
└── public/
    ├── index.html            # mobile-portrait shell, loads Phaser (CDN) + main.js
    └── src/
        ├── main.js           # Phaser bootstrap + scene graph
        ├── config.js         # ALL tuning: palette, lane geometry, balance numbers
        ├── data/
        │   └── chapters.js   # Chapter-1 levels (the "track": barrels/enemies/pickups), + dossier
        ├── systems/
        │   ├── textures.js   # procedural placeholder art (archers, barrels, arrows, chests…)
        │   ├── Lane.js       # painted 2.5D backdrop + scrolling flank props
        │   ├── juice.js      # shake, flash, particle bursts, pop text, scale punch
        │   └── audio.js      # zero-asset WebAudio sfx (incl. bow twang / barrel smash)
        ├── entities/
        │   ├── Crowd.js          # archer column: count, formation, steering, bow tier, pops
        │   ├── Barrel.js         # destructible reward kegs (HP + reward, descend & smash)
        │   ├── EnemyFormation.js # enemy waves + boss (health bars, counters)
        │   └── Pickup.js         # gold chests + crystals
        └── scenes/
            ├── BootScene.js   # build textures, load save, init state
            ├── MapScene.js    # parchment Mali world map / level select
            ├── BattleScene.js # the core multiplier-march loop (orchestrator)
            └── ResultScene.js # victory (banner + dossier) / defeat (retry)
```

**Design intent:** `config.js` + `data/chapters.js` hold everything content/balance; the
scenes and entities are the reusable engine. Art lives in `systems/textures.js`. Game feel
lives in `systems/juice.js`.

---

## Adding the other four eras (and a Flutter/Unity port)

The engine is data-driven so the remaining chapters slot in with no scene changes:

1. **Add a chapter** in `src/data/chapters.js` following the `CHAPTER1` shape:
   - `levels[]` each with a `track` (a distance-ordered list of `barrels` / `enemy` /
     `pickup` events), a `boss`, `startCrowd`, and `length`. A `barrels` event holds 1–2
     kegs `{ side, hp, reward }`; pairs create the greedy-vs-safe choice.
   - a `DOSSIER`-style object with **accurate, sourced** facts for that era's anchor figure.
2. **Reskin the palette** in `config.js` (`PALETTE`) and the art in `systems/textures.js`
   (e.g. different robes, terrain props). The lane geometry and feel carry over.
3. **Register** the chapter and add its nodes to `MapScene` (or generalize the map to read a
   `CHAPTERS` array — left as the natural next refactor).

Because gameplay, content, and art are cleanly separated, a **Flutter (Flame)** or **Unity**
port can mirror the same module boundaries: a `Lane` renderer, a `Crowd` actor, gate/enemy/
pickup entities, and a data layer that reads the same chapter/track JSON. Keep `chapters.js`
as the canonical content source and export it to JSON for the native ports.

---

## Content & rights

- All art is **original / procedurally generated** placeholder art. No third-party game art,
  logos, names, or UI are used — visual-style references only.
- Historical content about Mansa Musa and the Mali Empire is kept **accurate and respectful**
  (reign c. 1312–1337, the 1324 pilgrimage to Mecca, Timbuktu/Sankore as a center of learning,
  his legendary wealth). Deeper reading links to the live Black Achievement Digital Museum.

Part of the **Black Excellence** series · TechSmart Inc.
