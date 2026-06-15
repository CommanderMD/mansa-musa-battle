/*
 * main.js — Phaser bootstrap. Loads the scene graph and starts the game in a mobile
 * portrait canvas that FIT-scales to any screen. Phaser itself is loaded as a global
 * from the CDN in index.html (this file is an ES module that reads window.Phaser).
 */
import { GAME_W, GAME_H, PALETTE } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MapScene } from './scenes/MapScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { ResultScene } from './scenes/ResultScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#' + PALETTE.skyTop.toString(16),
  width: GAME_W,
  height: GAME_H,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: { antialias: true, roundPixels: false },
  scene: [BootScene, MapScene, BattleScene, ResultScene],
};

// eslint-disable-next-line no-new
window.game = new Phaser.Game(config);

// Remove the loading splash once Phaser is up.
const splash = document.getElementById('splash');
if (splash) splash.style.display = 'none';
