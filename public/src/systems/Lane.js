/*
 * Lane.js — The painted 2.5D backdrop: warm sky, a receding trapezoid road with a
 * vanishing point near the horizon, desert sand + green flanks, and scrolling props
 * (acacia trees, dunes) that stream down and scale with perspective to fake depth.
 *
 * This is the "2.5D" of the brief: flat art + perspective scaling + a painted lane —
 * NOT top-down, NOT real 3D.
 */
import { GAME_W, GAME_H, LANE, PALETTE, depthScale } from '../config.js';

export class Lane {
  constructor(scene) {
    this.scene = scene;
    this.props = [];
    this.spawnAccum = 0;
    this._paintStatic();
  }

  _paintStatic() {
    const s = this.scene;
    const g = s.add.graphics().setDepth(0);

    // Sky gradient (banded fills — warm gold to pale).
    const bands = 10;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(PALETTE.skyTop),
        Phaser.Display.Color.ValueToColor(PALETTE.sky),
        bands - 1,
        i
      );
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, (LANE.topY * t) | 0, GAME_W, Math.ceil(LANE.topY / bands) + 1);
    }
    // Sun disc near the horizon.
    g.fillStyle(0xfff0c0, 0.85);
    g.fillCircle(GAME_W / 2, LANE.topY - 30, 46);
    g.fillStyle(0xffe49a, 0.5);
    g.fillCircle(GAME_W / 2, LANE.topY - 30, 64);

    // Ground: split desert (sand) flanks + green near the road.
    g.fillStyle(PALETTE.sand, 1);
    g.fillRect(0, LANE.topY, GAME_W, GAME_H - LANE.topY);
    // green band closer to viewer (savanna)
    g.fillStyle(PALETTE.green, 0.35);
    g.fillTriangle(0, GAME_H, 0, GAME_H - 360, GAME_W, GAME_H);
    g.fillTriangle(GAME_W, GAME_H, GAME_W, GAME_H - 360, 0, GAME_H);

    // The road trapezoid (vanishing at top).
    const cx = LANE.centerX;
    g.fillStyle(PALETTE.roadEdge, 1);
    g.fillPoints(
      [
        { x: cx - LANE.topHalfW - 8, y: LANE.topY },
        { x: cx + LANE.topHalfW + 8, y: LANE.topY },
        { x: cx + LANE.baseHalfW + 14, y: GAME_H },
        { x: cx - LANE.baseHalfW - 14, y: GAME_H },
      ],
      true
    );
    g.fillStyle(PALETTE.road, 1);
    g.fillPoints(
      [
        { x: cx - LANE.topHalfW, y: LANE.topY },
        { x: cx + LANE.topHalfW, y: LANE.topY },
        { x: cx + LANE.baseHalfW, y: GAME_H },
        { x: cx - LANE.baseHalfW, y: GAME_H },
      ],
      true
    );

    // Dashed center line for a sense of motion reference.
    g.fillStyle(PALETTE.goldLight, 0.45);
    for (let i = 0; i < 9; i++) {
      const t0 = i / 9, t1 = t0 + 0.045;
      const y0 = Phaser.Math.Linear(LANE.topY, GAME_H, t0);
      const y1 = Phaser.Math.Linear(LANE.topY, GAME_H, t1);
      const w0 = Phaser.Math.Linear(2, 9, t0);
      const w1 = Phaser.Math.Linear(2, 9, t1);
      g.fillPoints(
        [
          { x: cx - w0, y: y0 }, { x: cx + w0, y: y0 },
          { x: cx + w1, y: y1 }, { x: cx - w1, y: y1 },
        ],
        true
      );
    }
    this.staticG = g;

    // Soft vignette to focus the eye.
    const v = s.add.graphics().setDepth(820);
    v.fillStyle(0x2a1c0c, 0.0);
    v.fillStyle(0x000000, 0.16);
    v.fillRect(0, 0, GAME_W, 60);
    v.fillRect(0, GAME_H - 90, GAME_W, 90);
    this.vignette = v;
  }

  /* Spawn a flank prop just past the road edge at the horizon; it scrolls toward us. */
  _spawnProp() {
    const left = Math.random() < 0.5;
    const kind = Math.random() < 0.5 ? 'tree' : 'dune';
    const p = this.scene.add.image(0, LANE.topY + 4, kind).setOrigin(0.5, 0.95).setDepth(50);
    p.side = left ? -1 : 1;
    p.spread = Phaser.Math.FloatBetween(1.15, 2.2); // how far off-road
    this.props.push(p);
  }

  update(dt, scrollPx) {
    // Trickle in props.
    this.spawnAccum += scrollPx;
    if (this.spawnAccum > 70) { this.spawnAccum = 0; this._spawnProp(); }

    for (let i = this.props.length - 1; i >= 0; i--) {
      const p = this.props[i];
      p.y += scrollPx;
      const sc = depthScale(p.y);
      const t = Phaser.Math.Clamp((p.y - LANE.topY) / (GAME_H - LANE.topY), 0, 1);
      const roadHalf = Phaser.Math.Linear(LANE.topHalfW, LANE.baseHalfW, t);
      p.x = LANE.centerX + p.side * (roadHalf + p.spread * 60 * sc);
      p.setScale(sc * 1.4).setDepth(50 + p.y * 0.1);
      if (p.y > GAME_H + 60) { p.destroy(); this.props.splice(i, 1); }
    }
  }
}
