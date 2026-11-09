"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Service } from "@/content/site";
import { ServiceCard } from "./ServiceCard";

export type ServiceCardsGalleryProps = {
  services: Service[];
  active: number;
  onSelect: (index: number) => void;
  /** Normalized progress from GSAP ScrollTrigger (0 to LAST) */
  scrollProgress: number;
  /** CircularGallery parameters */
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  scrollEase?: number;
  gap?: number;
  wave?: number;
  fadeEdges?: number;
  onItemClick?: (item: Service, index: number) => void;
  className?: string;
};

/**
 * ServiceCardsGallery
 * 
 * Adapts React Bits' CircularGallery layout and animation engine (JS-CSS variant)
 * for the interactive Service Cards.
 * 
 * Features:
 * - Smooth horizontal momentum gliding with configurable `scrollEase` (default 0.05).
 * - Exact gap spacing (`gap` = 0.16) and edge fading (`fadeEdges` = 0.2).
 * - Touch & pointer drag with inertia flick and automatic snapping.
 * - Two-way sync with page scroll and 3D particle digits (untouched).
 * - Zero modification to inner card content, size, or styling.
 */
export function ServiceCardsGallery({
  services,
  active,
  onSelect,
  scrollProgress,
  scrollEase = 0.05,
  gap = 0.16,
  fadeEdges = 0.2,
  onItemClick,
  className = "",
}: ServiceCardsGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<number>(scrollProgress);
  const currentRef = useRef<number>(scrollProgress);
  const [currentProgress, setCurrentProgress] = useState<number>(scrollProgress);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, progress: 0, time: 0 });
  const velocityRef = useRef(0);

  const snappingTargetRef = useRef<number | null>(null);

  // Keep targetRef updated when external scrollProgress changes (and not dragging or snapping)
  useEffect(() => {
    if (isDraggingRef.current) return;
    if (snappingTargetRef.current !== null) {
      if (Math.abs(scrollProgress - snappingTargetRef.current) < 0.1) {
        snappingTargetRef.current = null;
      } else {
        return;
      }
    }
    targetRef.current = scrollProgress;
  }, [scrollProgress]);

  // Smooth lerp animation loop matching CircularGallery's scrollEase
  useEffect(() => {
    let rafId: number;

    const animate = () => {
      const target = targetRef.current;
      const current = currentRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.0002) {
        currentRef.current += diff * scrollEase;
        setCurrentProgress(currentRef.current);
      } else if (current !== target) {
        currentRef.current = target;
        setCurrentProgress(target);
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [scrollEase]);

  // Pointer drag gestures with momentum & snap
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary mouse button or touch
    if (e.button !== 0 && e.pointerType === "mouse") return;
    // Don't intercept clicks on buttons or links
    if ((e.target as HTMLElement).closest("button, a")) return;

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      progress: currentRef.current,
      time: performance.now(),
    };
    velocityRef.current = 0;

    const container = containerRef.current;
    if (container) {
      container.setPointerCapture?.(e.pointerId);
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Check if user is scrolling vertically; if so, release horizontal drag
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10 && Math.abs(dx) < 8) {
      isDraggingRef.current = false;
      return;
    }

    const container = containerRef.current;
    const width = container ? container.clientWidth : 520;
    const progressDelta = -dx / (width * (1 + gap));
    const newProgress = Math.max(0, Math.min(services.length - 1, dragStartRef.current.progress + progressDelta));

    const now = performance.now();
    const dt = Math.max(16, now - dragStartRef.current.time);
    velocityRef.current = (-dx / dt) * 0.15;

    targetRef.current = newProgress;
    currentRef.current = newProgress;
    setCurrentProgress(newProgress);
  }, [gap, services.length]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const container = containerRef.current;
    if (container && container.hasPointerCapture?.(e.pointerId)) {
      container.releasePointerCapture(e.pointerId);
    }

    // Snap to nearest card factoring in momentum velocity
    const projected = currentRef.current + velocityRef.current;
    const nearest = Math.max(0, Math.min(services.length - 1, Math.round(projected)));

    snappingTargetRef.current = nearest;
    targetRef.current = nearest;
    onSelect(nearest);

    setTimeout(() => {
      snappingTargetRef.current = null;
    }, 1000);
  }, [onSelect, services.length]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-[520px] select-none touch-pan-y ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        WebkitMaskImage: fadeEdges > 0 ? "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)" : undefined,
        maskImage: fadeEdges > 0 ? "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)" : undefined,
      }}
    >
      {/* Invisible sizer card to establish responsive container height dynamically */}
      <div className="invisible pointer-events-none select-none relative" aria-hidden="true">
        <ServiceCard service={services[0]} mode="stage" active={false} />
      </div>

      {/* Animated cards track */}
      {services.map((s, i) => {
        const offset = (i - currentProgress) * (1 + gap);
        const xPercent = offset * 100;
        const dist = Math.abs(i - currentProgress);
        const isCurrent = i === active;

        // Scaling effect matching CircularGallery subtle depth
        const scale = Math.max(0.92, 1 - Math.min(1, dist) * 0.05);

        // Opacity falloff using fadeEdges ratio
        const fadeThreshold = Math.max(0.1, fadeEdges);
        const opacity = dist <= fadeThreshold ? 1 : Math.max(0, 1 - (dist - fadeThreshold) * 1.5);
        const isVisible = dist < 1.4;

        return (
          <div
            key={s.slug}
            className="stage-card absolute inset-0 w-full transition-opacity duration-300"
            style={{
              transform: `translate3d(${xPercent.toFixed(2)}%, 0, 0) scale(${scale.toFixed(3)})`,
              opacity: opacity.toFixed(3),
              visibility: isVisible ? "visible" : "hidden",
              pointerEvents: isCurrent ? "auto" : "none",
              willChange: "transform, opacity",
              zIndex: isCurrent ? 20 : 10 - Math.min(9, Math.floor(dist * 2)),
            }}
            data-on={isCurrent ? "true" : "false"}
            inert={!isCurrent}
            onClick={() => {
              onItemClick?.(s, i);
              if (!isCurrent) onSelect(i);
            }}
          >
            <ServiceCard service={s} mode="stage" active={isCurrent} />
          </div>
        );
      })}
    </div>
  );
}
