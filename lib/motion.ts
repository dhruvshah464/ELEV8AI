/**
 * KRIYA Motion System
 * Shared animation variants for Shiva (destruction/transformation)
 * and Vishnu (order/structure) design modalities.
 *
 * All animations are GPU-accelerated (transform + opacity only).
 * 60 FPS target. No layout-triggering properties.
 */

import type { Variants, Transition } from "framer-motion";

// ─── Shared Easing ─────────────────────────────────────────────────

export const kriyaEase = [0.22, 1, 0.36, 1] as const;
export const kriyaEaseOut = [0.16, 1, 0.3, 1] as const;

// ─── Shiva: Destruction + Transformation ───────────────────────────

/** Element dissolves away — used when completing/removing items */
export const shivaDissolve: Variants = {
  initial: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    scale: 0.97,
    filter: "blur(6px)",
    transition: { duration: 0.4, ease: kriyaEase },
  },
};

/** Element builds up from nothing — used when new content appears */
export const shivaBuild: Variants = {
  initial: { opacity: 0, y: 16, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: kriyaEase },
  },
};

/** Phase transition — full dissolve → rebuild cycle */
export const shivaTransform: Variants = {
  initial: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: kriyaEase },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    filter: "blur(8px)",
    transition: { duration: 0.35, ease: kriyaEaseOut },
  },
};

// ─── Vishnu: Order + Structure ─────────────────────────────────────

/** Staggered grid reveal — used for structured content grids */
export const vishnuContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

/** Individual grid child animation */
export const vishnuItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: kriyaEase },
  },
};

/** Ordered list reveal — tighter stagger for list items */
export const vishnuList: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const vishnuListItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: kriyaEase },
  },
};

// ─── Krishna: Guidance + Warmth ────────────────────────────────────

/** Gentle fade-in for guidance/mentor text */
export const krishnaReveal: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

// ─── Shared Transitions ────────────────────────────────────────────

export const springTransition: Transition = {
  type: "spring",
  damping: 25,
  stiffness: 300,
};

export const smoothTransition: Transition = {
  duration: 0.3,
  ease: kriyaEase,
};

/** Page-level transition config */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: kriyaEase },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.2 },
  },
};
