/*
 * textures.js — All placeholder art is generated procedurally at boot so the build
 * stays self-contained (no binary assets to ship to Workers static hosting).
 *
 * Readable silhouettes are the priority: player = blue-robed figure with a gold cap,
 * enemy = red raider, plus chests, crystals, gate posts, particles. Swap this module
 * to reskin an era without touching gameplay.
 */
import { PALETTE } from '../config.js';

function figure(g, bodyColor, trimColor, capColor) {
  // 28x40 little marcher with a clear head/body silhouette + shadow.
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(14, 38, 20, 7); // ground shadow
  // body / robe (trapezoid)
  g.fillStyle(bodyColor, 1);
  g.fillTriangle(14, 14, 4, 36, 24, 36);
  g.fillRect(8, 20, 12, 16);
  // trim sash
  g.fillStyle(trimColor, 1);
  g.fillRect(8, 26, 12, 3);
  // head
  g.fillStyle(0x6b4a2a, 1);
  g.fillCircle(14, 11, 6);
  // cap
  g.fillStyle(capColor, 1);
  g.fillEllipse(14, 7, 13, 7);
  g.fillRect(8, 6, 12, 3);
}

export function buildTextures(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Player unit
  figure(g, PALETTE.player, PALETTE.playerTrim, PALETTE.gold);
  g.generateTexture('unit', 28, 42);

  // Enemy unit
  figure(g, PALETTE.enemy, PALETTE.enemyTrim, PALETTE.enemyTrim);
  g.generateTexture('foe', 28, 42);

  // Gold chest
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(20, 30, 30, 8);
  g.fillStyle(PALETTE.goldDeep, 1);
  g.fillRoundedRect(4, 12, 32, 20, 4);
  g.fillStyle(PALETTE.gold, 1);
  g.fillRoundedRect(4, 8, 32, 10, 4);
  g.fillStyle(PALETTE.goldLight, 1);
  g.fillRect(18, 8, 4, 24);
  g.fillStyle(0xfff4cf, 1);
  g.fillCircle(20, 20, 2.5);
  g.generateTexture('chest', 40, 36);

  // Crystal
  g.clear();
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(14, 30, 20, 6);
  g.fillStyle(PALETTE.crystal, 1);
  g.fillTriangle(14, 2, 4, 18, 24, 18);
  g.fillTriangle(4, 18, 24, 18, 14, 30);
  g.fillStyle(0xbff4ff, 0.9);
  g.fillTriangle(14, 2, 9, 18, 14, 18);
  g.generateTexture('crystal', 28, 34);

  // Gate post (a banner pole, one per side of an arch)
  g.clear();
  g.fillStyle(PALETTE.goldDeep, 1);
  g.fillRect(0, 0, 8, 120);
  g.fillStyle(PALETTE.gold, 1);
  g.fillRect(2, 0, 4, 120);
  g.generateTexture('post', 8, 120);

  // Soft round particle (for sparkles / pops)
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(8, 8, 8);
  g.generateTexture('spark', 16, 16);

  // Small square shard (debris / clash)
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 6, 6);
  g.generateTexture('shard', 6, 6);

  // Tree silhouette (acacia-ish) for lane flanks
  g.clear();
  g.fillStyle(PALETTE.greenDeep, 1);
  g.fillRect(13, 22, 6, 20);
  g.fillStyle(PALETTE.green, 1);
  g.fillEllipse(16, 18, 34, 18);
  g.fillStyle(0x4f9460, 1);
  g.fillEllipse(16, 14, 22, 12);
  g.generateTexture('tree', 32, 44);

  // Wooden barrel lying SIDEWAYS (a rolling keg). Horizontal cylinder: staves run left–right
  // along the axis; vertical hoop-bands at the ends + middle. Drawn centered (origin 0.5,0.5)
  // so it can spin to read as rolling. 72×48.
  g.clear();
  const bw = 72, bh = 48;
  // barrel body (rounded horizontal capsule)
  g.fillStyle(0x6e4326, 1);
  g.fillRoundedRect(2, 6, bw - 4, bh - 12, 14);
  // curved-surface shading: lighter band through the middle (catching light)
  g.fillStyle(0x855232, 1);
  g.fillRoundedRect(2, 16, bw - 4, 14, 8);
  g.fillStyle(0x9a6038, 0.7);
  g.fillRect(4, 21, bw - 8, 5);
  // horizontal stave lines
  g.fillStyle(0x4f3018, 0.7);
  for (let i = 0; i < 4; i++) g.fillRect(6, 12 + i * 7, bw - 12, 1.5);
  // vertical hoop bands (ends + middle) — these "roll" as it spins
  g.fillStyle(0x3a2412, 1);
  for (const hx of [8, bw / 2 - 3, bw - 14]) g.fillRect(hx, 5, 6, bh - 10);
  g.fillStyle(0xc9923f, 1); // brass glints on the hoops
  for (const hx of [8, bw / 2 - 3, bw - 14]) g.fillRect(hx, 6, 1.5, bh - 12);
  g.generateTexture('barrel', bw, bh);

  // Arrow (bow shaft + head + fletching), pointing UP. v3: longer + clearer so it reads in
  // flight and a miss is obviously visible. 16x46.
  g.clear();
  g.fillStyle(0x000000, 0.22); // soft edge for contrast on the sand lane
  g.fillRect(6, 8, 4, 34);
  g.fillStyle(0x7a5630, 1); // shaft
  g.fillRect(7, 8, 2, 32);
  g.fillStyle(0xf2ead6, 1); // steel head (bright)
  g.fillTriangle(8, 0, 1, 12, 15, 12);
  g.fillStyle(0xb6831f, 1);
  g.fillTriangle(8, 3, 4, 11, 12, 11);
  g.fillStyle(0xe8462f, 1); // red fletching (reads direction)
  g.fillTriangle(8, 34, 1, 46, 8, 41);
  g.fillTriangle(8, 34, 15, 46, 8, 41);
  g.fillStyle(0xffd7cf, 1);
  g.fillRect(7, 34, 2, 8);
  g.generateTexture('arrow', 16, 46);

  // Dune mound for desert flanks
  g.clear();
  g.fillStyle(PALETTE.sandDark, 1);
  g.fillEllipse(24, 26, 48, 22);
  g.fillStyle(PALETTE.sand, 1);
  g.fillEllipse(24, 22, 44, 18);
  g.generateTexture('dune', 48, 32);

  g.destroy();
}
