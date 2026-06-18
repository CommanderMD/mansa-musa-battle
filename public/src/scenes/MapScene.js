/*
 * MapScene — Chapter-1 world map. A parchment-style map of the Mali heartland with
 * three nodes (medallions) connected by a dotted caravan route. Unlocked nodes glow
 * gold; locked ones show a padlock. Tapping a node selects it; the gold PLAY button
 * launches the battle. Beating a level unlocks the next (handled in ResultScene).
 */
import { GAME_W, GAME_H, PALETTE, hex, VERSION } from '../config.js';
import { CHAPTER1, MUSEUM_URL } from '../data/chapters.js';

export class MapScene extends Phaser.Scene {
  constructor() { super('Map'); }

  create() {
    const unlocked = this.registry.get('unlocked');
    this.selected = Math.min(unlocked, CHAPTER1.levels.length - 1);

    this._paintParchment();

    // Title plate
    this.add.rectangle(GAME_W / 2, 56, GAME_W - 40, 78, PALETTE.ink, 0.82).setStrokeStyle(3, PALETTE.gold);
    this.add.text(GAME_W / 2, 40, CHAPTER1.subtitle.toUpperCase(), {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: hex(PALETTE.goldLight), letterSpacing: 3,
    }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 64, CHAPTER1.title, {
      fontFamily: 'Georgia, serif', fontSize: '24px', fontStyle: 'bold', color: '#fff',
    }).setOrigin(0.5);

    // Anchor banner
    this.add.text(GAME_W / 2, 104, `Black Excellence · Multiplier Battle  —  Anchor: ${CHAPTER1.anchor}`, {
      fontFamily: 'Georgia, serif', fontSize: '12px', color: hex(PALETTE.goldDeep),
    }).setOrigin(0.5);

    // Currency HUD
    this._currency();

    // Node layout along a winding route.
    const pts = [
      { x: GAME_W * 0.30, y: GAME_H * 0.66 },
      { x: GAME_W * 0.64, y: GAME_H * 0.52 },
      { x: GAME_W * 0.42, y: GAME_H * 0.34 },
    ];
    this._route(pts);

    this.nodes = [];
    CHAPTER1.levels.forEach((lvl, i) => {
      const locked = i > unlocked;
      this.nodes.push(this._node(pts[i], i, lvl, locked));
    });

    this._infoPanel();
    this._playButton();
    this._museumLink();

    // Build-version badge (bump to v4, v5… next time).
    this.add.text(12, GAME_H - 16, VERSION, {
      fontFamily: 'Georgia, serif', fontSize: '13px', fontStyle: 'bold',
      color: hex(PALETTE.goldDeep), backgroundColor: 'rgba(42,28,12,0.35)', padding: { x: 5, y: 2 },
    }).setOrigin(0, 1).setDepth(50);

    this._refresh();
  }

  _paintParchment() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(PALETTE.parchment, 1);
    g.fillRect(0, 0, GAME_W, GAME_H);
    // mottled sand patches
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, GAME_W), y = Phaser.Math.Between(120, GAME_H);
      g.fillStyle(0xdcc187, Phaser.Math.FloatBetween(0.15, 0.4));
      g.fillCircle(x, y, Phaser.Math.Between(8, 30));
    }
    // a stylized river (Niger bend) in faded blue
    g.lineStyle(10, 0x8fb6c9, 0.5);
    g.beginPath();
    g.moveTo(-10, GAME_H * 0.8);
    g.lineTo(GAME_W * 0.35, GAME_H * 0.74);
    g.lineTo(GAME_W * 0.55, GAME_H * 0.58);
    g.lineTo(GAME_W * 0.5, GAME_H * 0.4);
    g.lineTo(GAME_W * 0.7, GAME_H * 0.28);
    g.strokePath();
    // border frame
    g.lineStyle(6, PALETTE.goldDeep, 0.9);
    g.strokeRect(8, 122, GAME_W - 16, GAME_H - 200);
  }

  _route(pts) {
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(PALETTE.ink, 0.55);
    for (let s = 0; s < pts.length - 1; s++) {
      const a = pts[s], b = pts[s + 1];
      const steps = 14;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        g.fillCircle(Phaser.Math.Linear(a.x, b.x, t), Phaser.Math.Linear(a.y, b.y, t), 2.2);
      }
    }
  }

  _node(pt, i, lvl, locked) {
    const c = this.add.container(pt.x, pt.y).setDepth(10);
    const ring = this.add.circle(0, 0, 30, locked ? 0x6b5a3a : PALETTE.gold).setStrokeStyle(4, PALETTE.ink);
    const inner = this.add.circle(0, 0, 22, locked ? 0x8a7550 : PALETTE.goldDeep);
    const label = this.add.text(0, 0, locked ? '🔒' : String(i + 1), {
      fontFamily: 'Georgia, serif', fontSize: locked ? '22px' : '26px', fontStyle: 'bold', color: '#fff',
    }).setOrigin(0.5);
    const name = this.add.text(0, 42, lvl.name, {
      fontFamily: 'Georgia, serif', fontSize: '11px', color: hex(PALETTE.ink), align: 'center',
      backgroundColor: 'rgba(233,211,163,0.7)', padding: { x: 4, y: 2 },
    }).setOrigin(0.5);
    c.add([ring, inner, label, name]);
    c.ring = ring; c.locked = locked; c.index = i;

    if (!locked) {
      this.tweens.add({ targets: ring, scale: 1.08, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const hit = this.add.circle(pt.x, pt.y, 36).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { this.selected = i; this._refresh(); this.registry.get('sfx')('gate'); });
    }
    return c;
  }

  _refresh() {
    this.nodes.forEach((n) => {
      const sel = n.index === this.selected;
      n.ring.setStrokeStyle(sel ? 5 : 4, sel ? PALETTE.crystal : PALETTE.ink);
    });
    const lvl = CHAPTER1.levels[this.selected];
    this.infoName.setText(lvl.name);
    this.infoBlurb.setText(lvl.blurb);
    // v6: L2/L3 inherit the carried army; show that instead of a misleading "1 soldier" start.
    const carry = this.registry.get('carryArmy');
    const startTxt = (this.selected > 0 && carry)
      ? `Start: ~${carry} soldiers (carried)`
      : `Start: ${lvl.startCrowd} soldier${lvl.startCrowd === 1 ? '' : 's'}`;
    this.infoStats.setText(`${startTxt}   ·   Boss: ${lvl.boss.count}`);
  }

  _infoPanel() {
    const y = GAME_H - 158;
    this.add.rectangle(GAME_W / 2, y, GAME_W - 28, 84, PALETTE.ink, 0.86).setStrokeStyle(2, PALETTE.gold).setDepth(20);
    this.infoName = this.add.text(GAME_W / 2, y - 26, '', {
      fontFamily: 'Georgia, serif', fontSize: '17px', fontStyle: 'bold', color: hex(PALETTE.goldLight),
    }).setOrigin(0.5).setDepth(21);
    this.infoBlurb = this.add.text(GAME_W / 2, y - 2, '', {
      fontFamily: 'Georgia, serif', fontSize: '12px', color: '#eadfca', align: 'center',
      wordWrap: { width: GAME_W - 56 },
    }).setOrigin(0.5).setDepth(21);
    this.infoStats = this.add.text(GAME_W / 2, y + 26, '', {
      fontFamily: 'Georgia, serif', fontSize: '12px', color: hex(PALETTE.crystal),
    }).setOrigin(0.5).setDepth(21);
  }

  _playButton() {
    const y = GAME_H - 70;
    const btn = this.add.container(GAME_W / 2, y).setDepth(30);
    const bg = this.add.rectangle(0, 0, 220, 58, PALETTE.gold).setStrokeStyle(4, PALETTE.goldDeep);
    const sh = this.add.rectangle(0, 5, 220, 58, PALETTE.ink, 0.25).setDepth(-1);
    const txt = this.add.text(0, 0, '▶  PLAY', {
      fontFamily: 'Georgia, serif', fontSize: '26px', fontStyle: 'bold', color: hex(PALETTE.ink),
    }).setOrigin(0.5);
    btn.add([sh, bg, txt]);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => btn.setScale(1.04));
    bg.on('pointerout', () => btn.setScale(1));
    bg.on('pointerdown', () => {
      this.registry.get('sfx')('weapon');
      // v6 STAGE CARRYOVER: launching LEVEL 1 begins a FRESH run — clear any carried army/weapon
      // so you start at 1 soldier (the teaching moment). L2/L3 keep the carry from the prior win.
      if (this.selected === 0) {
        this.registry.set('carryArmy', null);
        this.registry.set('carrySpread', 1);
        this.registry.set('carryRateTier', 0);
      }
      this.cameras.main.fade(280, 20, 14, 6);
      this.time.delayedCall(280, () => this.scene.start('Battle', { levelIndex: this.selected }));
    });
    this.tweens.add({ targets: btn, scale: { from: 1, to: 1.03 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  _currency() {
    const g = this.registry.get('gold'), c = this.registry.get('crystals');
    this.add.text(20, 128, `🪙 ${g}`, { fontFamily: 'Georgia, serif', fontSize: '16px', color: hex(PALETTE.goldDeep), fontStyle: 'bold' }).setDepth(40);
    this.add.text(GAME_W - 20, 128, `💎 ${c}`, { fontFamily: 'Georgia, serif', fontSize: '16px', color: hex(0x2a7d99), fontStyle: 'bold' }).setOrigin(1, 0).setDepth(40);
  }

  _museumLink() {
    const t = this.add.text(GAME_W / 2, GAME_H - 18, 'Black Achievement Digital Museum ↗', {
      fontFamily: 'Georgia, serif', fontSize: '11px', color: hex(0x2a7d99),
    }).setOrigin(0.5).setDepth(40).setInteractive({ useHandCursor: true });
    t.on('pointerdown', () => window.open(MUSEUM_URL, '_blank'));
  }
}
