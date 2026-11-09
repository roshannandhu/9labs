import type { IconKey } from "@/content/site";
import type { PictureDraw } from "./targets";

/**
 * The nine service pictures: each is a small, self-contained Canvas-2D drawing function in a
 * −50…50 design square (helpers below map that onto the sampling canvas). The same function is
 * used to (a) sample the particle swarm's target positions/colours (called once, at t = 0) and
 * (b) paint the crisp, living picture once the swarm has landed (called every frame with real
 * time, in seconds, so a handful of accents move — hearts rise, a flash fires, lights sweep —
 * while the bulk of the drawing stays put, so the particles' landing spot never goes stale).
 *
 * Every colour comes from the shared palette (`palette.ts`), so the particles snapped to a
 * picture's pixels always match the picture exactly.
 */

const TAU = Math.PI * 2;
const wave = (t: number, period: number, phase = 0) => Math.sin((t / period + phase) * TAU);
const pulse01 = (t: number, period: number, phase = 0) => (wave(t, period, phase) + 1) / 2;
/** a soft 0→1→0 blip once per `period`, held near 0 most of the time (for a periodic "event": flash, clap, hit) */
const blip = (t: number, period: number, width = 0.14) => {
  const p = ((t % period) + period) % period;
  return p < width * period ? Math.sin((p / (width * period)) * Math.PI) : 0;
};

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
function poly(ctx: CanvasRenderingContext2D, pts: [number, number][]) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}
function heart(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.3, cy - s * 0.3, cx - s * 0.5, cy - s * 1.3, cx, cy - s * 0.45);
  ctx.bezierCurveTo(cx + s * 0.5, cy - s * 1.3, cx + s * 1.3, cy - s * 0.3, cx, cy + s * 0.9);
  ctx.closePath();
}
function star4(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, r2 = r * 0.38) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const rad = i % 2 === 0 ? r : r2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
function lgrad(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}
function rgrad(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}
function cloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  ctx.beginPath();
  ctx.arc(cx - w * 0.32, cy + h * 0.08, h * 0.52, Math.PI * 0.5, Math.PI * 1.55);
  ctx.arc(cx - w * 0.06, cy - h * 0.22, h * 0.58, Math.PI * 1.1, Math.PI * 2.05);
  ctx.arc(cx + w * 0.3, cy - h * 0.05, h * 0.5, Math.PI * 1.3, Math.PI * 2.25);
  ctx.arc(cx + w * 0.46, cy + h * 0.2, h * 0.4, Math.PI * 1.65, Math.PI * 0.55);
  ctx.closePath();
}

/** design space is −50…50; S is the sampling canvas side (or the live slot's rendered side). */
function space(ctx: CanvasRenderingContext2D, S: number, draw: () => void) {
  ctx.save();
  ctx.translate(S / 2, S / 2);
  ctx.scale(S / 100, S / 100);
  draw();
  ctx.restore();
}

// ---------------------------------------------------------------- 1 · social media
const social: PictureDraw = (ctx, S, p, t) => {
  space(ctx, S, () => {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    // phone
    rr(ctx, -29, -31, 30, 62, 7);
    ctx.fillStyle = lgrad(ctx, -29, -31, 1, 31, [
      [0, p.ink],
      [1, p.inkLight],
    ]);
    ctx.fill();
    rr(ctx, -29, -31, 30, 62, 7);
    ctx.strokeStyle = p.white;
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // speaker notch
    rr(ctx, -19, -27, 10, 2.4, 1.2);
    ctx.fillStyle = p.shadow;
    ctx.fill();
    // screen / post
    rr(ctx, -25.5, -21, 23, 44, 3);
    ctx.fillStyle = p.panel;
    ctx.fill();
    // avatar + name
    ctx.beginPath();
    ctx.arc(-20.5, -16, 2.6, 0, TAU);
    ctx.fillStyle = p.accent2;
    ctx.fill();
    rr(ctx, -16.3, -17.1, 10, 2.2, 1.1);
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.45;
    ctx.fill();
    ctx.globalAlpha = 1;
    // photo tile
    rr(ctx, -24.5, -11.5, 21, 15, 2.2);
    ctx.fillStyle = lgrad(ctx, -24.5, -11.5, -3.5, 3.5, [
      [0, p.accent],
      [1, p.accent2],
    ]);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-9, -9, 2.4, 0, TAU);
    ctx.fillStyle = p.amber;
    ctx.fill();
    // like row
    heart(ctx, -22, 7, 2.1 + blip(t, 2.4, 0.3) * 0.5);
    ctx.fillStyle = p.warm;
    ctx.fill();
    rr(ctx, -17.5, 5.6, 9, 1.8, 0.9);
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.3;
    ctx.fill();
    rr(ctx, -24.5, 11.5, 15, 1.7, 0.85);
    rr(ctx, -24.5, 14.6, 10, 1.7, 0.85);
    ctx.fill();
    ctx.globalAlpha = 1;
    // home indicator
    rr(ctx, -17, 27, 6, 1.4, 0.7);
    ctx.fillStyle = p.white;
    ctx.globalAlpha = 0.25;
    ctx.fill();
    ctx.globalAlpha = 1;

    // floating hearts
    const hp: [number, number, number, number][] = [
      [10, -6, 3.1, 0],
      [17, -17, 2.3, 0.33],
      [5, -24, 1.8, 0.66],
    ];
    for (const [hx, hy, hs, ph] of hp) {
      const u = (t / 2.6 + ph) % 1;
      const yy = hy - u * 16;
      const a = u < 0.15 ? u / 0.15 : u > 0.75 ? (1 - u) / 0.25 : 1;
      ctx.globalAlpha = Math.max(0, a);
      heart(ctx, hx + Math.sin(u * TAU * 2) * 1.4, yy, hs);
      ctx.fillStyle = p.warm;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // chat bubble
    rr(ctx, 10, -42, 20, 13, 5);
    ctx.fillStyle = p.accent2;
    ctx.fill();
    poly(ctx, [
      [16, -29],
      [21, -29],
      [16, -24],
    ]);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const bb = 0.5 + 0.5 * Math.sin(t * 4 - i * 1.1);
      ctx.globalAlpha = 0.45 + bb * 0.55;
      ctx.beginPath();
      ctx.arc(15.5 + i * 4.5, -36, 1.4, 0, TAU);
      ctx.fillStyle = p.white;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
};

// ---------------------------------------------------------------- 2 · advertising
const advertising: PictureDraw = (ctx, S, p, t) => {
  space(ctx, S, () => {
    const kick = blip(t, 3.2, 0.1) * -2.4;
    ctx.save();
    ctx.translate(kick, 0);

    // ad card behind
    rr(ctx, -44, -40, 36, 24, 4);
    ctx.fillStyle = p.panel;
    ctx.fill();
    rr(ctx, -40, -36, 11, 5, 2);
    ctx.fillStyle = p.accent2;
    ctx.fill();
    rr(ctx, -40, -27, 26, 2.4, 1.2);
    rr(ctx, -40, -22, 18, 2.4, 1.2);
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.4;
    ctx.fill();
    ctx.globalAlpha = 1;
    rr(ctx, -40, -18, 16, 6.5, 3);
    ctx.fillStyle = p.accent;
    ctx.fill();

    // megaphone
    ctx.beginPath();
    ctx.moveTo(-8, -9);
    ctx.quadraticCurveTo(10, -9, 26, -22);
    ctx.lineTo(26, 20);
    ctx.quadraticCurveTo(10, 7, -8, 7);
    ctx.closePath();
    ctx.fillStyle = lgrad(ctx, -8, -9, 26, 20, [
      [0, p.accent2],
      [1, p.accent],
    ]);
    ctx.fill();
    rr(ctx, -14, -7, 7, 14, 2.5);
    ctx.fillStyle = p.ink;
    ctx.fill();
    rr(ctx, -16, 4, 4, 11, 2);
    ctx.fillStyle = p.inkLight;
    ctx.fill();
    // grille lines
    ctx.strokeStyle = p.white;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-4 + i * 4, -6);
      ctx.lineTo(10 + i * 5.2, -15 + i * 7);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // sound waves
    for (let i = 0; i < 3; i++) {
      const u = (t / 1.8 + i / 3) % 1;
      ctx.globalAlpha = Math.max(0, 1 - u) * 0.8;
      ctx.beginPath();
      ctx.arc(26, 0, 6 + u * 20, -0.62, 0.62);
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  });
};

// ---------------------------------------------------------------- 3 · content & creative
const content: PictureDraw = (ctx, S, p, t) => {
  space(ctx, S, () => {
    // player window
    rr(ctx, 2, -34, 40, 36, 5);
    ctx.fillStyle = p.panel;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(22, -18, 9, 0, TAU);
    ctx.fillStyle = lgrad(ctx, 13, -27, 31, -9, [
      [0, p.accent],
      [1, p.accent2],
    ]);
    ctx.fill();
    poly(ctx, [
      [19, -23],
      [19, -13],
      [27, -18],
    ]);
    ctx.fillStyle = p.white;
    ctx.fill();
    rr(ctx, 6, -2, 32, 2.6, 1.3);
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.globalAlpha = 1;
    const head = 6 + (0.5 + 0.5 * wave(t, 3)) * 30;
    ctx.beginPath();
    ctx.arc(head, -0.7, 1.9, 0, TAU);
    ctx.fillStyle = p.amber;
    ctx.fill();

    // board
    rr(ctx, -42, -8, 34, 32, 4);
    ctx.fillStyle = lgrad(ctx, -42, -8, -8, 24, [
      [0, p.ink],
      [1, p.inkLight],
    ]);
    ctx.fill();
    const clap = blip(t, 3.2, 0.1);
    ctx.save();
    ctx.translate(-25, -8);
    ctx.rotate(-0.26 * clap);
    ctx.translate(25, 8);
    rr(ctx, -42, -17, 34, 9, 2);
    ctx.save();
    rr(ctx, -42, -17, 34, 9, 2);
    ctx.clip();
    ctx.fillStyle = p.ink;
    ctx.fillRect(-42, -17, 34, 9);
    ctx.fillStyle = p.white;
    for (let i = -2; i < 8; i++) {
      poly(ctx, [
        [-42 + i * 6, -17],
        [-42 + i * 6 + 3, -17],
        [-42 + i * 6 - 2, -8],
        [-42 + i * 6 - 5, -8],
      ]);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(-39, -17, 1.3, 0, TAU);
    ctx.fillStyle = p.shadow;
    ctx.fill();

    const spark: [number, number, number][] = [
      [36, -40, 0],
      [42, -30, 0.5],
      [30, -46, 0.8],
    ];
    for (const [sx, sy, ph] of spark) {
      const tw = 0.5 + 0.5 * wave(t, 1.6, ph);
      ctx.globalAlpha = 0.4 + tw * 0.6;
      star4(ctx, sx, sy, 2.2 + tw * 1.2);
      ctx.fillStyle = p.amber;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
};

// ---------------------------------------------------------------- 4 · photo & filming
const photo: PictureDraw = (ctx, S, p, t) => {
  space(ctx, S, () => {
    // prints
    for (const [rx, ry, rot] of [
      [22, 18, 10],
      [30, 10, -6],
    ] as const) {
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate((rot * Math.PI) / 180);
      rr(ctx, -8, -9, 16, 20, 1.6);
      ctx.fillStyle = p.panel;
      ctx.fill();
      rr(ctx, -6.5, -7.5, 13, 12, 1);
      ctx.fillStyle = lgrad(ctx, -6.5, -7.5, 6.5, 4.5, [
        [0, p.accent],
        [1, p.accent2],
      ]);
      ctx.fill();
      ctx.restore();
    }

    // body
    rr(ctx, -34, -10, 60, 34, 7);
    ctx.fillStyle = lgrad(ctx, -34, -10, 26, 24, [
      [0, p.ink],
      [1, p.inkLight],
    ]);
    ctx.fill();
    rr(ctx, -10, -22, 20, 13, 3);
    ctx.fillStyle = p.ink;
    ctx.fill();
    rr(ctx, -27, -4, 10, 3.2, 1.6);
    ctx.fillStyle = p.white;
    ctx.globalAlpha = 0.18;
    ctx.fill();
    ctx.globalAlpha = 1;

    // lens
    const cx = -4;
    const cy = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 0, TAU);
    ctx.fillStyle = p.shadow;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 0, TAU);
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, TAU);
    ctx.fillStyle = rgrad(ctx, cx - 4, cy - 4, 13, [
      [0, p.white],
      [0.25, p.accent2],
      [1, p.shadow],
    ]);
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
    const spin = t * 0.6;
    for (let i = 0; i < 6; i++) {
      const a = spin + (i / 6) * TAU;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      poly(ctx, [
        [0, 0],
        [7, -3],
        [7, 3],
      ]);
      ctx.fillStyle = p.ink;
      ctx.globalAlpha = 0.55;
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // flash + rays
    const fl = blip(t, 3.4, 0.16);
    rr(ctx, -30, -24, 10, 7, 2);
    ctx.fillStyle = p.panel;
    ctx.fill();
    if (fl > 0.01) {
      ctx.globalAlpha = fl;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        ctx.beginPath();
        ctx.moveTo(-25 + Math.cos(a) * 6, -20 + Math.sin(a) * 6);
        ctx.lineTo(-25 + Math.cos(a) * (10 + fl * 10), -20 + Math.sin(a) * (10 + fl * 10));
        ctx.strokeStyle = p.amber;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // REC
    rr(ctx, 14, -24, 13, 6, 3);
    ctx.fillStyle = p.panel;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(18, -21, 1.6, 0, TAU);
    ctx.fillStyle = p.red;
    ctx.globalAlpha = 0.5 + pulse01(t, 1) * 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
  });
};

// ---------------------------------------------------------------- 5 · events
const events: PictureDraw = (ctx, S, p, t) => {
  space(ctx, S, () => {
    // beams
    for (const side of [-1, 1] as const) {
      const sweep = side * 10 + Math.sin(t / 2.1) * 14 * side;
      ctx.save();
      ctx.translate(side * 32, -46);
      ctx.rotate(((90 + sweep) * Math.PI) / 180);
      poly(ctx, [
        [0, 0],
        [-9, 70],
        [9, 70],
      ]);
      ctx.fillStyle = p.amber;
      ctx.globalAlpha = 0.16;
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // truss + fixtures
    rr(ctx, -40, -47, 80, 3, 1.5);
    ctx.fillStyle = p.inkLight;
    ctx.fill();
    for (const side of [-1, 1] as const) {
      rr(ctx, side * 32 - 3, -48, 6, 5, 1.5);
      ctx.fillStyle = p.ink;
      ctx.fill();
    }

    // backdrop
    rr(ctx, -36, -40, 72, 34, 2);
    ctx.fillStyle = lgrad(ctx, -36, -40, 36, -6, [
      [0, p.ink],
      [1, p.inkLight],
    ]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-30, -14);
    for (let x = -30; x <= 30; x += 3) ctx.lineTo(x, -14 - Math.abs(Math.sin(x * 0.5 + t * 3)) * 7);
    ctx.strokeStyle = p.accent;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // stage platform
    poly(ctx, [
      [-44, 32],
      [44, 32],
      [34, 10],
      [-34, 10],
    ]);
    ctx.fillStyle = lgrad(ctx, 0, 10, 0, 32, [
      [0, p.inkLight],
      [1, p.ink],
    ]);
    ctx.fill();
    rr(ctx, -34, 8.5, 68, 2.2, 1);
    ctx.fillStyle = p.accent;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;

    // performer
    ctx.beginPath();
    ctx.arc(0, -3, 3.4, 0, TAU);
    ctx.fillStyle = p.panel;
    ctx.fill();
    poly(ctx, [
      [-4.5, 10],
      [4.5, 10],
      [3, -1],
      [-3, -1],
    ]);
    ctx.fillStyle = p.panel;
    ctx.fill();
    rr(ctx, -0.6, -16, 1.2, 14, 0.6);
    ctx.fillStyle = p.inkLight;
    ctx.fill();

    // crowd
    for (let i = 0; i < 11; i++) {
      const x = -40 + i * 8;
      const bob = Math.sin(t * 2.4 + i * 0.7) * 1.6;
      ctx.beginPath();
      ctx.arc(x, 36 + bob, 3.4, Math.PI, TAU);
      ctx.fillStyle = p.shadow;
      ctx.fill();
      if (i % 3 === 0) {
        ctx.beginPath();
        ctx.moveTo(x - 2.6, 36 + bob);
        ctx.lineTo(x - 4, 28 + bob - Math.max(0, Math.sin(t * 2.4 + i)) * 4);
        ctx.strokeStyle = p.shadow;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }

    // confetti
    for (let i = 0; i < 6; i++) {
      const u = ((t / 2.4 + i / 6) % 1) * 1;
      const x = -30 + i * 11 + Math.sin(u * TAU) * 3;
      const y = -46 + u * 70;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(u * 8);
      ctx.fillStyle = i % 2 ? p.accent : p.amber;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(-1, -1.6, 2, 3.2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  });
};

// ---------------------------------------------------------------- 6 · PR & communications
const pr: PictureDraw = (ctx, S, p, t) => {
  space(ctx, S, () => {
    ctx.save();
    ctx.translate(-4, -8);
    ctx.rotate(-0.1);
    rr(ctx, -28, -30, 42, 46, 2);
    ctx.fillStyle = p.panel;
    ctx.fill();
    rr(ctx, -24, -25, 34, 5, 1);
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    rr(ctx, -24, -17, 34, 7, 1);
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.globalAlpha = 1;
    rr(ctx, -24, -7, 15, 15, 1);
    ctx.fillStyle = lgrad(ctx, -24, -7, -9, 8, [
      [0, p.accent2],
      [1, p.accent],
    ]);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      rr(ctx, -6.5, -7 + i * 4.2, 10.5, 2, 1);
      ctx.fillStyle = p.ink;
      ctx.globalAlpha = 0.3;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const shimmer = ((t / 2.6) % 1) * 68 - 24;
    ctx.save();
    rr(ctx, -24, -25, 34, 5, 1);
    ctx.clip();
    ctx.fillStyle = p.white;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(shimmer - 6, -25, 6, 5);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.restore();

    // microphone
    ctx.save();
    ctx.translate(20, 6);
    rr(ctx, -10, -34, 2.2, 26, 1.1);
    ctx.fillStyle = p.ink;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-9, -8, 8, 2.2, 0, 0, TAU);
    ctx.fillStyle = p.inkLight;
    ctx.fill();
    rr(ctx, -15, -46, 10, 16, 5);
    ctx.fillStyle = lgrad(ctx, -15, -46, -5, -30, [
      [0, p.ink],
      [1, p.inkLight],
    ]);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      rr(ctx, -14, -44 + i * 4.4, 8, 1.4, 0.7);
      ctx.fillStyle = p.shadow;
      ctx.globalAlpha = 0.5;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    rr(ctx, -16.5, -43, 3.5, 11, 1.6);
    ctx.fillStyle = p.accent2;
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const u = (t / 1.6 + i / 3) % 1;
      ctx.globalAlpha = Math.max(0, 1 - u) * 0.75;
      ctx.beginPath();
      ctx.arc(-10, -38, 8 + u * 14, -1.1, -0.3);
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // quote bubble
    const bob = Math.sin(t * 1.6) * 1.2;
    ctx.save();
    ctx.translate(2, -36 + bob);
    rr(ctx, 0, 0, 20, 13, 5);
    ctx.fillStyle = p.accent;
    ctx.fill();
    poly(ctx, [
      [5, 13],
      [10, 13],
      [4, 18],
    ]);
    ctx.fill();
    ctx.fillStyle = p.white;
    ctx.font = "900 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("“”", 10, 6.5);
    ctx.restore();
  });
};

// ---------------------------------------------------------------- 7 · strategy
const strategy: PictureDraw = (ctx, S, p, t) => {
  space(ctx, S, () => {
    // chart card
    rr(ctx, 6, -42, 36, 26, 4);
    ctx.fillStyle = p.panel;
    ctx.fill();
    const bars = [8, 14, 10, 18];
    bars.forEach((h, i) => {
      rr(ctx, 11 + i * 7.5, -18 - h, 5, h, 1.4);
      ctx.fillStyle = i === bars.length - 1 ? p.accent2 : p.ink;
      ctx.globalAlpha = i === bars.length - 1 ? 1 : 0.35;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(11, -30);
    ctx.lineTo(20, -24);
    ctx.lineTo(28, -33);
    ctx.lineTo(37, -20);
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // target
    const rings: [number, string][] = [
      [20, p.accent2],
      [13.5, p.panel],
      [7, p.accent],
    ];
    for (const [rad, col] of rings) {
      ctx.beginPath();
      ctx.arc(-10, 2, rad, 0, TAU);
      ctx.fillStyle = col;
      ctx.fill();
    }
    rr(ctx, -12, 22, 4, 14, 2);
    ctx.fillStyle = p.inkLight;
    ctx.fill();

    // ripple on hit
    const hitT = (t % 3.5) / 3.5;
    const hit = hitT < 0.08 ? 1 - hitT / 0.08 : 0;
    if (hit > 0.01) {
      ctx.beginPath();
      ctx.arc(-10, 2, 20 + (1 - hit) * 10, 0, TAU);
      ctx.strokeStyle = p.accent;
      ctx.globalAlpha = hit * 0.7;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // arrow flying in, pulls back and strikes every 3.5s
    const cyc = (t % 3.5) / 3.5;
    const fly = cyc < 0.65 ? Math.min(1, cyc / 0.08) : cyc < 0.78 ? 1 - (cyc - 0.65) / 0.13 : 0;
    const ax = -10 + (1 - fly) * 34;
    const ay = 2 - (1 - fly) * 26;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate((-40 * Math.PI) / 180);
    poly(ctx, [
      [-16, -1.4],
      [2, -1.4],
      [2, -4],
      [8, 0],
      [2, 4],
      [2, 1.4],
      [-16, 1.4],
    ]);
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = Math.max(0.15, fly);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  });
};

// ---------------------------------------------------------------- 8 · AI consultancy
const ai: PictureDraw = (ctx, S, p, t) => {
  space(ctx, S, () => {
    // chip
    rr(ctx, -20, 10, 40, 24, 4);
    ctx.fillStyle = lgrad(ctx, -20, 10, 20, 34, [
      [0, p.inkLight],
      [1, p.ink],
    ]);
    ctx.fill();
    for (let i = -2; i <= 2; i++) {
      ctx.fillStyle = p.inkLight;
      ctx.fillRect(-20 - 3, 13 + i * 4, 3, 2);
      ctx.fillRect(20, 13 + i * 4, 3, 2);
    }
    rr(ctx, -13, 15, 26, 14, 2);
    ctx.fillStyle = p.shadow;
    ctx.fill();

    // brain
    ctx.save();
    ctx.beginPath();
    ctx.arc(-9, -2, 15, Math.PI * 0.4, Math.PI * 1.7);
    ctx.arc(9, -2, 15, Math.PI * 1.3, Math.PI * 0.6);
    ctx.closePath();
    const bg = lgrad(ctx, -24, -15, 24, 10, [
      [0, p.accent2],
      [0.55, p.accent2],
      [1, p.accent],
    ]);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.clip();
    ctx.strokeStyle = p.shadow;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-18 + i * 2, -14);
      ctx.quadraticCurveTo(-10 + i * 2, -4, -18 + i * 4, 6);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    const nodes: [number, number][] = [
      [-16, -8],
      [-16, 2],
      [-16, 10],
      [0, -14],
      [0, -2],
      [0, 8],
      [16, -8],
      [16, 6],
    ];
    const edges: [number, number][] = [
      [0, 3],
      [1, 3],
      [1, 4],
      [2, 4],
      [2, 5],
      [3, 6],
      [4, 6],
      [4, 7],
      [5, 7],
    ];
    const lead = (t * 1.1) % edges.length;
    ctx.lineWidth = 1;
    for (let i = 0; i < edges.length; i++) {
      const [a, b] = edges[i];
      const near = Math.max(0, 1 - Math.abs(i - lead));
      ctx.strokeStyle = p.accent;
      ctx.globalAlpha = 0.25 + near * 0.55;
      ctx.beginPath();
      ctx.moveTo(nodes[a][0], nodes[a][1]);
      ctx.lineTo(nodes[b][0], nodes[b][1]);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    nodes.forEach(([nx, ny], i) => {
      const near = Math.max(0, 1 - Math.abs(i - lead * 0.9));
      ctx.beginPath();
      ctx.arc(nx, ny, 2 + near * 1.2, 0, TAU);
      ctx.fillStyle = p.white;
      ctx.globalAlpha = 0.6 + near * 0.4;
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    for (const [sx, sy, ph] of [
      [22, -28, 0],
      [-26, -22, 0.6],
    ] as const) {
      const tw = 0.5 + 0.5 * wave(t, 1.8, ph);
      star4(ctx, sx, sy, 2.4 + tw * 1.4);
      ctx.fillStyle = p.amber;
      ctx.globalAlpha = 0.5 + tw * 0.5;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
};

// ---------------------------------------------------------------- 9 · IT consultancy
const it: PictureDraw = (ctx, S, p, t) => {
  space(ctx, S, () => {
    // connection lines + packets
    for (const [lx, dir] of [
      [-6, 1],
      [10, -1],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(lx, -14);
      ctx.lineTo(lx, 10);
      ctx.strokeStyle = p.ink;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
      const u = (((dir > 0 ? t : -t) / 1.6) % 1 + 1) % 1;
      ctx.beginPath();
      ctx.arc(lx, -14 + u * 24, 1.8, 0, TAU);
      ctx.fillStyle = p.accent;
      ctx.fill();
    }

    // cloud
    cloud(ctx, 2, -24, 46, 18);
    ctx.fillStyle = lgrad(ctx, -18, -34, 24, -14, [
      [0, p.white],
      [1, p.panel],
    ]);
    ctx.fill();
    ctx.strokeStyle = p.ink;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // rack
    for (let i = 0; i < 3; i++) {
      const y = 10 + i * 9.5;
      rr(ctx, -22, y, 38, 8, 2);
      ctx.fillStyle = lgrad(ctx, -22, y, 16, y + 8, [
        [0, p.ink],
        [1, p.inkLight],
      ]);
      ctx.fill();
      rr(ctx, -19, y + 2, 20, 1.3, 0.6);
      ctx.fillStyle = p.shadow;
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
      const on = Math.sin(t * 3 + i * 2.1) > 0.2;
      ctx.beginPath();
      ctx.arc(11, y + 4, 1.3, 0, TAU);
      ctx.fillStyle = on ? p.accent : p.shadow;
      ctx.fill();
    }

    // laptop
    ctx.save();
    ctx.translate(-2, 40);
    poly(ctx, [
      [-22, 0],
      [22, 0],
      [17, 4],
      [-17, 4],
    ]);
    ctx.fillStyle = p.inkLight;
    ctx.fill();
    rr(ctx, -18, -22, 36, 22, 2);
    ctx.fillStyle = p.ink;
    ctx.fill();
    rr(ctx, -15.5, -19.5, 31, 17, 1);
    ctx.fillStyle = p.panel;
    ctx.fill();
    const hh = [5, 9, 6, 11, 7];
    hh.forEach((h, i) => {
      rr(ctx, -13 + i * 5.6, -3.5 - h, 3.4, h, 1);
      ctx.fillStyle = p.accent;
      ctx.globalAlpha = 0.75;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    // shield
    ctx.save();
    ctx.translate(20, 20);
    poly(ctx, [
      [0, -13],
      [11, -8],
      [11, 2],
      [0, 14],
      [-11, 2],
      [-11, -8],
    ]);
    ctx.fillStyle = lgrad(ctx, -11, -13, 11, 14, [
      [0, p.accent],
      [1, p.accent2],
    ]);
    ctx.fill();
    const draw = Math.min(1, (t % 4) / 0.5);
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-5 + Math.min(1, draw * 2) * 4, 4);
    if (draw > 0.5) ctx.lineTo(-5 + 4 + Math.min(1, (draw - 0.5) * 2) * 8, 4 - Math.min(1, (draw - 0.5) * 2) * 12);
    ctx.strokeStyle = p.white;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
  });
};

export const PICTURES: Record<IconKey, PictureDraw> = { social, advertising, content, photo, events, pr, strategy, ai, it };
