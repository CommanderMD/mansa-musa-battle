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

  // Dune mound for desert flanks
  g.clear();
  g.fillStyle(PALETTE.sandDark, 1);
  g.fillEllipse(24, 26, 48, 22);
  g.fillStyle(PALETTE.sand, 1);
  g.fillEllipse(24, 22, 44, 18);
  g.generateTexture('dune', 48, 32);

  g.destroy();
}
