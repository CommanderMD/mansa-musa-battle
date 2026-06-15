/*
 * BootScene — generates all procedural textures, sets up shared game state (gold,
 * crystals, unlocked levels, persisted to localStorage), then hands off to the map.
 */
import { buildTextures } from '../systems/textures.js';
import { makeSfx } from '../systems/audio.js';

const SAVE_KEY = 'bxmb_save_v1';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    buildTextures(this);

    // Global, cross-scene state lives on the registry.
    const saved = loadSave();
    this.registry.set('gold', saved.gold);
    this.registry.set('crystals', saved.crystals);
    this.registry.set('unlocked', saved.unlocked); // index of highest unlocked level
    this.registry.set('sfx', makeSfx());
    this.registry.set('save', save);

    this.scene.start('Map');
  }
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { gold: s.gold || 0, crystals: s.crystals || 0, unlocked: s.unlocked || 0 };
    }
  } catch (e) {}
  return { gold: 0, crystals: 0, unlocked: 0 };
}

export function save(registry) {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        gold: registry.get('gold'),
        crystals: registry.get('crystals'),
        unlocked: registry.get('unlocked'),
      })
    );
  } catch (e) {}
}
