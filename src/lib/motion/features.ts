// Loaded with a dynamic import by LazyMotion, so Motion's animation engine is fetched after the
// page is interactive instead of blocking the first load. Switch to `domMax` only if a screen
// needs drag or layout animations, and then load it on that screen alone.
export { domAnimation as default } from "motion/react";
