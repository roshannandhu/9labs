"use client";

import { useEffect, useRef, useState } from "react";
import { useDemo } from "@/components/providers/DemoSettings";

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform float uGain;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float t = uTime * 0.05;
  vec2 q = vec2(fbm(p * 1.5 + t), fbm(p * 1.5 - t + 3.1));
  vec2 r = vec2(fbm(p * 1.3 + 2.0 * q + vec2(1.7, 9.2) + 0.15 * t + m * 0.35), fbm(p * 1.3 + 2.0 * q + vec2(8.3, 2.8) - 0.12 * t));
  float f = fbm(p * 1.1 + 2.3 * r);
  vec3 col = mix(vec3(0.0), uA, smoothstep(0.25, 0.8, f));
  col = mix(col, uB, smoothstep(0.5, 0.95, r.x) * 0.9);
  col = mix(col, uC, smoothstep(0.55, 1.0, f * r.y * 1.7));
  float d = length(p - m * 0.6);
  col += uC * 0.22 * exp(-d * d * 4.0);
  float vg = smoothstep(1.15, 0.15, length(p * vec2(0.75, 1.05)));
  col *= vg * uGain;
  gl_FragColor = vec4(col, 1.0);
}`;

function hexToVec(hex: string, k = 1): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(((n >> 16) & 255) / 255) * k, (((n >> 8) & 255) / 255) * k, ((n & 255) / 255) * k];
}

/**
 * Interactive shader gradient (raw WebGL, ~3 KB): flowing blue↔purple light that bends
 * toward the cursor. Paused off-screen; a single still frame for reduced motion;
 * CSS gradient fallback when WebGL is unavailable.
 */
export function ShaderGradient({ className = "", gain = 1 }: { className?: string; gain?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings, reduced } = useDemo();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "low-power" });
    if (!gl) {
      setFailed(true);
      return;
    }
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes");
    const uTime = u("uTime");
    const uMouse = u("uMouse");
    gl.uniform3fv(u("uA"), hexToVec("#2a1660"));
    gl.uniform3fv(u("uB"), hexToVec(settings.blue, 0.85));
    gl.uniform3fv(u("uC"), hexToVec(settings.purple, 0.95));
    gl.uniform1f(u("uGain"), gain);

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let visible = false;
    let raf = 0;
    const t0 = performance.now();

    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    const draw = (now: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      gl.uniform1f(uTime, reduced ? 12 : (now - t0) / 1000 + 12);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      draw(now);
      if (!reduced) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    resize();
    draw(performance.now());
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1 - (e.clientY - r.top) / r.height;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const onVis = () => !document.hidden && start();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [settings.blue, settings.purple, reduced, gain]);

  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      {failed ? (
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(60% 70% at 30% 40%, color-mix(in srgb, var(--nl-purple) 35%, transparent), transparent 70%), radial-gradient(50% 60% at 70% 60%, color-mix(in srgb, var(--nl-blue) 30%, transparent), transparent 70%), #07060c",
          }}
        />
      ) : (
        <canvas ref={canvasRef} className="block h-full w-full" />
      )}
    </div>
  );
}
