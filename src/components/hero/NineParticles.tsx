"use client";

import { useEffect, useRef } from "react";
import { GLYPHS, NINE_VB, type GlyphKey } from "./nine-path";
import { useDemo } from "@/components/providers/DemoSettings";

/**
 * Concept B — "Particle Grid".
 * ~1,400 glowing particles start on blueprint-grid crossings, then fly in and assemble
 * into the 9 along its drawing direction. The cursor pushes them away; they spring back.
 * Canvas 2D with pre-rendered glow sprites and additive blending; paused off-screen.
 */
export default function NineParticles({ className = "", glyph = "grotesk" }: { className?: string; glyph?: GlyphKey }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings, reduced } = useDemo();

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const PAD = 0.35;
    let cw = 0;
    let ch = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    const mouse = { x: -9999, y: -9999 };
    const t0 = performance.now();

    const sprite = (color: string) => {
      const s = document.createElement("canvas");
      s.width = s.height = 32;
      const c = s.getContext("2d")!;
      const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.18, color);
      g.addColorStop(0.5, color.replace(/rgb\(([^)]+)\)/, "rgba($1,0.25)"));
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 32, 32);
      return s;
    };
    const hexToRgb = (hex: string) => {
      const n = parseInt(hex.replace("#", ""), 16);
      return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
    };
    const blue = sprite(hexToRgb(settings.blue));
    const purple = sprite(hexToRgb(settings.purple));

    type P = { x: number; y: number; vx: number; vy: number; tx: number; ty: number; delay: number; size: number; tone: number; ph: number };
    let parts: P[] = [];

    const build = () => {
      const r = box.getBoundingClientRect();
      const bw = r.width;
      const bh = r.height;
      cw = bw * (1 + PAD * 2);
      ch = bh * (1 + PAD * 2);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      const ox = bw * PAD;
      const oy = bh * PAD;
      const sx = bw / NINE_VB.w;
      const sy = bh / NINE_VB.h;
      const count = bw < 220 ? 900 : 1700;
      const lattice = 24;
      // Rejection-sample points inside the bold glyph; bias some towards the outline for a crisp edge.
      const g = GLYPHS[glyph];
      const shape = new Path2D(g.d);
      const probe = document.createElement("canvas").getContext("2d")!;
      probe.lineWidth = 7;
      const targets: { x: number; y: number; edge: boolean }[] = [];
      let guard = 0;
      while (targets.length < count && guard++ < count * 60) {
        const x = g.bounds.x0 + Math.random() * (g.bounds.x1 - g.bounds.x0);
        const y = g.bounds.y0 + Math.random() * (g.bounds.y1 - g.bounds.y0);
        const onEdge = probe.isPointInStroke(shape, x, y);
        if (onEdge || (probe.isPointInPath(shape, x, y, "nonzero") && Math.random() < 0.55)) targets.push({ x, y, edge: onEdge });
      }
      parts = targets.map((t) => {
        const tx = ox + t.x * sx;
        const ty = oy + t.y * sy;
        const gx = Math.round((Math.random() * cw) / lattice) * lattice;
        const gy = Math.round((Math.random() * ch) / lattice) * lattice;
        const f = (t.y - g.bounds.y0) / (g.bounds.y1 - g.bounds.y0);
        return {
          x: reduced ? tx : gx,
          y: reduced ? ty : gy,
          vx: 0,
          vy: 0,
          tx,
          ty,
          delay: reduced ? 0 : 0.35 + f * 1.4 + Math.random() * 0.4,
          size: t.edge ? 1.6 + Math.random() * 2.2 : 1 + Math.random() * 1.6,
          tone: f > 0.86 || Math.random() < 0.16 ? 1 : 0,
          ph: Math.random() * Math.PI * 2,
        };
      });
    };

    const draw = (now: number) => {
      const time = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = "lighter";
      const R = 70;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (!reduced && time > p.delay) {
          const wob = Math.sin(time * 1.3 + p.ph) * 0.7;
          let ax = (p.tx + wob - p.x) * 0.05;
          let ay = (p.ty + Math.cos(time * 1.1 + p.ph) * 0.7 - p.y) * 0.05;
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const force = (1 - d / R) * 3.2;
            ax += (dx / d) * force;
            ay += (dy / d) * force;
          }
          p.vx = (p.vx + ax) * 0.84;
          p.vy = (p.vy + ay) * 0.84;
          p.x += p.vx;
          p.y += p.vy;
        }
        const arrived = reduced || time > p.delay;
        const tw = 0.65 + 0.35 * Math.sin(time * 2.2 + p.ph);
        ctx.globalAlpha = (arrived ? 0.9 : 0.22) * tw;
        const s = p.size * (arrived ? 2.2 : 1.4);
        ctx.drawImage(p.tone ? purple : blue, p.x - s, p.y - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      draw(now);
    };

    build();
    if (reduced) draw(performance.now());
    else raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      build();
      if (reduced) draw(performance.now());
    });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(box);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [settings.blue, settings.purple, reduced, glyph]);

  return (
    <div ref={boxRef} className={`relative ${className}`} style={{ aspectRatio: `${NINE_VB.w} / ${NINE_VB.h}` }} aria-hidden="true">
      <div
        className="absolute -inset-[30%] rounded-full opacity-80"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--nl-blue) 22%, transparent), color-mix(in srgb, var(--nl-purple) 10%, transparent) 60%, transparent 80%)",
          filter: "blur(30px)",
        }}
      />
      <canvas ref={canvasRef} className="absolute" style={{ left: "-35%", top: "-35%" }} />
    </div>
  );
}
