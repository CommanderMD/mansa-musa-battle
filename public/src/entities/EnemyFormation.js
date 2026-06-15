/*
 * EnemyFormation.js — A wave (or the boss) of raiders advancing DOWN the lane as TARGETS.
 *
 * v3 combat: your straight-up arrows kill them on x-overlap (each enemy = `hpPerEnemy` hits,
 * 1–3). The block keeps advancing; whatever survives to your column collides and removes an
 * EQUAL number of your units (1-for-1). So: out-DPS the wave before contact, or get gutted.
 * The boss is just a very large block. Spawns at a lane side so you must steer to mow it.
 */
import { LANE, PALETTE, BALANCE, depthScale, laneHalfWidth } from '../config.js';

export class EnemyFormation {
  constructor(scene, count, label, isBoss = false, side = 'C', y0 = -60) {
    this.scene = scene;
    this.count = count;
    this.maxCount = count;
    this.hpPerEnemy = isBoss ? 3 : BALANCE.enemyHpPerUnit; // arrow hits to kill one raider
    this.hp = count * this.hpPerEnemy;
    this.label = label || 'Raiders';
    this.isBoss = isBoss;
    this.side = side;
    this.y = y0; // clusters stagger by starting higher up the lane
    this.units = [];
    this.dead = false;
    this.t = 0;

    this.layer = scene.add.container(0, 0).setDepth(450);

    this.barBg = scene.add.rectangle(0, 0, 120, 12, 0x2a1c0c, 0.85).setOrigin(0.5).setDepth(640);
    this.bar = scene.add.rectangle(0, 0, 116, 8, PALETTE.enemy).setOrigin(0, 0.5).setDepth(641);
    this.badge = scene.add
      .text(0, 0, String(count), {
        fontFamily: 'Georgia, serif', fontSize: isBoss ? '40px' : '30px', fontStyle: 'bold',
        color: '#ffd7cf', stroke: '#3a120b', strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(642);
    if (isBoss) {
      this.crown = scene.add.text(0, 0, '☠', { fontSize: '26px', color: '#ffd7cf' }).setOrigin(0.5).setDepth(642);
    }
    this.sync(true);
  }

  /* Lane x for this block's side at its current depth (so you steer to align under it). */
  get centerX() {
    const half = laneHalfWidth(this.y);
    if (this.side === 'L') return LANE.centerX - half * 0.40;
    if (this.side === 'R') return LANE.centerX + half * 0.40;
    return LANE.centerX;
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
      this.scene.tweens.add({ targets: s, scale: 0, alpha: 0, duration: 140, ease: 'Quad.in', onComplete: () => s.destroy() });
    }
    this.badge.setText(String(Math.max(0, Math.round(this.count))));
    this.bar.width = 116 * Phaser.Math.Clamp(this.count / this.maxCount, 0, 1);
  }

  /* Arrow hit-zone — wider for bigger blocks, so a huge wave outspans your spray and some
   * flank raiders always survive to contact (the boss can't be perfectly cleared). */
  get hitRowY() { return this.y - 30 * depthScale(this.y); }
  get hitHalfX() {
    const cnt = Math.min(this.count, this.isBoss ? 90 : 70);
    return (10 + 6.5 * Math.sqrt(cnt)) * depthScale(this.y) + 6;
  }

  /* An arrow kills `power` raiders (each costs hpPerEnemy hits). */
  takeHit(power) {
    if (this.dead) return;
    this.hp -= power;
    const newCount = Math.max(0, Math.ceil(this.hp / this.hpPerEnemy));
    if (newCount < this.count) this.count = newCount;
    this.sync();
    if (this.hp <= 0) { this.count = 0; this.dead = true; }
  }

  update(dt, scrollPx) {
    this.t += dt;
    this.y += scrollPx; // always advancing — no melee stop
    const cx = this.centerX;
    const baseSc = depthScale(this.y);
    for (const s of this.units) {
      s.bob += dt * 0.01;
      s.x = cx + s.slot.ox * baseSc;
      s.y = this.y + s.slot.oy * baseSc + Math.sin(s.bob) * 1.8;
      s.setScale(baseSc * (this.isBoss ? 1.18 : 1));
      s.setDepth(450 + s.y * 0.1);
    }
    const sc = baseSc * (this.isBoss ? 1.25 : 1);
    const topY = this.y - 60 * sc;
    const bsc = Phaser.Math.Clamp(sc, 0.7, 1.3);
    this.barBg.setPosition(cx, topY).setScale(bsc);
    this.bar.setPosition(cx - 58 * bsc, topY).setScale(bsc, 1);
    this.badge.setPosition(cx, topY - 24).setScale(Phaser.Math.Clamp(sc, 0.7, 1.2));
    if (this.crown) this.crown.setPosition(cx, topY - 50);
  }

  get reachedCrowd() { return this.y >= LANE.crowdY - 6; }

  destroy() {
    this.layer.destroy();
    this.barBg.destroy();
    this.bar.destroy();
    this.badge.destroy();
    if (this.crown) this.crown.destroy();
  }
}
