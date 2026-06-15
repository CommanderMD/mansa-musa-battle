/*
 * EnemyFormation.js — A streaming-down enemy block (a wave, or the end boss). Owns a
 * logical `count` rendered as packed raider sprites + a floating health bar and a count
 * label. It marches down until it reaches the clash line, then the BattleScene resolves
 * attrition against the crowd. Boss formations are larger and visually flagged.
 */
import { LANE, PALETTE, depthScale, laneHalfWidth } from '../config.js';

export class EnemyFormation {
  constructor(scene, count, label, isBoss = false) {
    this.scene = scene;
    this.count = count;
    this.maxCount = count;
    this.label = label || 'Raiders';
    this.isBoss = isBoss;
    this.y = -60;
    this.centerX = LANE.centerX + Phaser.Math.Between(-30, 30);
    this.units = [];
    this.clashing = false;
    this.dead = false;
    this.t = 0;

    this.layer = scene.add.container(0, 0).setDepth(450);

    // Health bar + count badge
    this.barBg = scene.add.rectangle(0, 0, 120, 12, 0x2a1c0c, 0.85).setOrigin(0.5).setDepth(640);
    this.bar = scene.add.rectangle(0, 0, 116, 8, PALETTE.enemy).setOrigin(0, 0.5).setDepth(641);
    this.badge = scene.add
      .text(0, 0, String(count), {
        fontFamily: 'Georgia, serif',
        fontSize: isBoss ? '40px' : '30px',
        fontStyle: 'bold',
        color: '#ffd7cf',
        stroke: '#3a120b',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(642);
    if (isBoss) {
      this.crown = scene.add
        .text(0, 0, '☠', { fontSize: '26px', color: '#ffd7cf' })
        .setOrigin(0.5)
        .setDepth(642);
    }
    this.sync(true);
  }

  slot(i) {
    const golden = 2.399963;
    const r = (this.isBoss ? 11 : 9) * Math.sqrt(i);
    const a = i * golden;
    return { ox: Math.cos(a) * r, oy: Math.sin(a) * r * 0.5 };
  }

  sync(instant = false) {
    const cap = this.isBoss ? 90 : 70;
    const target = Math.min(this.count, cap);
    while (this.units.length < target) {
      const i = this.units.length;
      const s = this.scene.add.image(0, 0, 'foe').setOrigin(0.5, 0.9);
      s.slot = this.slot(i);
      s.bob = Math.random() * Math.PI * 2;
      if (this.isBoss) s.setTint(0xffc9b8);
      this.layer.add(s);
      this.units.push(s);
    }
    while (this.units.length > target) {
      const s = this.units.pop();
      if (instant) { s.destroy(); continue; }
      this.scene.tweens.add({
        targets: s, scale: 0, alpha: 0, duration: 160, ease: 'Quad.in',
        onComplete: () => s.destroy(),
      });
    }
    this.badge.setText(String(Math.max(0, Math.round(this.count))));
    const pct = Phaser.Math.Clamp(this.count / this.maxCount, 0, 1);
    this.bar.width = 116 * pct;
  }

  takeDamage(n) {
    this.count = Math.max(0, this.count - n);
    this.sync();
    if (this.count <= 0) this.dead = true;
  }

  update(dt, scrollPx) {
    this.t += dt;
    if (!this.clashing) this.y += scrollPx;
    const sc = depthScale(this.y) * (this.isBoss ? 1.25 : 1);
    const baseSc = depthScale(this.y);
    for (const s of this.units) {
      s.bob += dt * 0.01;
      s.x = this.centerX + s.slot.ox * baseSc;
      s.y = this.y + s.slot.oy * baseSc + Math.sin(s.bob) * 1.8;
      s.setScale(baseSc * (this.isBoss ? 1.18 : 1));
      s.setDepth(450 + s.y * 0.1);
    }
    const topY = this.y - 60 * sc;
    this.barBg.setPosition(this.centerX, topY).setScale(Phaser.Math.Clamp(sc, 0.7, 1.3));
    this.bar.setPosition(this.centerX - 58 * Phaser.Math.Clamp(sc, 0.7, 1.3), topY).setScale(Phaser.Math.Clamp(sc, 0.7, 1.3), 1);
    this.badge.setPosition(this.centerX, topY - 24).setScale(Phaser.Math.Clamp(sc, 0.7, 1.2));
    if (this.crown) this.crown.setPosition(this.centerX, topY - 50);
  }

  get reachedClash() { return this.y >= LANE.clashLineY; }

  destroy() {
    this.layer.destroy();
    this.barBg.destroy();
    this.bar.destroy();
    this.badge.destroy();
    if (this.crown) this.crown.destroy();
  }
}
