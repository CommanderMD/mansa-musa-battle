/*
 * Gate.js — A row of two multiplier gates (left + right) the crowd steers through.
 * Each side shows an operation banner (x2 / x3 / +10 / -5 / Weapon+). When the row
 * scrolls down past the crowd line, the side the crowd center is under is applied once.
 *
 * Drawn as a translucent colored archway that scales with perspective as it nears.
 */
import { LANE, PALETTE, depthScale, laneHalfWidth, hex } from '../config.js';

const opColor = (op) => {
  if (op.op === 'sub') return PALETTE.enemy;
  if (op.op === 'weapon') return PALETTE.crystal;
  if (op.op === 'mul') return PALETTE.green;
  return PALETTE.gold; // add
};
const opLabel = (op) =>
  op.op === 'add' ? `+${op.v}` : op.op === 'sub' ? `-${op.v}` : op.op === 'mul' ? `x${op.v}` : 'WEAPON+';

class GateSide {
  constructor(scene, op) {
    this.op = op;
    this.color = opColor(op);
    this.g = scene.add.graphics().setDepth(300);
    this.label = scene.add
      .text(0, 0, opLabel(op), {
        fontFamily: 'Georgia, serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: hex(PALETTE.ink),
        strokeThickness: 5,
        align: 'center',
        wordWrap: { width: 110 },
      })
      .setOrigin(0.5)
      .setDepth(320);
  }
  draw(cx, y, halfW, sc) {
    const w = halfW * 2 * 0.92;
    const h = 96 * sc;
    const x = cx - w / 2;
    const top = y - h;
    const g = this.g;
    g.clear();
    g.fillStyle(this.color, 0.22);
    g.fillRect(x, top, w, h);
    g.lineStyle(Math.max(2, 5 * sc), this.color, 0.95);
    g.strokeRect(x, top, w, h);
    // posts
    g.fillStyle(this.color, 0.9);
    g.fillRect(x - 4 * sc, top, 6 * sc, h);
    g.fillRect(x + w - 2 * sc, top, 6 * sc, h);
    this.label.setPosition(cx, top + h * 0.4).setScale(Phaser.Math.Clamp(sc, 0.7, 1.15));
  }
  destroy() { this.g.destroy(); this.label.destroy(); }
}

export class GateRow {
  constructor(scene, data) {
    this.scene = scene;
    this.y = -40;
    this.left = new GateSide(scene, data.left);
    this.right = new GateSide(scene, data.right);
    this.applied = false;
    this.done = false;
  }

  update(dt, scrollPx, crowd) {
    this.y += scrollPx;
    const sc = depthScale(this.y);
    const half = laneHalfWidth(this.y);
    const leftCx = LANE.centerX - half / 2;
    const rightCx = LANE.centerX + half / 2;
    this.left.draw(leftCx, this.y, half / 2, sc);
    this.right.draw(rightCx, this.y, half / 2, sc);

    // Apply when the row sweeps through the crowd band.
    if (!this.applied && this.y >= LANE.crowdY - 6) {
      this.applied = true;
      const pick = crowd.centerX <= LANE.centerX ? this.left : this.right;
      const px = crowd.centerX <= LANE.centerX ? leftCx : rightCx;
      crowd.applyOp(pick.op, px, LANE.crowdY);
      // Fade the chosen side out, dim the other.
      this._fade(pick, true);
      this._fade(pick === this.left ? this.right : this.left, false);
    }

    if (this.y > LANE.baseY + 120) this.done = true;
  }

  _fade(side, chosen) {
    this.scene.tweens.add({
      targets: [side.g, side.label],
      alpha: 0,
      duration: chosen ? 320 : 180,
      onComplete: () => {},
    });
  }

  destroy() { this.left.destroy(); this.right.destroy(); }
}
