"use client";

import { useEffect, useRef, useState, memo } from "react";

/**
 * KRIYA App Background — Performance-Optimized
 *
 * Changes from previous version:
 * - Particles moved to pure CSS @keyframes (no React re-renders)
 * - Ambient orbs use CSS animations instead of Framer Motion
 * - Pointer follower uses CSS custom properties + RAF (no state updates)
 * - Device-adaptive: reduced visuals on low-end devices
 * - Respects prefers-reduced-motion
 */

function AppBackgroundInner() {
  const pointerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip pointer tracking on touch devices
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice || !pointerRef.current) return;

    let rafId = 0;
    let latestX = 0;
    let latestY = 0;

    const handlePointerMove = (event: PointerEvent) => {
      latestX = event.clientX;
      latestY = event.clientY;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (pointerRef.current) {
            pointerRef.current.style.transform = `translate3d(${latestX - 72}px, ${latestY - 72}px, 0)`;
          }
          rafId = 0;
        });
      }
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Base gradient — pure CSS, no JS */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at top, var(--kriya-gradient-start), transparent 28%),
            radial-gradient(circle at 80% 20%, var(--kriya-gradient-end), transparent 24%),
            linear-gradient(180deg, hsl(var(--kriya-surface)) 0%, hsl(var(--kriya-surface-raised)) 48%, hsl(var(--kriya-surface)) 100%)
          `,
        }}
      />

      {/* Grid overlay — static CSS */}
      <div className="absolute inset-0 bg-grid-premium opacity-30" />

      {/* Ambient orbs — CSS-only animations */}
      <div className="kriya-orb kriya-orb--primary" />
      <div className="kriya-orb kriya-orb--accent" />

      {/* Particles — CSS-only, no React components */}
      <div className="kriya-particles" aria-hidden="true">
        <span className="kriya-particle" style={{ top: "12%", left: "10%", animationDelay: "0s", animationDuration: "18s" }} />
        <span className="kriya-particle" style={{ top: "29%", left: "33%", animationDelay: "1.2s", animationDuration: "22s" }} />
        <span className="kriya-particle" style={{ top: "46%", left: "56%", animationDelay: "2.4s", animationDuration: "20s" }} />
        <span className="kriya-particle" style={{ top: "63%", left: "79%", animationDelay: "0.6s", animationDuration: "24s" }} />
        <span className="kriya-particle" style={{ top: "80%", left: "18%", animationDelay: "1.8s", animationDuration: "19s" }} />
      </div>

      {/* Pointer follower — CSS transform only, no state rerenders */}
      <div
        ref={pointerRef}
        className="kriya-pointer-follower"
        style={{
          background: `radial-gradient(circle, hsl(var(--kriya-primary) / 0.18), transparent 68%)`,
        }}
      />
    </div>
  );
}

export const AppBackground = memo(AppBackgroundInner);
