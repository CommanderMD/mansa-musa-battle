/*
 * Pickup.js — Gold chests and crystals along the lane (Mali's wealth theme). Collected
 * by steering the crowd over them; gold adds score, crystals add the premium currency.
 * Both give a tiny crowd bonus so grabbing them feels rewarding, not just cosmetic.
 */
import { LANE, PALETTE, depthScale, laneHalfWidth } from '../config.js';
import { Juice } from '../systems/juice.js';

export class Pickup {
  constructor(scene, kind, side) {
    this.scene = scene;
    this.kind = kind; // 'gold' | 'crystal'
    this.y = -30;
    // Offset to a flank-ish lane position so the player must steer to grab it.
    const half = laneHalfWidth(LANE.crowdY);
    this.laneOffset = (side === 'L' ? -1 : 1) * half * 0.45;
    this.sprite = scene.add.image(0, 0, kind === 'gold' ? 'chest' : 'crystal').setOrigin(0.5, 0.85).setDepth(360);
    this.spark = Juice.sparkle(scene, 0, 0, kind === 'gold' ? PALETTE.goldLight : PALETTE.crystal);
    this.collected = false;
    this.done = false;
  }

  update(dt, scrollPx, crowd) {
    this.y += scrollPx;
    const sc = depthScale(this.y);
    const half = laneHalfWidth(this.y);
    const x = LANE.centerX + (this.laneOffset / laneHalfWidth(LANE.crowdY)) * half;
    this.sprite.setPosition(x, this.y).setScale(sc).setDepth(360 + this.y * 0.1);
    if (this.spark) this.spark.setPosition(x, this.y - 14 * sc);

    if (!this.collected && Math.abs(this.y - LANE.crowdY) < 26 && Math.abs(x - crowd.centerX) < 40) {
      this.collect(x);
    }
    if (this.y > LANE.baseY + 80) this.done = true;
  }

  collect(x) {
    this.collected = true;
    if (this.kind === 'gold') {
      this.scene.addGold(25);
      crowdBonus(this.scene, 2);
      Juice.popText(this.scene, x, this.y - 30, '+25 Gold', '#ffe9a8', 24);
      Juice.burst(this.scene, x, this.y, PALETTE.goldLight, 16, 200);
    } else {
      this.scene.addCrystals(1);
      crowdBonus(this.scene, 3);
      Juice.popText(this.scene, x, this.y - 30, '+1 Crystal', '#bff4ff', 24);
      Juice.burst(this.scene, x, this.y, PALETTE.crystal, 16, 200);
    }
    if (this.spark) { const sp = this.spark; sp.stop(); this.scene.time.delayedCall(600, () => sp.destroy()); this.spark = null; }
    this.scene.tweens.add({
      targets: this.sprite, y: this.y - 40, alpha: 0, scale: this.sprite.scaleX * 1.4,
      duration: 300, onComplete: () => { this.sprite.destroy(); this.done = true; },
    });
  }

  destroy() {
    this.sprite.destroy();
    if (this.spark) this.spark.destroy();
  }
}

function crowdBonus(scene, n) {
  if (scene.crowd) { scene.crowd.count += n; scene.crowd.sync(); }
}
