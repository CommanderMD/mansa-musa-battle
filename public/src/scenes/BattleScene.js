/*
 * BattleScene — the core "archery march" loop.
 *
 * Flow: the lane scrolls toward a fixed crowd band of Mali archers. A distance-ordered
 * track streams down DESTRUCTIBLE REWARD BARRELS, enemy waves, and pickups. The player
 * drags to steer the whole crowd; the crowd auto-looses ARROW volleys (more units + higher
 * bow tier = more arrows, faster) at the nearest barrel. Shoot a barrel's HP to zero before
 * it reaches you → its reward (x10 / +25 / ARROWS+) grows the army. A barrel that reaches the
 * column alive smashes in and costs units. Enemy waves clash via attrition (rendered as
 * arrow volleys); a boss caps the level. Win = boss defeated; lose = crowd hits zero.
 *
 * Visual/feel work is delegated to Lane / Crowd / Barrel / EnemyFormation / Pickup / Juice
 * so this scene stays a readable orchestrator.
 */
import { GAME_W, GAME_H, LANE, PALETTE, BALANCE, hex, depthScale } from '../config.js';
import { CHAPTER1 } from '../data/chapters.js';
import { Lane } from '../systems/Lane.js';
import { Crowd } from '../entities/Crowd.js';
import { Barrel } from '../entities/Barrel.js';
import { EnemyFormation } from '../entities/EnemyFormation.js';
import { Pickup } from '../entities/Pickup.js';
import { Juice } from '../systems/juice.js';

export class BattleScene extends Phaser.Scene {
  constructor() { super('Battle'); }

  create(data) {
    this.levelIndex = data.levelIndex || 0;
    this.level = CHAPTER1.levels[this.levelIndex];
    this.sfx = this.registry.get('sfx');

    this.dist = 0;
    this.trackPtr = 0;
    this.bossSpawned = false;
    this.over = false;
    this.goldEarned = 0;
    this.crystalsEarned = 0;
    this.barrels = [];
    this.enemies = [];
    this.pickups = [];
    this.arrows = [];
    this.clashTimer = 0;
    this.fireTimer = 9999; // ready to fire the instant a barrel appears

    this.lane = new Lane(this);
    this.crowd = new Crowd(this, this.level.startCrowd);

    this._hud();
    this._input();
    this._banner('GET READY', PALETTE.goldLight);

    // brief lead-in before things stream
    this.startDelay = 700;
  }

  /* ---- input: drag (touch + mouse) steers the whole crowd ---- */
  _input() {
    this.input.on('pointerdown', (p) => { this.dragging = true; this.crowd.setTargetX(p.x); });
    this.input.on('pointermove', (p) => { if (this.dragging || p.isDown) this.crowd.setTargetX(p.x); });
    this.input.on('pointerup', () => { this.dragging = false; });
  }

  /* ---- HUD: top-center threat counter, progress, currency, bow tier ---- */
  _hud() {
    this.add.rectangle(GAME_W / 2, 26, GAME_W, 52, PALETTE.ink, 0.55).setDepth(800).setScrollFactor(0);

    this.threatBg = this.add.circle(GAME_W / 2, 30, 26, PALETTE.enemy, 0.9).setStrokeStyle(3, 0x3a120b).setDepth(801);
    this.threatTxt = this.add.text(GAME_W / 2, 30, '—', {
      fontFamily: 'Georgia, serif', fontSize: '26px', fontStyle: 'bold', color: '#fff',
      stroke: '#3a120b', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(802);
    this.add.text(GAME_W / 2, 56, 'ENEMIES', { fontFamily: 'Georgia, serif', fontSize: '9px', color: '#ffd7cf' }).setOrigin(0.5).setDepth(802);

    this.armyTxt = this.add.text(14, 18, '🏹 8', { fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'bold', color: hex(PALETTE.goldLight) }).setDepth(802);
    this.weaponTxt = this.add.text(14, 40, 'Short Bows', { fontFamily: 'Georgia, serif', fontSize: '11px', color: hex(PALETTE.crystal) }).setDepth(802);

    this.goldTxt = this.add.text(GAME_W - 14, 16, `🪙 ${this.registry.get('gold')}`, { fontFamily: 'Georgia, serif', fontSize: '14px', color: hex(PALETTE.goldLight) }).setOrigin(1, 0).setDepth(802);
    this.crysTxt = this.add.text(GAME_W - 14, 36, `💎 ${this.registry.get('crystals')}`, { fontFamily: 'Georgia, serif', fontSize: '14px', color: hex(0xbff4ff) }).setOrigin(1, 0).setDepth(802);

    this.add.rectangle(GAME_W / 2, GAME_H - 8, GAME_W - 24, 8, 0x000000, 0.4).setDepth(800);
    this.progBar = this.add.rectangle(12, GAME_H - 8, 2, 8, PALETTE.gold).setOrigin(0, 0.5).setDepth(801);

    const back = this.add.text(GAME_W - 14, GAME_H - 26, '⏏ Map', { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#fff', backgroundColor: 'rgba(42,28,12,0.6)', padding: { x: 6, y: 3 } })
      .setOrigin(1, 1).setDepth(805).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('Map'));
  }

  addGold(n) { this.goldEarned += n; this.registry.set('gold', this.registry.get('gold') + n); this.goldTxt.setText(`🪙 ${this.registry.get('gold')}`); this.sfx('coin'); }
  addCrystals(n) { this.crystalsEarned += n; this.registry.set('crystals', this.registry.get('crystals') + n); this.crysTxt.setText(`💎 ${this.registry.get('crystals')}`); this.sfx('coin'); }

  _banner(text, color, sub) {
    const c = this.add.container(GAME_W / 2, GAME_H * 0.4).setDepth(870);
    const t = this.add.text(0, 0, text, { fontFamily: 'Georgia, serif', fontSize: '46px', fontStyle: 'bold', color: hex(color), stroke: '#2a1c0c', strokeThickness: 7 }).setOrigin(0.5);
    c.add(t);
    if (sub) c.add(this.add.text(0, 40, sub, { fontFamily: 'Georgia, serif', fontSize: '16px', color: '#fff', stroke: '#2a1c0c', strokeThickness: 4 }).setOrigin(0.5));
    c.setScale(0.4); c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, scale: 1, duration: 280, ease: 'Back.out' });
    this.tweens.add({ targets: c, alpha: 0, scale: 1.3, duration: 360, delay: 900, ease: 'Quad.in', onComplete: () => c.destroy() });
  }

  /* ---- spawn from the track as the lane advances ---- */
  _spawnUpTo(dist) {
    const tr = this.level.track;
    while (this.trackPtr < tr.length && tr[this.trackPtr].dist <= dist) {
      const e = tr[this.trackPtr++];
      if (e.type === 'barrels') {
        for (const it of e.items) this.barrels.push(new Barrel(this, it.side, it.hp, it.reward));
      } else if (e.type === 'enemy') {
        this.enemies.push(new EnemyFormation(this, e.count, e.label, !!e.boss));
        this.sfx('clash');
      } else if (e.type === 'pickup') {
        this.pickups.push(new Pickup(this, e.kind, e.side));
      }
    }
    if (!this.bossSpawned && dist >= this.level.length) {
      this.bossSpawned = true;
      const b = this.level.boss;
      this.enemies.push(new EnemyFormation(this, b.count, b.name, true));
      this._banner('FINAL STAND', PALETTE.enemy, b.name);
      this.sfx('clash');
    }
  }

  /* ---- archery: pick the nearest barrel (steer to choose) and loose volleys ---- */
  _fireTarget() {
    const live = this.barrels.filter((b) => !b.dead && !b.done && b.y > LANE.topY - 10);
    if (!live.length) return null;
    live.sort((a, b) =>
      Math.abs(a.x - this.crowd.centerX) - Math.abs(b.x - this.crowd.centerX) || b.y - a.y);
    return live[0];
  }

  _fireParams() {
    const f = BALANCE.fire, c = this.crowd.count, t = this.crowd.weaponTier;
    const interval = Phaser.Math.Clamp(f.baseInterval - c * f.intervalPerUnit - t * f.intervalPerTier, f.minInterval, f.baseInterval);
    const arrows = Phaser.Math.Clamp(f.arrowsBase + Math.floor(c / f.arrowsPerUnits) + t * f.arrowsPerTier, 1, f.arrowsMax);
    return { interval, arrows };
  }

  _loose(n, target) {
    this.sfx('twang');
    const hw = 18 + Math.min(24, Math.sqrt(this.crowd.count) * 2);
    for (let i = 0; i < n; i++) {
      const a = this.add.image(this.crowd.centerX + Phaser.Math.Between(-hw, hw), LANE.crowdY - 14, 'arrow').setDepth(600);
      a.target = target;
      const dx = target.x - a.x, dy = target.y - a.y, d = Math.hypot(dx, dy) || 1;
      a.vx = (dx / d) * BALANCE.arrow.speed;
      a.vy = (dy / d) * BALANCE.arrow.speed;
      a.life = BALANCE.arrow.lifespanMs;
      this.arrows.push(a);
    }
    while (this.arrows.length > 200) { const old = this.arrows.shift(); old.destroy(); }
  }

  _updateArrows(dt) {
    const step = dt / 1000;
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      a.life -= dt;
      const t = a.target;
      if (t && !t.dead && !t.done) {
        const dx = t.x - a.x, dy = t.y - a.y, d = Math.hypot(dx, dy) || 1;
        a.vx = (dx / d) * BALANCE.arrow.speed;
        a.vy = (dy / d) * BALANCE.arrow.speed;
        if (d < 20 * depthScale(a.y) + 8) {
          t.hit();
          if (Math.random() < 0.3) this.sfx('thunk');
          a.destroy(); this.arrows.splice(i, 1); continue;
        }
      }
      a.x += a.vx * step;
      a.y += a.vy * step;
      a.rotation = Math.atan2(a.vy, a.vx) + Math.PI / 2;
      a.setScale(Phaser.Math.Clamp(depthScale(a.y) * 1.1, 0.6, 1.25));
      if (a.y < LANE.topY - 30 || a.life <= 0) { a.destroy(); this.arrows.splice(i, 1); }
    }
  }

  /* ---- resolve barrels that broke (reward) or reached the crowd (chip) ---- */
  _updateBarrels(dt, flow) {
    for (let i = this.barrels.length - 1; i >= 0; i--) {
      const b = this.barrels[i];
      b.update(dt, flow * BALANCE.barrelSpeedMul);

      if (b.dead && !b.rewarded) {
        b.rewarded = true;
        this.crowd.applyOp(b.reward, b.x, b.y); // multiply pop + particles + sfx
        Juice.burst(this, b.x, b.y, PALETTE.goldLight, 22, 260);
        Juice.flash(this, 0xffe9a8, 80, 0.22);
        Juice.shake(this, 0.005, 130);
        this.sfx('smash');
        b.destroy(); this.barrels.splice(i, 1); continue;
      }
      if (!b.dead && b.reachedCrowd) {
        const dmg = Math.max(1, Math.ceil(b.hp * BALANCE.barrelReachDmg));
        this.crowd.takeLosses(dmg);
        Juice.popText(this, b.x, LANE.crowdY - 30, `-${dmg}`, '#ff8d7a', 26);
        Juice.burst(this, b.x, LANE.crowdY - 18, 0x8a5a2a, 16, 200);
        Juice.shake(this, 0.007, 160);
        this.sfx('smash');
        b.destroy(); this.barrels.splice(i, 1); continue;
      }
    }
  }

  /* ---- the attrition clash against the front-most enemy at the line ---- */
  _resolveClash(dt) {
    const front = this.enemies.find((e) => !e.dead && e.reachedClash);
    if (!front) return;
    front.clashing = true;
    this.clashTimer += dt;
    if (this.clashTimer < BALANCE.clashTickMs) return;
    this.clashTimer = 0;

    const w = BALANCE.weaponTiers[this.crowd.weaponTier];
    const yourDmg = Math.max(1, Math.round(this.crowd.count * w.dmg));
    const enemyDmg = Math.max(1, Math.round(front.count * BALANCE.enemyDmgCoeff));

    this._volley(front, w.color); // render the trade as an arrow volley
    Juice.burst(this, front.centerX, front.y, PALETTE.enemy, 8, 150);
    this.sfx('hit');

    front.takeDamage(yourDmg);
    this.crowd.takeLosses(enemyDmg);

    if (front.dead) {
      Juice.burst(this, front.centerX, front.y, PALETTE.goldLight, 26, 260);
      Juice.flash(this, 0xffe9a8, 90, 0.25);
      Juice.shake(this, 0.006, 160);
      this.sfx('pop');
      this.addGold(front.isBoss ? 60 : 15);
      if (front.isBoss) this._win();
      front.destroy();
      this.enemies = this.enemies.filter((e) => e !== front);
    }
    if (this.crowd.count <= 0 && !this.over) this._lose();
  }

  /* A burst of arrows from the crowd into an enemy formation (visual). */
  _volley(enemy, color) {
    const n = Phaser.Math.Clamp(2 + Math.floor(this.crowd.count / 12), 2, 8);
    this.sfx('twang');
    for (let i = 0; i < n; i++) {
      const a = this.add.image(this.crowd.centerX + Phaser.Math.Between(-16, 16), LANE.crowdY - 14, 'arrow').setTint(color).setDepth(600);
      this.tweens.add({
        targets: a, x: enemy.centerX + Phaser.Math.Between(-18, 18), y: enemy.y,
        rotation: 0, duration: 120, ease: 'Quad.in', onComplete: () => a.destroy(),
      });
    }
  }

  _updateThreat() {
    const front = this.enemies.find((e) => !e.dead);
    if (front) {
      this.threatTxt.setText(String(Math.round(front.count)));
      this.threatBg.setFillStyle(front.isBoss ? 0x6a1f14 : PALETTE.enemy, 0.95);
    } else {
      this.threatTxt.setText('—');
    }
    this.armyTxt.setText(`🏹 ${Math.round(this.crowd.count)}`);
    this.weaponTxt.setText(BALANCE.weaponTiers[this.crowd.weaponTier].name);
  }

  _win() {
    if (this.over) return;
    this.over = true;
    this.sfx('win');
    const cur = this.registry.get('unlocked');
    if (this.levelIndex + 1 > cur && this.levelIndex + 1 < CHAPTER1.levels.length) this.registry.set('unlocked', this.levelIndex + 1);
    this.crystalsEarned += 3; this.registry.set('crystals', this.registry.get('crystals') + 3);
    this.registry.get('save')(this.registry);
    this.time.delayedCall(700, () => this.scene.start('Result', {
      win: true, levelIndex: this.levelIndex, gold: this.goldEarned, crystals: this.crystalsEarned, army: Math.round(this.crowd.count),
    }));
  }

  _lose() {
    if (this.over) return;
    this.over = true;
    this.sfx('lose');
    Juice.shake(this, 0.012, 360);
    Juice.flash(this, 0x9a3326, 200, 0.4);
    this.time.delayedCall(700, () => this.scene.start('Result', { win: false, levelIndex: this.levelIndex, gold: this.goldEarned, crystals: this.crystalsEarned }));
  }

  update(time, delta) {
    if (this.over) { this.crowd.update(delta); this._updateArrows(delta); return; }

    if (this.startDelay > 0) {
      this.startDelay -= delta;
      this.crowd.update(delta);
      this.lane.update(delta, 0);
      return;
    }

    const scrollPx = BALANCE.scrollSpeed * (delta / 1000);
    const clashing = this.enemies.some((e) => e.reachedClash && !e.dead);
    const flow = clashing ? 0 : scrollPx;

    this.dist += flow;
    this._spawnUpTo(this.dist);

    this.lane.update(delta, flow);
    this.crowd.update(delta);

    this._updateBarrels(delta, flow);
    for (let i = this.pickups.length - 1; i >= 0; i--) { const p = this.pickups[i]; p.update(delta, flow, this.crowd); if (p.done) { p.destroy(); this.pickups.splice(i, 1); } }
    for (const e of this.enemies) e.update(delta, flow);

    // Archery: fire at the nearest barrel; otherwise hold ready.
    const target = this._fireTarget();
    if (target) {
      this.fireTimer += delta;
      const fp = this._fireParams();
      if (this.fireTimer >= fp.interval) { this.fireTimer = 0; this._loose(fp.arrows, target); }
    } else {
      this.fireTimer = 9999;
    }
    this._updateArrows(delta);

    this._resolveClash(delta);
    this._updateThreat();

    const prog = Phaser.Math.Clamp(this.dist / (this.level.length + 400), 0, 1);
    this.progBar.width = Math.max(2, (GAME_W - 24) * prog);

    if (this.crowd.count <= 0 && !this.over) this._lose();
  }
}
