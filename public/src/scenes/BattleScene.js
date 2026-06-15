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

    this.armyTxt = this.add.text(14, 18, '🪖 8', { fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'bold', color: hex(PALETTE.goldLight) }).setDepth(802);
    this.weaponTxt = this.add.text(14, 40, '🏹 1× arrows', { fontFamily: 'Georgia, serif', fontSize: '11px', color: hex(PALETTE.crystal) }).setDepth(802);

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
        this.enemies.push(new EnemyFormation(this, e.count, e.label, !!e.boss, e.side || 'C'));
        this.sfx('clash');
      } else if (e.type === 'pickup') {
        this.pickups.push(new Pickup(this, e.kind, e.side));
      }
    }
    if (!this.bossSpawned && dist >= this.level.length) {
      this.bossSpawned = true;
      const b = this.level.boss;
      this.enemies.push(new EnemyFormation(this, b.count, b.name, true, 'C'));
      this._banner('FINAL STAND', PALETTE.enemy, b.name);
      this.sfx('clash');
    }
  }

  /* ---- archery (v3): arrows fly STRAIGHT UP from the crowd; hits are by x-overlap only ---- */
  _anyTargetAhead() {
    const inZone = (o) => o.y > LANE.topY - 10 && o.y < LANE.crowdY - 6;
    return this.barrels.some((b) => !b.dead && !b.done && inZone(b)) ||
      this.enemies.some((e) => !e.dead && inZone(e));
  }

  /* Volley size scales with FIREPOWER = count × arrowsPerUnit. interval scales with count.
   * Beyond the sprite cap, each arrow carries extra hit-power so firepower stays honest. */
  _fireParams() {
    const f = BALANCE.fire, c = this.crowd.count, apu = this.crowd.arrowsPerUnit;
    const interval = Phaser.Math.Clamp(f.baseInterval - c * f.intervalPerUnit, f.minInterval, f.baseInterval);
    const desired = Math.max(1, Math.round((f.arrowsBase + Math.floor(c / f.arrowsPerUnits)) * apu));
    const arrows = Math.min(desired, f.arrowsMaxVisual);
    const hitPower = Math.max(1, Math.round(desired / arrows));
    return { interval, arrows, hitPower };
  }

  /* The crowd's arrow-spray half-width (absolute px at the crowd row). Kept fairly tight so an
   * aligned volley concentrates on the barrel; it widens only modestly with size (more bodies
   * = slightly wider forgiveness band) while the EXTRA arrows from size do the real work. */
  _crowdBandHalf() {
    return Phaser.Math.Clamp(15 + 1.4 * Math.sqrt(this.crowd.count), 15, 64);
  }

  _loose(n, hitPower) {
    this.sfx('twang');
    const tint = BALANCE.weaponTiers[this.crowd.weaponTier].color;
    const band = this._crowdBandHalf();
    for (let i = 0; i < n; i++) {
      // Spray across the crowd band with a CENTER-WEIGHTED (triangular) spread — denser under
      // the crowd's middle, thinning to the edges — then fire dead straight up.
      const x = this.crowd.centerX + (Math.random() - Math.random()) * band;
      const a = this.add.image(x, LANE.crowdY - 16, 'arrow').setDepth(600).setTint(tint);
      a.vy = -BALANCE.arrow.speed;
      a.prevY = a.y;
      a.hitPower = hitPower;
      a.life = BALANCE.arrow.lifespanMs;
      this.arrows.push(a);
    }
    while (this.arrows.length > 260) { const old = this.arrows.shift(); old.destroy(); }
  }

  _updateArrows(dt) {
    const step = dt / 1000;
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      a.life -= dt;
      a.prevY = a.y;
      a.y += a.vy * step; // straight up; x never changes — alignment is everything
      a.setScale(Phaser.Math.Clamp(depthScale(a.y) * 1.2, 0.55, 1.35));

      // Overlap hit: did this arrow cross a live target's row within its x-width?
      let hit = false;
      for (const b of this.barrels) {
        if (b.dead || b.done) continue;
        const row = b.hitRowY;
        if (a.prevY >= row && a.y <= row && Math.abs(a.x - b.x) <= b.hitHalfX) {
          for (let h = 0; h < (a.hitPower || 1); h++) b.hit();
          if (Math.random() < 0.25) this.sfx('thunk');
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (const e of this.enemies) {
          if (e.dead) continue;
          const row = e.hitRowY;
          if (a.prevY >= row && a.y <= row && Math.abs(a.x - e.centerX) <= e.hitHalfX) {
            e.takeHit(a.hitPower || 1);
            Juice.burst(this, a.x, row, PALETTE.enemy, 3, 90);
            if (Math.random() < 0.18) this.sfx('hit');
            hit = true;
            break;
          }
        }
      }
      if (hit) { a.destroy(); this.arrows.splice(i, 1); continue; }
      if (a.y < LANE.topY - 40 || a.life <= 0) { a.destroy(); this.arrows.splice(i, 1); }
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

  /* ---- enemies: advance, get shot down by arrows; survivors collide 1-for-1 ---- */
  _updateEnemies(dt, flow) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, flow);

      if (e.dead) {
        // Whole wave shot down before reaching the column.
        Juice.burst(this, e.centerX, e.y, PALETTE.goldLight, e.isBoss ? 30 : 18, 260);
        Juice.flash(this, 0xffe9a8, 80, 0.22);
        Juice.shake(this, e.isBoss ? 0.008 : 0.004, 150);
        this.sfx('pop');
        this.addGold(e.isBoss ? 60 : 12);
        const wasBoss = e.isBoss;
        e.destroy(); this.enemies.splice(i, 1);
        if (wasBoss) this._win();
        continue;
      }
      if (e.reachedCrowd) {
        // Survivors crash in and remove an EQUAL number of your units (1-for-1).
        const survivors = Math.round(e.count);
        this.crowd.takeLosses(survivors);
        Juice.popText(this, e.centerX, LANE.crowdY - 34, `-${survivors}`, '#ff8d7a', 30);
        Juice.burst(this, e.centerX, LANE.crowdY - 16, PALETTE.enemy, 22, 240);
        Juice.flash(this, 0x9a3326, 110, 0.3);
        Juice.shake(this, 0.01, 220);
        this.sfx('smash');
        const wasBoss = e.isBoss;
        e.destroy(); this.enemies.splice(i, 1);
        if (this.crowd.count <= 0) { this._lose(); return; }
        if (wasBoss) this._win(); // withstood the boss → victory
      }
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
    this.armyTxt.setText(`🪖 ${Math.round(this.crowd.count)}`);
    const apu = this.crowd.arrowsPerUnit;
    this.weaponTxt.setText(`🏹 ${apu % 1 ? apu.toFixed(1) : apu}× arrows`);
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

    // v3: the lane flows steadily — enemies and barrels both keep advancing (no melee stop).
    const flow = BALANCE.scrollSpeed * (delta / 1000);

    this.dist += flow;
    this._spawnUpTo(this.dist);

    this.lane.update(delta, flow);
    this.crowd.update(delta);

    this._updateBarrels(delta, flow);
    for (let i = this.pickups.length - 1; i >= 0; i--) { const p = this.pickups[i]; p.update(delta, flow, this.crowd); if (p.done) { p.destroy(); this.pickups.splice(i, 1); } }

    // Archery (v3): loose straight-up volleys whenever a barrel OR enemy is on the lane ahead.
    // Whether they connect is purely about steering the crowd under the target.
    if (this._anyTargetAhead()) {
      this.fireTimer += delta;
      const fp = this._fireParams();
      if (this.fireTimer >= fp.interval) { this.fireTimer = 0; this._loose(fp.arrows, fp.hitPower); }
    } else {
      this.fireTimer = 9999;
    }
    this._updateArrows(delta);

    this._updateEnemies(delta, flow); // shoot them down; survivors collide 1-for-1
    this._updateThreat();

    const prog = Phaser.Math.Clamp(this.dist / (this.level.length + 400), 0, 1);
    this.progBar.width = Math.max(2, (GAME_W - 24) * prog);

    if (this.crowd.count <= 0 && !this.over) this._lose();
  }
}
