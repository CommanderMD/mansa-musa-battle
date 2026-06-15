/*
 * BattleScene — the core "multiplier march" loop.
 *
 * Flow: the lane scrolls toward a fixed crowd band. A distance-ordered track streams
 * gate rows, enemy waves, and pickups down the lane. The player drags to steer the
 * whole crowd left/right; gates apply their op; enemy waves clash on contact via
 * attrition (crowd size x weapon tier vs enemy count). A boss caps the level and needs
 * a threshold crowd. Win = boss defeated; lose = crowd hits zero.
 *
 * Everything visual/feel-related is delegated to Lane / Crowd / Gate / EnemyFormation /
 * Pickup / Juice so this scene stays a readable orchestrator.
 */
import { GAME_W, GAME_H, LANE, PALETTE, BALANCE, hex } from '../config.js';
import { CHAPTER1 } from '../data/chapters.js';
import { Lane } from '../systems/Lane.js';
import { Crowd } from '../entities/Crowd.js';
import { GateRow } from '../entities/Gate.js';
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
    this.gates = [];
    this.enemies = [];
    this.pickups = [];
    this.clashTimer = 0;

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

  /* ---- HUD: top-center threat counter (the "69"), progress, currency, weapon ---- */
  _hud() {
    this.add.rectangle(GAME_W / 2, 26, GAME_W, 52, PALETTE.ink, 0.55).setDepth(800).setScrollFactor(0);

    // Top-center enemy/threat counter
    this.threatBg = this.add.circle(GAME_W / 2, 30, 26, PALETTE.enemy, 0.9).setStrokeStyle(3, 0x3a120b).setDepth(801);
    this.threatTxt = this.add.text(GAME_W / 2, 30, '—', {
      fontFamily: 'Georgia, serif', fontSize: '26px', fontStyle: 'bold', color: '#fff',
      stroke: '#3a120b', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(802);
    this.add.text(GAME_W / 2, 56, 'ENEMIES', { fontFamily: 'Georgia, serif', fontSize: '9px', color: '#ffd7cf' }).setOrigin(0.5).setDepth(802);

    // Left: army count
    this.armyTxt = this.add.text(14, 18, '🛡 8', { fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'bold', color: hex(PALETTE.goldLight) }).setDepth(802);
    this.weaponTxt = this.add.text(14, 40, 'Spears', { fontFamily: 'Georgia, serif', fontSize: '11px', color: hex(PALETTE.crystal) }).setDepth(802);

    // Right: currency
    this.goldTxt = this.add.text(GAME_W - 14, 16, `🪙 ${this.registry.get('gold')}`, { fontFamily: 'Georgia, serif', fontSize: '14px', color: hex(PALETTE.goldLight) }).setOrigin(1, 0).setDepth(802);
    this.crysTxt = this.add.text(GAME_W - 14, 36, `💎 ${this.registry.get('crystals')}`, { fontFamily: 'Georgia, serif', fontSize: '14px', color: hex(0xbff4ff) }).setOrigin(1, 0).setDepth(802);

    // Progress bar (bottom)
    this.add.rectangle(GAME_W / 2, GAME_H - 8, GAME_W - 24, 8, 0x000000, 0.4).setDepth(800);
    this.progBar = this.add.rectangle(12, GAME_H - 8, 2, 8, PALETTE.gold).setOrigin(0, 0.5).setDepth(801);

    // Pause / back
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
      if (e.type === 'gateRow') this.gates.push(new GateRow(this, e));
      else if (e.type === 'enemy') { this.enemies.push(new EnemyFormation(this, e.count, e.label, !!e.boss)); this.sfx('clash'); }
      else if (e.type === 'pickup') this.pickups.push(new Pickup(this, e.kind, e.side));
    }
    // Boss at the end of the level.
    if (!this.bossSpawned && dist >= this.level.length) {
      this.bossSpawned = true;
      const b = this.level.boss;
      this.enemies.push(new EnemyFormation(this, b.count, b.name, true));
      this._banner('FINAL STAND', PALETTE.enemy, b.name);
      this.sfx('clash');
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

    // visuals: a volley from the crowd into the enemy block
    this._volley(this.crowd.centerX, LANE.crowdY - 24, front.centerX, front.y, w.color);
    Juice.burst(this, front.centerX, front.y, PALETTE.enemy, 8, 150);
    this.sfx('hit');

    front.takeDamage(yourDmg);
    this.crowd.takeLosses(enemyDmg);

    if (front.dead) {
      Juice.burst(this, front.centerX, front.y, PALETTE.goldLight, 26, 260);
      Juice.flash(this, 0xffe9a8, 90, 0.25);
      Juice.shake(this, 0.006, 160);
      this.sfx('pop');
      const reward = front.isBoss ? 60 : 15;
      this.addGold(reward);
      if (front.isBoss) this._win();
      front.destroy();
      this.enemies = this.enemies.filter((e) => e !== front);
    }
    if (this.crowd.count <= 0 && !this.over) this._lose();
  }

  _volley(x0, y0, x1, y1, color) {
    for (let i = 0; i < 4; i++) {
      const s = this.add.image(x0 + Phaser.Math.Between(-14, 14), y0, 'shard').setTint(color).setDepth(600).setScale(1.4);
      this.tweens.add({
        targets: s, x: x1 + Phaser.Math.Between(-16, 16), y: y1, duration: 110, ease: 'Quad.in',
        onComplete: () => s.destroy(),
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
    this.armyTxt.setText(`🛡 ${Math.round(this.crowd.count)}`);
    this.weaponTxt.setText(BALANCE.weaponTiers[this.crowd.weaponTier].name);
  }

  _win() {
    if (this.over) return;
    this.over = true;
    this.sfx('win');
    // Unlock the next level.
    const cur = this.registry.get('unlocked');
    if (this.levelIndex + 1 > cur && this.levelIndex + 1 < CHAPTER1.levels.length) this.registry.set('unlocked', this.levelIndex + 1);
    this.registry.get('save')(this.registry);
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
    if (this.over) { this.crowd.update(delta); return; }

    if (this.startDelay > 0) {
      this.startDelay -= delta;
      this.crowd.update(delta);
      this.lane.update(delta, 0);
      return;
    }

    const scrollPx = BALANCE.scrollSpeed * (delta / 1000);
    // Halt forward scroll of the world while a clash is happening at the line.
    const clashing = this.enemies.some((e) => e.reachedClash && !e.dead);
    const flow = clashing ? 0 : scrollPx;

    this.dist += flow;
    this._spawnUpTo(this.dist);

    this.lane.update(delta, flow);
    this.crowd.update(delta);

    for (let i = this.gates.length - 1; i >= 0; i--) { const g = this.gates[i]; g.update(delta, flow, this.crowd); if (g.done) { g.destroy(); this.gates.splice(i, 1); } }
    for (let i = this.pickups.length - 1; i >= 0; i--) { const p = this.pickups[i]; p.update(delta, flow, this.crowd); if (p.done) { p.destroy(); this.pickups.splice(i, 1); } }
    for (const e of this.enemies) e.update(delta, flow);

    this._resolveClash(delta);
    this._updateThreat();

    // progress bar (cap until boss resolves)
    const prog = Phaser.Math.Clamp(this.dist / (this.level.length + 400), 0, 1);
    this.progBar.width = Math.max(2, (GAME_W - 24) * prog);

    // Lose if a gate zeroed the crowd outside combat.
    if (this.crowd.count <= 0 && !this.over) this._lose();
  }
}
