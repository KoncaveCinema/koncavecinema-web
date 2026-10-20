/**
 * The only entry point for Motion in this app (rules in docs/architecture/performance.md).
 *
 * - `m.*` components render with the lazily loaded features from LazyMotion; the full `motion.*`
 *   components are blocked by ESLint because they bundle the whole engine.
 * - Animate `transform` and `opacity` (and `filter` / `clip-path`): Motion runs these on the
 *   compositor through the Web Animations API, so they stay smooth while React is busy.
 * - Route changes and shared elements across pages use React's <ViewTransition>, not Motion.
 */
"use client";

export * as m from "motion/react-m";
export {
  AnimatePresence,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
// 2 KB imperative animations (Web Animations API only), for one-off effects without a component
export { useAnimate as useMiniAnimate } from "motion/react-mini";
