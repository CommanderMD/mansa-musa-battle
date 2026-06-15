/*
 * Crowd.js — The player's marching column. Owns the logical unit `count`, the visible
 * unit sprites (capped at BALANCE.renderCap), formation packing, steering, the bobbing
 * march animation, weapon tier, and the grow/shrink "pop".
 *
 * The crowd holds a fixed band on screen (LANE.crowdY); the world scrolls past it.
 * Steering only changes centerX. depthScale handles the 2.5D up-close sizing.
 */
import { LANE, BALANCE, PALETTE, depthScale, laneHalfWidth } from '../config.js';
import { Juice } from '../systems/juice.js';

export class Crowd {
  constructor(scene, count) {
    this.scene = scene;
    this.count = count;
    this.centerX = LANE.centerX;
    this.targetX = LANE.centerX;
    this.arrowsPerUnit = 1; // every archer starts firing 1 arrow/shot; weapon barrels raise this
    this.weaponTier = 0; // derived display tier (bow name + arrow color) from arrowsPerUnit
    this.units = []; // sprite pool
    this.t = 0; // time accumulator for bob

    this.layer = scene.add.container(0, 0).setDepth(500);

    // Count badge that floats above the blob.
    this.badge = scene.add
      .text(this.centerX, LANE.crowdY - 64, String(count), {
        fontFamily: 'Georgia, serif',
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#1d3a5c',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(700);

    this.sync(true);
  }

  /* Persistent in-blob offset for unit i. Spiral packing keeps it tidy as it grows. */
  slot(i) {
    const golden = 2.399963; // golden angle → even disk packing
    const r = 9 * Math.sqrt(i);
    const a = i * golden;
    return { ox: Math.cos(a) * r, oy: Math.sin(a) * r * 0.55 };
  }

  /* Reconcile sprite pool with logical count (capped), animating pops. */
  sync(instant = false) {
    const target = Math.min(this.count, BALANCE.renderCap);
    while (this.units.length < target) {
      const i = this.units.length;
      const s = this.scene.add.image(0, 0, 'unit').setOrigin(0.5, 0.9);
      s.slot = this.slot(i);
      s.bob = Math.random() * Math.PI * 2;
      this.layer.add(s);
      this.units.push(s);
      if (!instant) {
        s.setScale(0.1);
        this.scene.tweens.add({ targets: s, scale: 1, duration: 220, ease: 'Back.out' });
      }
    }
    while (this.units.length > target) {
      const s = this.units.pop();
      if (instant) { s.destroy(); continue; }
      this.scene.tweens.add({
        targets: s, scale: 0, alpha: 0, duration: 200, ease: 'Quad.in',
        onComplete: () => s.destroy(),
      });
    }
    this.badge.setText(String(Math.max(0, Math.round(this.count))));
  }

  setTargetX(x) {
    const hw = laneHalfWidth(LANE.crowdY) - 26;
    this.targetX = Phaser.Math.Clamp(x, LANE.centerX - hw, LANE.centerX + hw);
  }

  get alive() { return this.count > 0; }

  /* Apply a barrel reward and play the juice. Returns the new count.
   * CROWD rewards (add/sub/mul) change unit count; WEAPON rewards (op:'arrow')
   * change arrows-per-unit. Firepower = count × arrowsPerUnit, so the two combine. */
  applyOp(op, x, y) {
    if (op.op === 'arrow') { this.applyArrow(op, x, y); return this.count; }

    const before = this.count;
    if (op.op === 'add') this.count += op.v;
    else if (op.op === 'sub') this.count = Math.max(0, this.count - op.v);
    else if (op.op === 'mul') this.count = Math.round(this.count * op.v);

    const good = this.count >= before && op.op !== 'sub';
    const label = op.op === 'add' ? `+${op.v}` : op.op === 'sub' ? `-${op.v}` : `x${op.v}`;
    Juice.popText(this.scene, x, y - 30, label, good ? '#ffe9a8' : '#ff8d7a', 38);
    if (good) {
      Juice.burst(this.scene, this.centerX, LANE.crowdY - 20, PALETTE.goldLight, 18, 220);
      Juice.flash(this.scene, 0xffe9a8, 80, 0.25);
      Juice.punch(this.scene, this.badge, 1.5);
      this.scene.sfx && this.scene.sfx('pop');
    } else if (op.op === 'sub') {
      Juice.burst(this.scene, this.centerX, LANE.crowdY - 20, 0xff6b52, 14, 200);
      Juice.shake(this.scene, 0.004, 120);
    }
    this.sync();
    return this.count;
  }

  /* Weapon barrel: raise arrows-per-unit (add +N or multiply ×N). */
  applyArrow(op, x, y) {
    this.arrowsPerUnit = op.mode === 'mul'
      ? Math.min(BALANCE.maxArrowsPerUnit, this.arrowsPerUnit * op.v)
      : Math.min(BALANCE.maxArrowsPerUnit, this.arrowsPerUnit + op.v);
    this.weaponTier = Phaser.Math.Clamp(Math.round(this.arrowsPerUnit) - 1, 0, BALANCE.weaponTiers.length - 1);
    const color = BALANCE.weaponTiers[this.weaponTier].color;
    const label = op.mode === 'mul' ? `x${op.v} BOWS` : `+${op.v} ARROW`;
    Juice.popText(this.scene, x, y - 30, label, '#9be8ff', 32);
    Juice.popText(this.scene, this.centerX, LANE.crowdY - 74, `${this.arrowsPerUnit}× arrows`, '#bff4ff', 22);
    Juice.burst(this.scene, this.centerX, LANE.crowdY - 20, color, 24, 260);
    Juice.flash(this.scene, color, 110, 0.3);
    this.scene.sfx && this.scene.sfx('weapon');
  }

  /* Remove n units (combat losses) with a poof. */
  takeLosses(n) {
    this.count = Math.max(0, this.count - n);
    this.sync();
    if (this.count > 0) Juice.shake(this.scene, 0.003, 90);
  }

  update(dt) {
    this.t += dt;
    this.centerX = Phaser.Math.Linear(this.centerX, this.targetX, BALANCE.steerLerp);
    const sc = depthScale(LANE.crowdY);
    for (const s of this.units) {
      s.bob += dt * 0.012;
      const bob = Math.sin(s.bob) * 2.2;
      s.x = this.centerX + s.slot.ox * sc;
      s.y = LANE.crowdY + s.slot.oy * sc + bob;
      s.setScale(sc);
      s.setDepth(500 + s.y * 0.1);
    }
    this.badge.x = this.centerX;
    this.badge.y = LANE.crowdY - 58 - Math.min(40, Math.sqrt(this.count) * 4);
  }

  destroy() {
    this.layer.destroy();
    this.badge.destroy();
  }
}
