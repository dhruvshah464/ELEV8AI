"use client";

import { type ReactNode } from "react";
import { ReactLenis } from "lenis/react";

export function SmoothScroller({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      {children as any}
    </ReactLenis>
  );
}
