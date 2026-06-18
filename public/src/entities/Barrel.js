/*
 * Barrel.js — A destructible reward keg that rolls DOWN the lane toward the crowd.
 *
 * Shows two numbers: HP (arrow hits left to destroy it, ticks down as arrows bite) and a
 * REWARD label (x10 / x2 / +25 / WEAPON+) applied to the crowd when it breaks. Destroy it
 * with arrows BEFORE it reaches the crowd → reward fires. If it reaches the crowd alive, it
 * smashes into them and costs units.
 *
 * v6 — NON-EXCLUSIVE POSITIONAL CHOICE: kegs spawn in a well-separated pair with a real
 * middle channel between them. Breaking one no longer dismisses the other — the un-chosen
 * keg keeps rolling on. If the player lingers in front of it and fails to break it in time,
 * it crashes into the column and costs units (risk-based choice, not an auto-dismiss).
 * Kegs lie HORIZONTAL (across the lane) and roll-wobble toward the player.
 *
 * The scene owns reward/chip application (it has the crowd + juice); this entity owns its
 * HP, art, descent, perspective scaling, and hit feedback.
 */
import { LANE, PALETTE, depthScale, laneHalfWidth, hex } from '../config.js';
import { Juice } from '../systems/juice.js';

// v6 keg tuning.
const BARREL_SCALE = 2.2; // sprite size factor (× perspective)
const HIT_CORE = 26; // x half-width of the hittable CORE (smaller than the big sprite) so a
//                      centered shot can't straddle a separated pair — you must steer onto one
const SEP_FACTOR = 0.74; // v6: how far L/R kegs sit from lane center (× lane half-width). Wider
//                          than v5 (0.52) so the pair NEVER overlaps and leaves a real middle lane
//                          (center channel) for enemies to walk down.
const ROLL_SPEED = 0.0026; // radians/ms — roll cadence driving the horizontal-roll wobble
const BASE_ROT = Math.PI / 2; // lie the keg ACROSS the lane (horizontal), rolling toward player

// Weapon barrels (op:'arrow') read blue/crystal with an arrow icon; crowd barrels read
// gold/green — so the two upgrade paths are instantly distinguishable on the lane.
const isWeapon = (r) => r.op === 'arrow';
const rewardColor = (r) =>
  isWeapon(r) ? PALETTE.crystal : r.op === 'mul' ? PALETTE.green : PALETTE.gold;
const rewardLabel = (r) =>
  isWeapon(r) ? 'WEAPON+' : r.op === 'mul' ? `x${r.v}` : `+${r.v}`;

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
    this.sibling = null; // the other keg in the pair (kept linked for reference only — v6 no auto-dismiss)

    this.isWeapon = isWeapon(reward);
    this.roll = 0;
    this.baseRot = BASE_ROT; // horizontal orientation
    // Sideways keg, centered origin so it can roll-wobble as it travels.
    this.sprite = scene.add.image(0, 0, 'barrel').setOrigin(0.5, 0.5).setDepth(330);
    this.sprite.setRotation(this.baseRot);
    if (this.isWeapon) this.sprite.setTint(0x6fb6d6); // steel-blue armory keg

    // Reward banner on the body.
    this.rewardTxt = scene.add
      .text(0, 0, rewardLabel(reward), {
        fontFamily: 'Georgia, serif', fontSize: this.isWeapon ? '15px' : '17px', fontStyle: 'bold',
        color: this.isWeapon ? '#dff6ff' : '#fff', stroke: hex(PALETTE.ink), strokeThickness: 4,
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

  /* Current lane X for this keg's side at its current depth — L/R sit well apart (wide gap). */
  get x() {
    const half = laneHalfWidth(this.y);
    if (this.side === 'L') return LANE.centerX - half * SEP_FACTOR;
    if (this.side === 'R') return LANE.centerX + half * SEP_FACTOR;
    return LANE.centerX;
  }

  /* `power` arrow hits bite the keg (each shown arrow carries the column's punch). */
  hit(power = 1) {
    if (this.dead) return false;
    this.hp = Math.max(0, this.hp - power);
    this.hpTxt.setText(String(this.hp));
    Juice.punch(this.scene, this.hpBg, 1.3, 90);
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(40, () => {
      if (!this.sprite) return;
      if (this.isWeapon) this.sprite.setTint(0x6fb6d6); else this.sprite.clearTint();
    });
    Juice.burst(this.scene, this.x, this.y, 0xcaa15a, 5, 110);
    if (this.hp <= 0) { this.dead = true; return true; }
    return false;
  }

  update(dt, scrollPx) {
    this.y += scrollPx;
    this.roll += dt * ROLL_SPEED; // rolling spin drives the horizontal-roll wobble
    const sc = depthScale(this.y) * BARREL_SCALE;
    const x = this.x;
    const labelSc = Phaser.Math.Clamp(depthScale(this.y) * 1.25, 0.7, 1.4);
    const topOff = 42 * depthScale(this.y); // above the big keg
    // v6: keep it HORIZONTAL (baseRot) with a subtle wobble + squash so it reads as a sideways
    // barrel ROLLING toward the player, not spinning end-over-end.
    const wob = Math.sin(this.roll) * 0.07;
    const squash = 1 + Math.cos(this.roll) * 0.06;
    this.sprite.setPosition(x, this.y).setScale(sc, sc * squash)
      .setRotation(this.baseRot + wob).setDepth(330 + this.y * 0.1);
    this.rewardTxt.setPosition(x, this.y).setScale(labelSc).setDepth(335 + this.y * 0.1);
    this.hpBg.setPosition(x, this.y - topOff).setScale(labelSc);
    this.hpTxt.setPosition(x, this.y - topOff).setScale(labelSc);
  }

  /* v5 hit-test: an arrow connects only if it crosses the keg's mid-row within the CORE half-
   * width (much smaller than the big sprite) — so steering onto one keg of a pair is required. */
  get hitRowY() { return this.y; }
  get hitHalfX() { return HIT_CORE * depthScale(this.y) + 5; }

  get reachedCrowd() { return this.y >= LANE.crowdY - 8; }

  destroy() {
    this.sprite.destroy();
    this.rewardTxt.destroy();
    this.hpBg.destroy();
    this.hpTxt.destroy();
  }
}
