"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Grid, Lightformer, MeshReflectorMaterial, Sparkles } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { GLYPHS, type GlyphKey } from "./nine-path";
import { useDemo } from "@/components/providers/DemoSettings";

/**
 * Concept C — "Cinematic 3D" (the recommended hero).
 *
 * A chrome-and-glass 9 with a neon core where light pulses flow along the line,
 * standing on a receding blueprint floor with a soft reflection, circled by orbital
 * tracks with light "comets" (where the nine activities travel). The camera dollies in
 * on load and flies around the 9 as the visitor scrolls out of the hero.
 * Two quality tiers: "high" (desktop) and "low" (phones / modest GPUs).
 */

export type Tier = "high" | "low";

const FLOOR_Y = -2.62;
const FOV = 35;
const REST = { y: 2.1, z: 10.6, ty: 0.12 };

// Extrusion in glyph units (the glyph is 478 units tall); scaled ×0.01 into the scene.
const DEPTH = 52;
const BEVEL_T = 14;
const BEVEL_S = 10;

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
      bevelSegments: 8,
      curveSegments: 36,
    });
    body.translate(-200, -cy, -DEPTH / 2);
    body.scale(0.01, 0.01, 0.01);
    body.computeVertexNormals();
    return { body, contours };
  }, [glyph]);
}

/** Neon core shader: base colour + light bands that travel along the tube (uv.x runs along the 9). */
const FLOW_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const FLOW_FRAG = /* glsl */ `
  uniform float uTime; uniform vec3 uA; uniform vec3 uB; varying vec2 vUv;
  float band(float x, float c, float w) { float d = fract(x - c + 0.5) - 0.5; return exp(-d * d * w); }
  void main() {
    float x = vUv.x;
    vec3 base = mix(uA, uB, smoothstep(0.78, 1.0, x)) * 1.55;
    float b1 = band(x, fract(uTime * 0.11), 900.0);
    float b2 = band(x, fract(uTime * 0.11 + 0.5), 1400.0);
    vec3 col = base + vec3(1.0) * b1 * 2.6 + uB * b2 * 2.2;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Nine({
  blue,
  purple,
  glyph,
  progress,
  reduced,
}: {
  blue: string;
  purple: string;
  glyph: GlyphKey;
  progress: React.RefObject<number>;
  reduced: boolean;
}) {
  const { body, contours } = useGlyph(glyph);
  const tubes = useMemo(() => contours.map((c, i) => new THREE.TubeGeometry(c, i === 0 ? 900 : 500, 0.032, 10, true)), [contours]);
  const shaders = useMemo(
    () =>
      tubes.map(() => ({
        uniforms: { uTime: { value: 0 }, uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() } },
        vertexShader: FLOW_VERT,
        fragmentShader: FLOW_FRAG,
      })),
    [tubes],
  );
  const flows = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const group = useRef<THREE.Group>(null);

  useEffect(
    () => () => {
      body.dispose();
      tubes.forEach((t) => t.dispose());
    },
    [body, tubes],
  );

  useFrame((state, dt) => {
    flows.current.forEach((m, i) => {
      if (!m) return;
      m.uniforms.uTime.value = (reduced ? 2 : state.clock.elapsedTime) + i * 3.7;
      m.uniforms.uA.value.set(blue);
      m.uniforms.uB.value.set(purple);
    });
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const p = progress.current ?? 0;
    const targetY = reduced ? -0.16 : -0.16 + Math.sin(t * 0.32) * 0.26 + p * 0.9;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY + (reduced ? 0 : state.pointer.x * 0.25), 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, reduced ? 0 : state.pointer.y * -0.07, 3, dt);
    g.position.y = reduced ? 0 : Math.sin(t * 0.6) * 0.05;
  });

  return (
    <group ref={group}>
      <mesh geometry={body}>
        {/* group 0: front/back faces — dark glass with an inner blue glow */}
        <meshPhysicalMaterial
          attach="material-0"
          color="#070b1f"
          emissive={blue}
          emissiveIntensity={0.1}
          metalness={0.55}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1.4}
        />
        {/* group 1: sides + bevel — polished chrome catching the light */}
        <meshPhysicalMaterial
          attach="material-1"
          color="#c9d4ff"
          metalness={1}
          roughness={0.13}
          clearcoat={1}
          clearcoatRoughness={0.04}
          envMapIntensity={1.9}
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
    <group position={[0, 0, -1.6]}>
      <mesh scale={[9, 9, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={tex} color={blue} transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh scale={[14, 11, 1]} position={[0.6, -0.4, -0.5]}>
        <planeGeometry />
        <meshBasicMaterial map={tex} color={purple} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Orbital tracks around the 9 with light comets — the path the nine activities travel. */
function Orbit({ blue, purple, reduced }: { blue: string; purple: string; reduced: boolean }) {
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  // Roughly match the DOM orbit: ~37% of the visible width at the rest distance.
  const visW = 2 * Math.hypot(REST.z, REST.y - REST.ty) * Math.tan(((FOV / 2) * Math.PI) / 180) * aspect;
  const R = Math.round(Math.min(Math.max(visW * 0.24, 2.9), 5.2) * 20) / 20;

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
    <group position={[0, -0.15, 0]} rotation={[0, 0, (-4 * Math.PI) / 180]}>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[R, 0.007, 6, 320]} />
        <meshBasicMaterial color={purple} transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <points geometry={dots}>
        <pointsMaterial color="#ffffff" size={0.035} sizeAttenuation transparent opacity={0.45} depthWrite={false} />
      </points>
      {[blue, purple, "#ffffff"].map((c, i) => (
        <mesh
          key={i}
          ref={(m) => {
            comets.current[i] = m;
          }}
        >
          <sphereGeometry args={[i === 2 ? 0.035 : 0.055, 16, 16]} />
          <meshBasicMaterial color={c} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Floor({ tier, blue }: { tier: Tier; blue: string }) {
  return (
    <group position={[0, FLOOR_Y, 0]}>
      {tier === "high" ? (
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.005, 0]}>
          <planeGeometry args={[60, 60]} />
          <MeshReflectorMaterial
            blur={[240, 70]}
            resolution={384}
            mixBlur={1}
            mixStrength={26}
            roughness={1}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#050507"
            metalness={0.6}
            mirror={0}
          />
        </mesh>
      ) : (
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.005, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#050507" metalness={0.8} roughness={0.35} />
        </mesh>
      )}
      <Grid
        args={[60, 60]}
        cellSize={0.6}
        cellThickness={0.55}
        cellColor="#1c2338"
        sectionSize={3}
        sectionThickness={1}
        sectionColor={new THREE.Color(blue).multiplyScalar(0.55)}
        fadeDistance={tier === "high" ? 26 : 20}
        fadeStrength={1.6}
        infiniteGrid
      />
    </group>
  );
}

function CameraRig({
  progress,
  reduced,
  onReady,
  onSlow,
  perfGuard,
}: {
  progress: React.RefObject<number>;
  reduced: boolean;
  onReady?: () => void;
  onSlow?: () => void;
  perfGuard: boolean;
}) {
  const start = useRef<number | null>(null);
  const frames = useRef(0);
  const sample = useRef({ t0: 0, decided: false });
  const [target] = useState(() => new THREE.Vector3());

  useFrame((state, dt) => {
    // Reveal only once frames are confirmed smooth; weak GPUs keep the neon poster instead.
    if (!sample.current.decided) {
      frames.current++;
      if (frames.current === 8) sample.current.t0 = performance.now();
      if (frames.current === 32) {
        sample.current.decided = true;
        const avg = (performance.now() - sample.current.t0) / 24;
        if (!perfGuard || avg < 70) onReady?.();
        else onSlow?.();
      }
    }
    const now = state.clock.elapsedTime;
    if (start.current == null) start.current = now;
    const p = reduced ? 0 : (progress.current ?? 0);

    // rest pose, flown by scroll: orbit around and swoop down towards the floor
    const angle = p * 1.35;
    const dist = REST.z - 5.6 * Math.pow(p, 1.2);
    let x = Math.sin(angle) * dist;
    let y = REST.y - 1.9 * p;
    let z = Math.cos(angle) * dist;
    const ty = REST.ty - 0.6 * p;

    // intro dolly-in
    const k = reduced ? 1 : Math.min(1, (now - start.current) / 2.8);
    const e = 1 - Math.pow(1 - k, 3);
    x = THREE.MathUtils.lerp(-2.4, x, e);
    y = THREE.MathUtils.lerp(5.2, y, e);
    z = THREE.MathUtils.lerp(17, z, e);

    const px = reduced ? 0 : state.pointer.x * 0.55;
    const py = reduced ? 0 : state.pointer.y * 0.3;
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
  onReady,
  onSlow,
  perfGuard = true,
  className = "",
}: {
  progress: React.RefObject<number>;
  tier?: Tier;
  onReady?: () => void;
  onSlow?: () => void;
  perfGuard?: boolean;
  className?: string;
}) {
  const { settings, reduced } = useDemo();
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

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
        WebkitMaskImage: "radial-gradient(54% 66% at 50% 40%, #000 60%, transparent 100%)",
        maskImage: "radial-gradient(54% 66% at 50% 40%, #000 60%, transparent 100%)",
      }}
      aria-hidden="true"
    >
      <Canvas
        dpr={high ? [1, 1.5] : [1, 1.3]}
        frameloop={visible && !reduced ? "always" : "demand"}
        camera={{ position: [-2.4, 5.2, 17], fov: FOV, near: 0.1, far: 120 }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      >
        <color attach="background" args={["#050507"]} />
        <fog attach="fog" args={["#050507", 14, 34]} />
        <ambientLight intensity={0.12} />
        <pointLight position={[3, 2, 4]} intensity={30} color={settings.purple} />
        <pointLight position={[-3, -1.5, 3]} intensity={22} color={settings.blue} />
        <Environment resolution={high ? 256 : 128}>
          <Lightformer intensity={2.4} color={settings.blue} position={[0, 5, -6]} scale={[12, 2, 1]} />
          <Lightformer intensity={1.8} color={settings.purple} position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
          <Lightformer intensity={1.2} color="#ffffff" position={[6, 2, 3]} rotation-y={-Math.PI / 2} scale={[8, 1, 1]} />
          <Lightformer intensity={0.8} color={settings.purple} position={[0, -5, 4]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
        </Environment>

        <Aura blue={settings.blue} purple={settings.purple} />
        <Nine blue={settings.blue} purple={settings.purple} glyph={settings.glyph} progress={progress} reduced={reduced} />
        <Orbit blue={settings.blue} purple={settings.purple} reduced={reduced} />
        <Floor tier={tier} blue={settings.blue} />
        <Sparkles count={high ? 170 : 70} scale={[12, 7, 8]} position={[0, 0.4, 0]} size={2.6} speed={reduced ? 0 : 0.28} opacity={0.75} color={settings.purple} />
        <Sparkles count={high ? 110 : 40} scale={[9, 6, 6]} size={2} speed={reduced ? 0 : 0.2} opacity={0.6} color={settings.blue} />
        <CameraRig progress={progress} reduced={reduced} onReady={onReady} onSlow={onSlow} perfGuard={perfGuard} />

        <EffectComposer multisampling={0}>
          <Bloom intensity={high ? 1.45 : 1.15} luminanceThreshold={0.14} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette darkness={0.5} offset={0.3} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
