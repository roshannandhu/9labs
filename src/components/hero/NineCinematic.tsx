"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Grid, Lightformer, MeshReflectorMaterial, Sparkles, Stars } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { GLYPHS, WORDMARK, type GlyphKey } from "./nine-path";
import { useDemo } from "@/components/providers/DemoSettings";

/**
 * Concept C — "Glass 9" (the recommended hero). Ideas inspired by cinematic WebGL layers
 * (glyph cast in glass bending a burning wordmark, object over a mirror sea, a logo that
 * assembles from particles, an object that spins up with the cursor) — built from scratch.
 *
 *  - The Sora ExtraBold 9 is cast in clear glass (real transmission + chromatic aberration
 *    on the high tier) with fine neon edges where light flows around the outline.
 *  - Behind it, the NINE LABS wordmark burns; the glass bends it.
 *  - It hovers over a dark mirror sea under a starfield, inside the orbit tracks.
 *  - Intro: thousands of particles fly in, form the 9, then it crystallises into glass.
 *  - Moving the cursor spins the 9 up; it settles back to face the visitor.
 *  - Scrolling flies the camera around it.
 */

export type Tier = "high" | "low";

const FLOOR_Y = -2.95;
const FOV = 35;
const REST = { y: 1.9, z: 10.8, ty: 0.1 };
const INTRO = { form: 2.4, reveal: 2.35 }; // seconds after the canvas becomes visible

// Extrusion in glyph units (the glyph is 478 units tall); scaled ×0.01 into the scene.
const DEPTH = 64;
const BEVEL_T = 16;
const BEVEL_S = 9;

type IntroClock = { start: number | null; freeze?: number };

/** Seconds since the intro started (or a frozen value from `?intro=1.4`, for reviews/screenshots). */
function introTime(c: IntroClock | null, now: number) {
  if (!c || c.start == null) return -1;
  return c.freeze ?? now - c.start;
}

/** Bold glyph shapes + its front contours (outer outline and the counter of the bowl). */
function useGlyph(glyph: GlyphKey) {
  return useMemo(() => {
    const g = GLYPHS[glyph];
    const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${g.d3}"/></svg>`);
    const shapes = data.paths.flatMap((p) => p.toShapes());
    const cy = 600 - (g.bounds.y0 + g.bounds.y1) / 2;
    const toV = (x: number, y: number, z: number) => new THREE.Vector3((x - 200) / 100, (y - cy) / 100, z);
    const front = (DEPTH / 2 + BEVEL_T) / 100 + 0.004;
    const contours: THREE.CatmullRomCurve3[] = [];
    for (const sh of shapes) {
      const rings = [sh.getPoints(90), ...sh.holes.map((h) => h.getPoints(60))];
      for (const ring of rings) {
        const pts = ring.filter((p, i) => i === 0 || p.distanceTo(ring[i - 1]) > 0.5).map((p) => toV(p.x, p.y, front));
        if (pts.length > 3) contours.push(new THREE.CatmullRomCurve3(pts, true, "centripetal", 0.2));
      }
    }
    const body = new THREE.ExtrudeGeometry(shapes, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL_T,
      bevelSize: BEVEL_S,
      bevelSegments: 10,
      curveSegments: 40,
    });
    body.translate(-200, -cy, -DEPTH / 2);
    body.scale(0.01, 0.01, 0.01);
    body.computeVertexNormals();
    return { body, contours };
  }, [glyph]);
}

/** Neon edge shader: base colour + light bands that travel along the tube, plus an intro flash. */
const FLOW_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const FLOW_FRAG = /* glsl */ `
  uniform float uTime; uniform float uFlash; uniform vec3 uA; uniform vec3 uB; varying vec2 vUv;
  float band(float x, float c, float w) { float d = fract(x - c + 0.5) - 0.5; return exp(-d * d * w); }
  void main() {
    float x = vUv.x;
    vec3 base = mix(uA, uB, smoothstep(0.75, 1.0, x)) * 1.1;
    float b1 = band(x, fract(uTime * 0.1), 900.0);
    float b2 = band(x, fract(uTime * 0.1 + 0.5), 1400.0);
    vec3 col = base + vec3(1.0) * b1 * 2.2 + uB * b2 * 1.8 + vec3(1.0) * uFlash;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Nine({
  blue,
  purple,
  glyph,
  tier,
  progress,
  intro,
  reduced,
}: {
  blue: string;
  purple: string;
  glyph: GlyphKey;
  tier: Tier;
  progress: React.RefObject<number>;
  intro: React.RefObject<IntroClock>;
  reduced: boolean;
}) {
  const { body, contours } = useGlyph(glyph);
  const tubes = useMemo(() => contours.map((c, i) => new THREE.TubeGeometry(c, i === 0 ? 900 : 500, 0.02, 8, true)), [contours]);
  const shaders = useMemo(
    () =>
      tubes.map(() => ({
        uniforms: { uTime: { value: 0 }, uFlash: { value: 0 }, uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() } },
        vertexShader: FLOW_VERT,
        fragmentShader: FLOW_FRAG,
      })),
    [tubes],
  );
  const flows = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const group = useRef<THREE.Group>(null);
  const motion = useRef({ spin: 0, yaw: 0, px: 0, py: 0, init: false });

  useEffect(
    () => () => {
      body.dispose();
      tubes.forEach((t) => t.dispose());
    },
    [body, tubes],
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const since = reduced ? 99 : introTime(intro.current, t);
    const reveal = Math.min(1, Math.max(0, (since - INTRO.reveal) / 0.7));
    const flash = reduced ? 0 : Math.exp(-Math.pow((since - INTRO.reveal - 0.15) * 3.2, 2)) * 2.4;

    flows.current.forEach((m, i) => {
      if (!m) return;
      m.uniforms.uTime.value = (reduced ? 2 : t) + i * 3.7;
      m.uniforms.uFlash.value = flash;
      m.uniforms.uA.value.set(blue);
      m.uniforms.uB.value.set(purple);
    });

    const g = group.current;
    if (!g) return;
    g.visible = reveal > 0;
    const sc = 0.94 + 0.06 * (1 - Math.pow(1 - reveal, 3));
    g.scale.setScalar(sc);

    // Cursor spin-up: pointer speed feeds angular velocity; settles back to face front.
    const mo = motion.current;
    if (!mo.init) {
      mo.px = state.pointer.x;
      mo.py = state.pointer.y;
      mo.init = true;
    }
    const speed = Math.hypot(state.pointer.x - mo.px, state.pointer.y - mo.py) / Math.max(dt, 1 / 120);
    mo.px = state.pointer.x;
    mo.py = state.pointer.y;
    if (!reduced) mo.spin = Math.min(mo.spin + speed * 0.9 * dt, 7);
    mo.spin = THREE.MathUtils.damp(mo.spin, 0, 1.3, dt);
    mo.yaw += mo.spin * dt;
    if (mo.spin < 0.25) {
      const home = Math.round(mo.yaw / (Math.PI * 2)) * Math.PI * 2;
      mo.yaw = THREE.MathUtils.damp(mo.yaw, home, 1.6, dt);
    }

    const p = progress.current ?? 0;
    const sway = reduced ? 0 : Math.sin(t * 0.32) * 0.22;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -0.18 + sway + mo.yaw + p * 0.9 + (reduced ? 0 : state.pointer.x * 0.2), 4, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, reduced ? 0 : state.pointer.y * -0.07, 3, dt);
    g.position.y = reduced ? 0 : Math.sin(t * 0.6) * 0.06;
  });

  return (
    <group ref={group} visible={reduced}>
      <mesh geometry={body}>
        {/* Clear glass: physical transmission refracts the burning wordmark behind it.
            (Dispersion is left off: it blew out to white on some GPUs/drivers in testing.) */}
        <meshPhysicalMaterial
          transmission={1}
          thickness={tier === "high" ? 0.75 : 0.55}
          roughness={0.04}
          ior={1.5}
          color="#e8eeff"
          attenuationColor={blue}
          attenuationDistance={3}
          specularIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0.04}
          envMapIntensity={1.35}
        />
      </mesh>
      {tubes.map((tube, i) => (
        <mesh key={i} geometry={tube}>
          <shaderMaterial
            ref={(m) => {
              flows.current[i] = m;
            }}
            args={[shaders[i]]}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** NINE LABS wordmark burning behind the glass (the glass bends it). */
const BURN_VERT = /* glsl */ `
  varying vec2 vP;
  void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const BURN_FRAG = /* glsl */ `
  uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform vec2 uSize; varying vec2 vP;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  void main() {
    vec2 uv = vP / uSize + 0.5;
    float n = noise(uv * vec2(9.0, 3.0) + vec2(uTime * 0.25, -uTime * 0.6));
    float n2 = noise(uv * vec2(22.0, 6.0) - vec2(uTime * 0.4, uTime * 0.9));
    float heat = 0.75 + 0.45 * n + 0.2 * n2;
    float flicker = 0.92 + 0.08 * sin(uTime * 7.0 + uv.x * 13.0);
    vec3 col = mix(uA, uB, smoothstep(0.15, 0.95, uv.x + (n - 0.5) * 0.25));
    col = col * heat * flicker * 1.02 + vec3(1.0) * pow(n2, 6.0) * 0.45;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Wordmark({ blue, purple, reduced }: { blue: string; purple: string; reduced: boolean }) {
  const geo = useMemo(() => {
    const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${WORDMARK.d3}"/></svg>`);
    const shapes = data.paths.flatMap((p) => p.toShapes());
    return new THREE.ShapeGeometry(shapes, 18);
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  const shader = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uA: { value: new THREE.Color() },
        uB: { value: new THREE.Color() },
        uSize: { value: new THREE.Vector2(WORDMARK.w, WORDMARK.h) },
      },
      vertexShader: BURN_VERT,
      fragmentShader: BURN_FRAG,
    }),
    [],
  );
  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame((state) => {
    const m = mat.current;
    if (!m) return;
    m.uniforms.uTime.value = reduced ? 3 : state.clock.elapsedTime;
    m.uniforms.uA.value.set(blue);
    m.uniforms.uB.value.set(purple);
  });
  const s = 8.6 / WORDMARK.w; // ~8.6 units wide
  return (
    <mesh geometry={geo} position={[0, 0.35, -3.4]} scale={[s, s, 1]}>
      <shaderMaterial ref={mat} args={[shader]} toneMapped={false} />
    </mesh>
  );
}

/** Small deterministic PRNG (mulberry32) — stable particle layout, pure during render. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Thousands of glowing particles that fly in and assemble into the 9 (GPU-animated). */
const PART_VERT = /* glsl */ `
  attribute vec3 aStart; attribute vec3 aTarget; attribute float aDelay; attribute float aSize;
  uniform float uT; uniform float uPx; varying float vMix; varying float vAlpha;
  float ease(float x) { return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0; }
  void main() {
    float k = clamp((uT - aDelay) / 1.5, 0.0, 1.0);
    float e = ease(k);
    vec3 p = mix(aStart, aTarget, e);
    // after the reveal, drift outward and fade into sparkles
    float after = max(0.0, uT - ${INTRO.reveal.toFixed(2)});
    p += normalize(aTarget + vec3(0.001)) * after * after * 0.9 + vec3(0.0, after * 0.25, 0.0);
    vAlpha = smoothstep(0.0, 0.25, k) * (1.0 - smoothstep(0.1, 1.1, after));
    vMix = clamp(aTarget.y * 0.25 + 0.5, 0.0, 1.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * uPx * (26.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const PART_FRAG = /* glsl */ `
  uniform vec3 uA; uniform vec3 uB; varying float vMix; varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uB, uA, vMix) * 1.6 + vec3(1.0) * smoothstep(0.18, 0.0, d) * 0.8;
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

function ParticleIntro({ glyph, count, blue, purple, intro }: { glyph: GlyphKey; count: number; blue: string; purple: string; intro: React.RefObject<IntroClock> }) {
  const geo = useMemo(() => {
    const g = GLYPHS[glyph];
    const rand = rng(909 + count);
    const shape = new Path2D(g.d);
    const probe = document.createElement("canvas").getContext("2d")!;
    const cy = (g.bounds.y0 + g.bounds.y1) / 2;
    const target = new Float32Array(count * 3);
    const start = new Float32Array(count * 3);
    const delay = new Float32Array(count);
    const size = new Float32Array(count);
    let n = 0;
    let guard = 0;
    while (n < count && guard++ < count * 40) {
      const x = g.bounds.x0 + rand() * (g.bounds.x1 - g.bounds.x0);
      const y = g.bounds.y0 + rand() * (g.bounds.y1 - g.bounds.y0);
      if (!probe.isPointInPath(shape, x, y)) continue;
      const tx = (x - 200) / 100;
      const ty = -(y - cy) / 100;
      const tz = (rand() - 0.5) * ((DEPTH + 2 * BEVEL_T) / 100);
      target.set([tx, ty, tz], n * 3);
      // start on a wide shell, a little below (rising from the sea)
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      const r = 6 + rand() * 6;
      start.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.6 - 1.2, r * Math.sin(ph) * Math.sin(th)], n * 3);
      delay[n] = (1 - (y - g.bounds.y0) / (g.bounds.y1 - g.bounds.y0)) * 0.55 + rand() * 0.35;
      size[n] = 0.6 + rand() * 1.4;
      n++;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(target.slice(0, n * 3), 3));
    geom.setAttribute("aTarget", new THREE.BufferAttribute(target.slice(0, n * 3), 3));
    geom.setAttribute("aStart", new THREE.BufferAttribute(start.slice(0, n * 3), 3));
    geom.setAttribute("aDelay", new THREE.BufferAttribute(delay.slice(0, n), 1));
    geom.setAttribute("aSize", new THREE.BufferAttribute(size.slice(0, n), 1));
    geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
    return geom;
  }, [glyph, count]);
  useEffect(() => () => geo.dispose(), [geo]);

  const shader = useMemo(
    () => ({
      uniforms: { uT: { value: -1 }, uPx: { value: 1 }, uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() } },
      vertexShader: PART_VERT,
      fragmentShader: PART_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    [],
  );
  const mat = useRef<THREE.ShaderMaterial>(null);
  const pts = useRef<THREE.Points>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  useFrame((state) => {
    const m = mat.current;
    const p = pts.current;
    if (!m || !p) return;
    const since = introTime(intro.current, state.clock.elapsedTime);
    p.visible = since >= 0 && since < INTRO.reveal + 1.4;
    m.uniforms.uT.value = since;
    m.uniforms.uPx.value = dpr;
    m.uniforms.uA.value.set(blue);
    m.uniforms.uB.value.set(purple);
  });

  return (
    <points ref={pts} geometry={geo} frustumCulled={false}>
      <shaderMaterial ref={mat} args={[shader]} toneMapped={false} />
    </points>
  );
}

/** Soft blue→purple aura behind the 9. */
function Aura({ blue, purple }: { blue: string; purple: string }) {
  const [tex] = useState(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.35, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  });
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <group position={[0, 0, -4.2]}>
      <mesh scale={[12, 10, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={tex} color={blue} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh scale={[18, 12, 1]} position={[1, -0.6, -0.5]}>
        <planeGeometry />
        <meshBasicMaterial map={tex} color={purple} transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Orbital tracks around the 9 with light comets — the path the nine activities travel. */
function Orbit({ blue, purple, reduced }: { blue: string; purple: string; reduced: boolean }) {
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  const visW = 2 * Math.hypot(REST.z, REST.y - REST.ty) * Math.tan(((FOV / 2) * Math.PI) / 180) * aspect;
  const R = Math.round(Math.min(Math.max(visW * 0.24, 3.1), 5.4) * 20) / 20;

  const dots = useMemo(() => {
    const n = 220;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * R * 0.86;
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = Math.sin(a) * R * 0.86;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [R]);
  useEffect(() => () => dots.dispose(), [dots]);

  const comets = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    const t = reduced ? 0 : state.clock.elapsedTime;
    comets.current.forEach((m, i) => {
      if (!m) return;
      const a = t * (i === 2 ? -0.22 : 0.3) + (i * Math.PI * 2) / 3;
      const r = i === 2 ? R * 0.86 : R;
      m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    });
  });

  return (
    <group position={[0, -0.25, 0]} rotation={[0, 0, (-4 * Math.PI) / 180]}>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[R, 0.006, 6, 320]} />
        <meshBasicMaterial color={purple} transparent opacity={0.4} toneMapped={false} />
      </mesh>
      <points geometry={dots}>
        <pointsMaterial color="#ffffff" size={0.03} sizeAttenuation transparent opacity={0.35} depthWrite={false} />
      </points>
      {[blue, purple, "#ffffff"].map((c, i) => (
        <mesh
          key={i}
          ref={(m) => {
            comets.current[i] = m;
          }}
        >
          <sphereGeometry args={[i === 2 ? 0.032 : 0.05, 16, 16]} />
          <meshBasicMaterial color={c} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** A calm mirror sea at night: blurred reflection with water-like distortion + a faint blueprint grid. */
function Sea({ tier, blue }: { tier: Tier; blue: string }) {
  const [ripples] = useState(() => {
    const n = 128;
    const data = new Uint8Array(n * n * 4);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v =
          0.5 +
          0.25 * Math.sin((x / n) * Math.PI * 12 + Math.sin((y / n) * Math.PI * 4) * 2) +
          0.15 * Math.sin((y / n) * Math.PI * 22 + (x / n) * 5) +
          0.1 * (Math.random() - 0.5);
        const b = Math.max(0, Math.min(255, Math.round(v * 255)));
        data.set([b, b, b, 255], (y * n + x) * 4);
      }
    const tex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  });
  useEffect(() => () => ripples.dispose(), [ripples]);

  return (
    <group position={[0, FLOOR_Y, 0]}>
      {tier === "high" ? (
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.005, 0]}>
          <planeGeometry args={[70, 70]} />
          <MeshReflectorMaterial
            blur={[320, 60]}
            resolution={512}
            mixBlur={0.9}
            mixStrength={38}
            mirror={0.35}
            roughness={0.9}
            depthScale={0.9}
            minDepthThreshold={0.35}
            maxDepthThreshold={1.3}
            distortion={0.32}
            distortionMap={ripples}
            color="#04050a"
            metalness={0.65}
          />
        </mesh>
      ) : (
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.005, 0]}>
          <planeGeometry args={[70, 70]} />
          <meshStandardMaterial color="#04050a" metalness={0.85} roughness={0.32} />
        </mesh>
      )}
      <Grid
        args={[70, 70]}
        cellSize={0.6}
        cellThickness={0.45}
        cellColor="#141a2b"
        sectionSize={3}
        sectionThickness={0.8}
        sectionColor={new THREE.Color(blue).multiplyScalar(0.4)}
        fadeDistance={tier === "high" ? 28 : 20}
        fadeStrength={1.8}
        infiniteGrid
      />
    </group>
  );
}

/** Starts the intro clock the first frame the canvas is actually shown. */
function IntroStarter({ play, onStart }: { play: boolean; onStart: (t: number) => void }) {
  useFrame((state) => {
    if (play) onStart(state.clock.elapsedTime);
  });
  return null;
}

function CameraRig({
  progress,
  reduced,
  intro,
  onReady,
  onSlow,
  perfGuard,
  budgetMs,
}: {
  progress: React.RefObject<number>;
  reduced: boolean;
  intro: React.RefObject<IntroClock>;
  onReady?: () => void;
  onSlow?: () => void;
  perfGuard: boolean;
  budgetMs: number;
}) {
  const frames = useRef(0);
  const sample = useRef({ t0: 0, decided: false, live: { t0: 0, n: 0, done: false } });
  const [target] = useState(() => new THREE.Vector3());

  useFrame((state, dt) => {
    const now = state.clock.elapsedTime;
    const start = intro.current?.start;
    const since = Math.max(0, introTime(intro.current, now));
    // 1) Reveal only once frames are confirmed smooth enough for this tier.
    if (!sample.current.decided) {
      frames.current++;
      if (frames.current === 8) sample.current.t0 = performance.now();
      if (frames.current === 32) {
        sample.current.decided = true;
        const avg = (performance.now() - sample.current.t0) / 24;
        if (!perfGuard || avg < budgetMs) onReady?.();
        else onSlow?.();
      }
    }
    // 2) Re-check once the glass is on screen (the expensive part), 3.2–5.2 s into the intro.
    const live = sample.current.live;
    if (perfGuard && start != null && !live.done) {
      if (since > 3.2 && live.n === 0) live.t0 = performance.now();
      if (since > 3.2) live.n++;
      if (since > 5.2 && live.n > 10) {
        live.done = true;
        const avg = (performance.now() - live.t0) / live.n;
        if (avg > budgetMs * 1.25) onSlow?.();
      }
    }
    const p = reduced ? 0 : (progress.current ?? 0);

    // rest pose, flown by scroll: orbit around and swoop down towards the sea
    const angle = p * 1.35;
    const dist = REST.z - 5.4 * Math.pow(p, 1.2);
    let x = Math.sin(angle) * dist;
    let y = REST.y - 1.6 * p;
    let z = Math.cos(angle) * dist;
    const ty = REST.ty - 0.5 * p;

    // intro dolly-in (synchronised with the particle assembly)
    const k = reduced ? 1 : Math.min(1, since / 3.2);
    const e = 1 - Math.pow(1 - k, 3);
    x = THREE.MathUtils.lerp(-2.6, x, e);
    y = THREE.MathUtils.lerp(4.6, y, e);
    z = THREE.MathUtils.lerp(17.5, z, e);

    const px = reduced ? 0 : state.pointer.x * 0.5;
    const py = reduced ? 0 : state.pointer.y * 0.28;
    const cam = state.camera;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, x + px, 4, dt);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, y + py, 4, dt);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, z, 4, dt);
    target.set(0, ty, 0);
    cam.lookAt(target);
  });
  return null;
}

export default function NineCinematic({
  progress,
  tier = "high",
  play = true,
  onReady,
  onSlow,
  perfGuard = true,
  className = "",
}: {
  progress: React.RefObject<number>;
  tier?: Tier;
  /** Start the intro (particles + dolly) — true once the canvas is actually visible. */
  play?: boolean;
  onReady?: () => void;
  onSlow?: () => void;
  perfGuard?: boolean;
  className?: string;
}) {
  const { settings, reduced } = useDemo();
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const intro = useRef<IntroClock>({ start: null });

  useEffect(() => {
    const f = parseFloat(new URLSearchParams(window.location.search).get("intro") ?? "");
    if (!Number.isNaN(f)) intro.current.freeze = f;
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const high = tier === "high";

  return (
    <div
      ref={wrap}
      className={`absolute inset-0 ${className}`}
      style={{
        WebkitMaskImage: "radial-gradient(56% 68% at 50% 42%, #000 60%, transparent 100%)",
        maskImage: "radial-gradient(56% 68% at 50% 42%, #000 60%, transparent 100%)",
      }}
      aria-hidden="true"
    >
      <Canvas
        dpr={high ? [1, 1.5] : [1, 1.3]}
        frameloop={visible && !reduced ? "always" : "demand"}
        camera={{ position: [-2.6, 4.6, 17.5], fov: FOV, near: 0.1, far: 160 }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      >
        <color attach="background" args={["#040409"]} />
        <fog attach="fog" args={["#040409", 16, 40]} />
        <ambientLight intensity={0.1} />
        <pointLight position={[3, 2, 4]} intensity={26} color={settings.purple} />
        <pointLight position={[-3, -1.5, 3]} intensity={20} color={settings.blue} />
        <Environment resolution={high ? 256 : 128}>
          <Lightformer intensity={2.6} color={settings.blue} position={[0, 5, -6]} scale={[12, 2, 1]} />
          <Lightformer intensity={2} color={settings.purple} position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
          <Lightformer intensity={1.6} color="#ffffff" position={[6, 2, 3]} rotation-y={-Math.PI / 2} scale={[8, 1, 1]} />
          <Lightformer intensity={0.8} color={settings.purple} position={[0, -5, 4]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
        </Environment>

        <Stars radius={70} depth={40} count={high ? 2600 : 1200} factor={3.2} saturation={0} fade speed={reduced ? 0 : 0.4} />
        <Aura blue={settings.blue} purple={settings.purple} />
        <Wordmark blue={settings.blue} purple={settings.purple} reduced={reduced} />
        <Nine blue={settings.blue} purple={settings.purple} glyph={settings.glyph} tier={tier} progress={progress} intro={intro} reduced={reduced} />
        {!reduced && <ParticleIntro glyph={settings.glyph} count={high ? 5200 : 2600} blue={settings.blue} purple={settings.purple} intro={intro} />}
        <Orbit blue={settings.blue} purple={settings.purple} reduced={reduced} />
        <Sea tier={tier} blue={settings.blue} />
        <Sparkles count={high ? 140 : 60} scale={[12, 6, 8]} position={[0, 0.2, 0]} size={2.4} speed={reduced ? 0 : 0.26} opacity={0.7} color={settings.purple} />
        <Sparkles count={high ? 90 : 36} scale={[10, 1.2, 10]} position={[0, FLOOR_Y + 0.4, 0]} size={1.8} speed={reduced ? 0 : 0.18} opacity={0.6} color={settings.blue} />
        <IntroStarter
          play={play}
          onStart={(t) => {
            if (intro.current.start == null) intro.current.start = t;
          }}
        />
        <CameraRig
          progress={progress}
          reduced={reduced}
          intro={intro}
          onReady={onReady}
          onSlow={onSlow}
          perfGuard={perfGuard}
          budgetMs={high ? 45 : 70}
        />

        <EffectComposer multisampling={0}>
          <Bloom intensity={high ? 1.35 : 1.1} luminanceThreshold={0.16} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette darkness={0.55} offset={0.3} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
