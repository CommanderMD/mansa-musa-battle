/*
 * ResultScene — Victory and Defeat.
 *
 * Victory: a winged gold-and-blue "VICTORY" banner, three reward tiles
 * (+Workers / +Crystals / +Dossier), and the Mansa Musa DOSSIER card with an accurate
 * historical blurb + a "Read more" deep-link to the live museum. Continue returns to map.
 * Defeat: a somber banner + Retry / Map.
 */
import { GAME_W, GAME_H, PALETTE, hex } from '../config.js';
import { CHAPTER1, DOSSIER } from '../data/chapters.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  create(data) {
    this.data2 = data;
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, PALETTE.ink, 0.78).setDepth(0);
    if (data.win) this._victory(data); else this._defeat(data);
  }

  _victory(data) {
    this.sfxConfetti();
    // Winged banner
    const cx = GAME_W / 2, by = 130;
    const g = this.add.graphics().setDepth(5);
    // wings (gold)
    g.fillStyle(PALETTE.gold, 1);
    for (const dir of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx + dir * 70, by);
      g.lineTo(cx + dir * 170, by - 34);
      g.lineTo(cx + dir * 150, by - 6);
      g.lineTo(cx + dir * 188, by - 2);
      g.lineTo(cx + dir * 150, by + 18);
      g.lineTo(cx + dir * 175, by + 26);
      g.lineTo(cx + dir * 78, by + 22);
      g.closePath();
      g.fillPath();
    }
    g.fillStyle(PALETTE.goldDeep, 1);
    for (const dir of [-1, 1]) {
      g.fillTriangle(cx + dir * 78, by - 4, cx + dir * 150, by - 6, cx + dir * 120, by + 14);
    }
    // central blue shield plate
    g.fillStyle(PALETTE.victoryBlue, 1);
    g.fillRoundedRect(cx - 92, by - 38, 184, 76, 12);
    g.lineStyle(4, PALETTE.goldLight, 1);
    g.strokeRoundedRect(cx - 92, by - 38, 184, 76, 12);

    const v = this.add.text(cx, by - 4, 'VICTORY', {
      fontFamily: 'Georgia, serif', fontSize: '34px', fontStyle: 'bold', color: hex(PALETTE.goldLight), stroke: '#1d3a5c', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(6);
    this.add.text(cx, by + 24, CHAPTER1.levels[data.levelIndex].name, { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#dfe9ff' }).setOrigin(0.5).setDepth(6);
    this.tweens.add({ targets: v, scale: { from: 0.4, to: 1 }, duration: 420, ease: 'Back.out' });

    // Reward tiles
    const tiles = [
      { label: '+Workers', val: `${Math.max(data.army || 0, data.gold)}`, color: PALETTE.gold, icon: '🛡' },
      { label: '+Crystals', val: `${data.crystals}`, color: PALETTE.crystal, icon: '💎' },
      { label: '+Dossier', val: '1', color: PALETTE.green, icon: '📜' },
    ];
    tiles.forEach((t, i) => this._tile(GAME_W / 2 + (i - 1) * 130, 230, t, i));

    // Dossier card
    this._dossierCard(GAME_W / 2, 470);

    // Continue
    this._button(GAME_W / 2, GAME_H - 54, '▶  CONTINUE', PALETTE.gold, () => this.scene.start('Map'));
  }

  _tile(x, y, t, i) {
    const c = this.add.container(x, y).setDepth(10).setScale(0);
    c.add(this.add.rectangle(0, 0, 116, 96, PALETTE.ink, 0.9).setStrokeStyle(3, t.color));
    c.add(this.add.text(0, -28, t.icon, { fontSize: '26px' }).setOrigin(0.5));
    c.add(this.add.text(0, 6, t.val, { fontFamily: 'Georgia, serif', fontSize: '26px', fontStyle: 'bold', color: hex(t.color) }).setOrigin(0.5));
    c.add(this.add.text(0, 34, t.label, { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#eadfca' }).setOrigin(0.5));
    this.tweens.add({ targets: c, scale: 1, duration: 320, delay: 200 + i * 140, ease: 'Back.out' });
  }

  _dossierCard(x, y) {
    const c = this.add.container(x, y).setDepth(10).setAlpha(0);
    const w = GAME_W - 44, h = 250;
    c.add(this.add.rectangle(0, 0, w, h, PALETTE.parchment, 1).setStrokeStyle(4, PALETTE.goldDeep));
    c.add(this.add.rectangle(0, -h / 2 + 18, w, 36, PALETTE.victoryBlue, 1));
    c.add(this.add.text(0, -h / 2 + 18, 'DOSSIER UNLOCKED', { fontFamily: 'Georgia, serif', fontSize: '14px', fontStyle: 'bold', color: hex(PALETTE.goldLight), letterSpacing: 2 }).setOrigin(0.5));
    c.add(this.add.text(0, -h / 2 + 50, DOSSIER.name, { fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'bold', color: hex(PALETTE.ink) }).setOrigin(0.5));
    c.add(this.add.text(0, -h / 2 + 72, DOSSIER.era, { fontFamily: 'Georgia, serif', fontSize: '11px', color: hex(PALETTE.goldDeep) }).setOrigin(0.5));

    const body = DOSSIER.facts.slice(0, 3).map((f) => '•  ' + f).join('\n\n');
    c.add(this.add.text(-w / 2 + 16, -h / 2 + 92, body, {
      fontFamily: 'Georgia, serif', fontSize: '11.5px', color: hex(PALETTE.ink), lineSpacing: 2,
      wordWrap: { width: w - 32 },
    }).setOrigin(0, 0));

    // Read more link
    const link = this.add.text(0, h / 2 - 18, 'Read more at the Black Achievement Museum ↗', {
      fontFamily: 'Georgia, serif', fontSize: '12px', fontStyle: 'bold', color: hex(0x1c6c86),
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    link.on('pointerdown', () => window.open(DOSSIER.source, '_blank'));
    c.add(link);

    this.tweens.add({ targets: c, alpha: 1, y: y, duration: 400, delay: 700, ease: 'Quad.out' });
    this.tweens.add({ targets: c, scale: { from: 0.9, to: 1 }, duration: 400, delay: 700, ease: 'Back.out' });
  }

  _defeat(data) {
    const cx = GAME_W / 2;
    const t = this.add.text(cx, 200, 'DEFEAT', {
      fontFamily: 'Georgia, serif', fontSize: '50px', fontStyle: 'bold', color: hex(PALETTE.enemy), stroke: '#1a0a06', strokeThickness: 7,
    }).setOrigin(0.5);
    this.tweens.add({ targets: t, scale: { from: 1.4, to: 1 }, duration: 420, ease: 'Bounce.out' });
    this.add.text(cx, 256, 'The column was overrun. Steer through richer gates\nand build a bigger army before the clash.', {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: '#eadfca', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5);
    this.add.text(cx, 330, `Gold banked this run: 🪙 ${data.gold}`, { fontFamily: 'Georgia, serif', fontSize: '14px', color: hex(PALETTE.goldLight) }).setOrigin(0.5);

    this._button(cx, GAME_H - 130, '↻  RETRY', PALETTE.gold, () => this.scene.start('Battle', { levelIndex: data.levelIndex }));
    this._button(cx, GAME_H - 60, '⏏  WORLD MAP', PALETTE.green, () => this.scene.start('Map'));
  }

  _button(x, y, label, color, cb) {
    const c = this.add.container(x, y).setDepth(20);
    const bg = this.add.rectangle(0, 0, 240, 56, color).setStrokeStyle(4, PALETTE.ink);
    const txt = this.add.text(0, 0, label, { fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'bold', color: hex(PALETTE.ink) }).setOrigin(0.5);
    c.add([bg, txt]);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => c.setScale(1.04));
    bg.on('pointerout', () => c.setScale(1));
    bg.on('pointerdown', () => { this.registry.get('sfx')('gate'); cb(); });
    this.tweens.add({ targets: c, scale: { from: 0.9, to: 1 }, duration: 300, delay: 300, ease: 'Back.out' });
    return c;
  }

  sfxConfetti() {
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, GAME_W);
      const col = Phaser.Utils.Array.GetRandom([PALETTE.gold, PALETTE.goldLight, PALETTE.victoryBlue, PALETTE.crystal]);
      const s = this.add.image(x, -10, 'shard').setTint(col).setDepth(40).setScale(Phaser.Math.FloatBetween(1, 2.4));
      this.tweens.add({
        targets: s, y: GAME_H + 20, x: x + Phaser.Math.Between(-40, 40), angle: Phaser.Math.Between(0, 360),
        duration: Phaser.Math.Between(1400, 2600), delay: Phaser.Math.Between(0, 600), ease: 'Quad.in',
        onComplete: () => s.destroy(),
      });
    }
  }
}
