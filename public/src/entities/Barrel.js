/*
 * Barrel.js — A destructible reward keg that rolls DOWN the lane toward the crowd.
 *
 * Shows two numbers: HP (arrow hits left to destroy it, ticks down as arrows bite) and a
 * REWARD label (x10 / x2 / +25 / ARROWS+) applied to the crowd when it breaks. Destroy it
 * with arrows BEFORE it reaches the crowd → reward fires (the multiply pop). If it reaches
 * the crowd alive, it smashes into them and costs units. Barrels spawn singly or in pairs
 * (steer to choose which to focus); the un-focused one chips you — the greedy-vs-safe core.
 *
 * The scene owns reward/chip application (it has the crowd + juice); this entity owns its
 * HP, art, descent, perspective scaling, and hit feedback.
 */
import { LANE, PALETTE, depthScale, laneHalfWidth, hex } from '../config.js';
import { Juice } from '../systems/juice.js';

const rewardColor = (r) =>
  r.op === 'weapon' ? PALETTE.crystal : r.op === 'mul' ? PALETTE.green : PALETTE.gold;
const rewardLabel = (r) =>
  r.op === 'weapon' ? 'ARROWS+' : r.op === 'mul' ? `x${r.v}` : `+${r.v}`;

export class Barrel {
  constructor(scene, side, hp, reward) {
    this.scene = scene;
    this.side = side; // 'L' | 'C' | 'R'
    this.hp = hp;
    this.hpMax = hp;
    this.reward = reward;
    this.y = -50;
    this.dead = false;
    this.done = false;
    this.rewarded = false;

    this.sprite = scene.add.image(0, 0, 'barrel').setOrigin(0.5, 0.85).setDepth(330);

    // Reward banner on the body.
    this.rewardTxt = scene.add
      .text(0, 0, rewardLabel(reward), {
        fontFamily: 'Georgia, serif', fontSize: '17px', fontStyle: 'bold',
        color: '#fff', stroke: hex(PALETTE.ink), strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(332);

    // HP chip above the barrel.
    this.hpBg = scene.add.circle(0, 0, 15, rewardColor(reward), 0.95).setStrokeStyle(2.5, PALETTE.ink).setDepth(333);
    this.hpTxt = scene.add
      .text(0, 0, String(hp), {
        fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'bold',
        color: '#fff', stroke: hex(PALETTE.ink), strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(334);
  }

  /* Current lane X for this barrel's side at its current depth. */
  get x() {
    const half = laneHalfWidth(this.y);
    if (this.side === 'L') return LANE.centerX - half * 0.42;
    if (this.side === 'R') return LANE.centerX + half * 0.42;
    return LANE.centerX;
  }

  /* One arrow bites the barrel. Returns true if this hit destroyed it. */
  hit() {
    if (this.dead) return false;
    this.hp -= 1;
    this.hpTxt.setText(String(Math.max(0, this.hp)));
    Juice.punch(this.scene, this.hpBg, 1.3, 90);
    this.scene.tweens.add({ targets: this.sprite, x: this.sprite.x + Phaser.Math.Between(-2, 2), duration: 40, yoyo: true });
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(40, () => this.sprite && this.sprite.clearTint());
    Juice.burst(this.scene, this.sprite.x, this.y - 20 * depthScale(this.y), 0xcaa15a, 4, 90);
    if (this.hp <= 0) { this.dead = true; return true; }
    return false;
  }

  update(dt, scrollPx) {
    this.y += scrollPx;
    const sc = depthScale(this.y) * 1.15;
    const x = this.x;
    this.sprite.setPosition(x, this.y).setScale(sc).setDepth(330 + this.y * 0.1);
    this.rewardTxt.setPosition(x, this.y - 22 * sc).setScale(Phaser.Math.Clamp(sc, 0.7, 1.2));
    this.hpBg.setPosition(x, this.y - 48 * sc).setScale(Phaser.Math.Clamp(sc, 0.7, 1.2));
    this.hpTxt.setPosition(x, this.y - 48 * sc).setScale(Phaser.Math.Clamp(sc, 0.7, 1.2));
  }

  get reachedCrowd() { return this.y >= LANE.crowdY - 8; }

  destroy() {
    this.sprite.destroy();
    this.rewardTxt.destroy();
    this.hpBg.destroy();
    this.hpTxt.destroy();
  }
}
