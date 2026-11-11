'use client';

import React, { useEffect, useRef } from 'react';

export type SpotlightShape = 'circle' | 'beam';

export type SpotlightCardProps = React.HTMLAttributes<HTMLDivElement> & {
  spotlightColor?: string;
  intensity?: number;
  spotlightSize?: number;
  softness?: number;
  shape?: SpotlightShape;
  borderGlow?: number;
  proximity?: number;
  smoothing?: number;
  ambient?: boolean;
  flare?: boolean;
  grain?: number;
  popScale?: number;
  theme?: 'dark' | 'light';
};

type Palette = { surface: string; border: string; shadow: string; light: string; fill: number; edge: number };

type Settings = {
  shape: SpotlightShape;
  fill: string;
  edge: string;
  size: number;
  intensity: number;
  borderGlow: number;
  proximity: number;
  smoothing: number;
  ambient: boolean;
  flare: boolean;
  grain: number;
  popScale: number;
};

const THEMES: Record<'dark' | 'light', Palette> = {
  dark: {
    surface: '#111111',
    border: 'rgba(255, 255, 255, 0.08)',
    shadow: '0 24px 48px -24px rgba(0, 0, 0, 0.6)',
    light: '#ffffff',
    fill: 1,
    edge: 1
  },
  light: {
    surface: '#ffffff',
    border: 'rgba(24, 24, 27, 0.1)',
    shadow: '0 1px 2px rgba(24, 24, 27, 0.04), 0 18px 40px -20px rgba(24, 24, 27, 0.16)',
    light: '#18181b',
    fill: 0.28,
    edge: 0.7
  }
};

const SHAPES: SpotlightShape[] = ['circle', 'beam'];

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const falloff = (color: string, softness: number) => {
  const soft = clamp(softness, 0, 1);
  const core = (1 - soft) ** 1.5 * 0.85;
  const stop = (alpha: number, at: number) =>
    `color-mix(in srgb, ${color} ${(alpha * 100).toFixed(2)}%, transparent) ${(at * 100).toFixed(2)}%`;
  const list = [stop(1, 0)];
  for (let i = 0; i <= 14; i++) {
    const t = core + ((1 - core) * i) / 14;
    const g = (t - core) / (1 - core);
    const smooth = 1 - g * g * (3 - 2 * g);
    const glow = Math.exp(-4.6 * g * g) * (1 - g ** 6);
    list.push(stop(smooth + (glow - smooth) * soft, t));
  }
  return list.join(', ');
};

const CARD =
  'relative isolate overflow-hidden rounded-3xl p-8 [background-color:var(--spotlight-card-surface)] [box-shadow:var(--spotlight-card-shadow)]';

const SpotlightCard = ({
  children,
  className = '',
  style,
  spotlightColor,
  intensity = 0.15,
  spotlightSize = 240,
  softness = 0.7,
  shape = 'circle',
  borderGlow = 0.6,
  proximity = 80,
  smoothing = 0.3,
  ambient = false,
  flare = true,
  grain = 0,
  popScale = 1,
  theme = 'dark',
  ...rest
}: SpotlightCardProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLSpanElement>(null);
  const grainRef = useRef<HTMLSpanElement>(null);
  const edgeRef = useRef<HTMLSpanElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const palette = THEMES[theme] ?? THEMES.dark;
  const color = spotlightColor ?? palette.light;
  const form = SHAPES.includes(shape) ? shape : 'circle';
  const settings: Settings = {
    shape: form,
    fill: falloff(color, softness),
    edge: falloff(color, 1),
    size: Math.max(20, spotlightSize),
    intensity: clamp(intensity, 0, 1) * palette.fill,
    borderGlow: clamp(borderGlow, 0, 1) * palette.edge,
    proximity: Math.max(0, proximity),
    smoothing: clamp(smoothing, 0, 1),
    ambient,
    flare,
    grain: clamp(grain, 0, 1),
    popScale: Math.max(1, popScale)
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    wakeRef.current?.();
  });

  useEffect(() => {
    const root = rootRef.current;
    const light = lightRef.current;
    const noise = grainRef.current;
    const edge = edgeRef.current;
    if (!root || !light || !noise || !edge) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const hoverQuery = window.matchMedia?.('(hover: hover) and (pointer: fine)');
    const canHover = () => (hoverQuery ? hoverQuery.matches : true);
    const state = {
      x: 0,
      y: 0,
      presence: 0,
      flare: 0,
      pop: 0,
      time: Math.random() * 60,
      pressed: false,
      visible: false,
      tapUntil: 0,
      suppressScrollUntil: 0,
      tapX: 0,
      tapY: 0,
      tapScrollY: 0,
      downX: 0,
      downY: 0,
      downMoved: false
    };
    const pointer = { x: 0, y: 0, active: false };
    const drawn = { light: '', edge: '', noise: '', transform: '', zIndex: '' };
    let focus: Element | null = null;
    let raf = 0;
    let tapTimer = 0;
    let suppressTimer = 0;
    let last = 0;
    let alive = true;

    const gradient = (s: Settings, size: number, x: number, y: number, stops: string) => {
      if (s.shape === 'beam') {
        const reach = Math.max(size * 0.6, y + size * 0.55);
        return `radial-gradient(${(size * 0.55).toFixed(1)}px ${reach.toFixed(1)}px at ${x.toFixed(1)}px 0px, ${stops})`;
      }
      return `radial-gradient(circle ${size.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, ${stops})`;
    };

    const paint = (s: Settings) => {
      const size = s.size * (1 + 0.2 * state.flare);
      const boost = 1 + 0.7 * state.flare;
      const fill = gradient(s, size, state.x, state.y, s.fill);
      const rim = gradient(s, size * 0.6, state.x, s.shape === 'beam' ? 0 : state.y, s.edge);
      if (fill !== drawn.light) {
        drawn.light = fill;
        light.style.background = fill;
      }
      if (rim !== drawn.edge) {
        drawn.edge = rim;
        edge.style.background = rim;
      }
      light.style.opacity = String(Math.min(1, state.presence * s.intensity * boost));
      edge.style.opacity = String(Math.min(1, state.presence * s.borderGlow * boost));
      const grainy = s.grain > 0 ? gradient(s, size, state.x, state.y, '#000 0%, transparent 100%') : 'none';
      if (grainy !== drawn.noise) {
        drawn.noise = grainy;
        noise.style.webkitMaskImage = grainy;
        noise.style.maskImage = grainy;
      }
      noise.style.opacity = String(state.presence * s.grain);

      if (s.popScale > 1 && !reduce) {
        const gain = (s.popScale - 1) * state.pop;
        const dip = state.pressed && s.flare ? 0.016 * state.flare : 0;
        const scale = Math.max(0.97, 1 + gain - dip);
        const liftY = -5 * state.pop + (state.pressed && s.flare ? 2 * state.flare : 0);
        const active = Math.abs(scale - 1) > 0.0005 || Math.abs(liftY) > 0.05;
        const transform = active ? `translate3d(0, ${liftY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})` : '';
        const zIndex = state.pop > 0.02 ? '10' : '';
        if (transform !== drawn.transform) {
          drawn.transform = transform;
          root.style.transform = transform;
        }
        if (zIndex !== drawn.zIndex) {
          drawn.zIndex = zIndex;
          root.style.zIndex = zIndex;
        }
      } else if (drawn.transform || drawn.zIndex) {
        drawn.transform = '';
        drawn.zIndex = '';
        root.style.transform = '';
        root.style.zIndex = '';
      }
    };

    const tick = (now: number) => {
      raf = 0;
      if (!alive) return;
      const s = settingsRef.current;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const rect = root.getBoundingClientRect();
      const hoverCapable = canHover();
      let tx = state.x;
      let ty = state.y;
      let target = 0;
      let popTarget = 0;
      if (focus && root.contains(focus)) {
        const box = focus.getBoundingClientRect();
        tx = box.left + box.width / 2 - rect.left;
        ty = box.top + box.height / 2 - rect.top;
        target = 1;
        popTarget = 1;
      } else if (now < state.tapUntil && s.popScale > 1 && state.visible) {
        tx = state.tapX;
        ty = state.tapY;
        target = 1;
        popTarget = 1;
      } else if (hoverCapable && pointer.active) {
        tx = pointer.x - rect.left;
        ty = pointer.y - rect.top;
        const gap = Math.hypot(Math.max(0, -tx, tx - rect.width), Math.max(0, -ty, ty - rect.height));
        if (gap === 0) {
          target = 1;
          popTarget = 1;
        } else if (s.proximity > 0) {
          target = Math.max(0, 1 - gap / s.proximity) ** 2;
        }
      } else if (!hoverCapable && s.popScale > 1 && state.visible && now >= state.suppressScrollUntil) {
        const vh = window.innerHeight || 1;
        const cy = rect.top + rect.height / 2;
        const band = vh * 0.26;
        const raw = clamp(1 - Math.abs(cy - vh * 0.48) / band, 0, 1);
        const scrollFocus = raw * raw * (3 - 2 * raw);
        if (scrollFocus > 0.12) {
          tx = rect.width * 0.5;
          ty = rect.height * 0.34;
          target = scrollFocus * 0.92;
          popTarget = scrollFocus;
        }
      }
      if (target < 0.6 && s.ambient && state.visible) {
        if (!reduce) state.time += dt;
        const drift = 0.6 - target;
        tx += (rect.width * (0.5 + 0.34 * Math.sin(state.time * 0.43)) - tx) * (drift / 0.6);
        ty += (rect.height * (0.5 + 0.3 * Math.sin(state.time * 0.61 + 1.3)) - ty) * (drift / 0.6);
        target = 0.6;
      }
      if (state.presence < 0.02 && target > 0 && !s.ambient) {
        state.x = tx;
        state.y = ty;
      }
      const follow = reduce || s.smoothing === 0 ? 1 : 1 - Math.exp(-dt / (0.015 + s.smoothing * 0.22));
      state.x += (tx - state.x) * follow;
      state.y += (ty - state.y) * follow;
      const fade = reduce ? 1 : 1 - Math.exp(-dt / (target > state.presence ? 0.1 : 0.32));
      state.presence += (target - state.presence) * fade;
      if (Math.abs(target - state.presence) < 0.002) state.presence = target;
      const press = state.pressed && s.flare && !reduce ? 1 : 0;
      state.flare += (press - state.flare) * (1 - Math.exp(-dt / (press ? 0.05 : 0.28)));
      if (Math.abs(press - state.flare) < 0.002) state.flare = press;
      const popSpeed = reduce || s.popScale <= 1 ? 1 : 1 - Math.exp(-dt / (popTarget > state.pop ? 0.095 : 0.15));
      state.pop += (popTarget - state.pop) * popSpeed;
      if (Math.abs(popTarget - state.pop) < 0.002 || s.popScale <= 1 || reduce) {
        state.pop = s.popScale <= 1 || reduce ? 0 : popTarget;
      }
      paint(s);
      const moving = Math.abs(tx - state.x) > 0.1 || Math.abs(ty - state.y) > 0.1;
      const settled =
        !moving && state.presence === target && state.flare === press && state.pop === (s.popScale <= 1 || reduce ? 0 : popTarget);
      if (!settled || (s.ambient && state.visible && !reduce)) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (raf || !alive) return;
      if (!state.visible && state.presence <= 0 && state.pop <= 0 && !focus) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    wakeRef.current = wake;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        if (!state.downMoved && Math.hypot(event.clientX - state.downX, event.clientY - state.downY) > 10) {
          state.downMoved = true;
          if (state.pressed) {
            state.pressed = false;
            wake();
          }
        }
        return;
      }
      state.tapUntil = 0;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      if (!state.visible && state.presence <= 0 && state.pop <= 0) return;
      if (state.presence > 0 || state.pop > 0 || settingsRef.current.proximity > 0 || root.contains(event.target as Node | null)) wake();
    };
    const onOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      pointer.active = false;
      if (state.visible || state.presence > 0 || state.pop > 0) wake();
    };
    const onDown = (event: PointerEvent) => {
      state.downX = event.clientX;
      state.downY = event.clientY;
      state.downMoved = false;
      if (event.pointerType === 'mouse') {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.active = true;
      }
      state.pressed = true;
      wake();
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        pointer.active = false;
        const wasTap = !state.downMoved && settingsRef.current.popScale > 1 && root.contains(event.target as Node | null);
        state.pressed = false;
        if (wasTap) {
          const rect = root.getBoundingClientRect();
          state.tapX = clamp(event.clientX - rect.left, 0, rect.width);
          state.tapY = clamp(event.clientY - rect.top, 0, rect.height);
          state.tapScrollY = window.scrollY;
          const until = performance.now() + 2400;
          state.tapUntil = until;
          state.suppressScrollUntil = 0;
          window.clearTimeout(tapTimer);
          tapTimer = window.setTimeout(wake, 2420);
          window.dispatchEvent(new CustomEvent('spotlight-card:tap', { detail: { target: root, until } }));
        }
        wake();
        return;
      }
      if (!state.pressed) return;
      state.pressed = false;
      wake();
    };
    const onPeerTap = (event: Event) => {
      const detail = (event as CustomEvent<{ target: HTMLElement; until: number }>).detail;
      if (!detail || detail.target === root) return;
      state.tapUntil = 0;
      state.suppressScrollUntil = detail.until;
      window.clearTimeout(suppressTimer);
      suppressTimer = window.setTimeout(wake, Math.max(0, detail.until - performance.now()) + 20);
      if (state.presence > 0 || state.pop > 0) wake();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof Element) || !event.target.matches(':focus-visible')) return;
      focus = event.target;
      wake();
    };
    const onFocusOut = (event: FocusEvent) => {
      if (root.contains(event.relatedTarget as Node | null)) return;
      focus = null;
      wake();
    };
    const onScroll = () => {
      state.suppressScrollUntil = 0;
      if (state.tapUntil && Math.abs(window.scrollY - state.tapScrollY) > 100) {
        state.tapUntil = 0;
      }
      if (!canHover() && settingsRef.current.popScale > 1) {
        if (state.visible || state.presence > 0 || state.pop > 0) wake();
        return;
      }
      if ((state.visible || state.presence > 0 || state.pop > 0) && (pointer.active || state.presence > 0 || state.pop > 0)) wake();
    };

    const observer = new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting);
      if (state.visible || state.presence > 0 || state.pop > 0) wake();
    });
    observer.observe(root);
    window.addEventListener('spotlight-card:tap', onPeerTap);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    document.addEventListener('pointerout', onOut);
    root.addEventListener('pointerdown', onDown, { passive: true });
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(tapTimer);
      window.clearTimeout(suppressTimer);
      observer.disconnect();
      window.removeEventListener('spotlight-card:tap', onPeerTap);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('scroll', onScroll, { capture: true });
      document.removeEventListener('pointerout', onOut);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      wakeRef.current = null;
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`${CARD}${className ? ` ${className}` : ''}`}
      style={
        {
          '--spotlight-card-surface': palette.surface,
          '--spotlight-card-border': palette.border,
          '--spotlight-card-shadow': palette.shadow,
          ...style
        } as React.CSSProperties
      }
      {...rest}
    >
      <span
        ref={lightRef}
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0"
        aria-hidden="true"
      />
      <span
        ref={grainRef}
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[length:160px_160px] opacity-0 mix-blend-overlay"
        style={{ backgroundImage: NOISE }}
        aria-hidden="true"
      />
      {children}
      <span
        className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] p-px [background:var(--spotlight-card-border)] [-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [-webkit-mask-composite:xor] [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]"
        aria-hidden="true"
      />
      <span
        ref={edgeRef}
        className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] p-px opacity-0 [-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [-webkit-mask-composite:xor] [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]"
        aria-hidden="true"
      />
    </div>
  );
};

export default SpotlightCard;
