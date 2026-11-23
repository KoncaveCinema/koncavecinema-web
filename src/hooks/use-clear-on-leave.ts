import { useEffect, useEffectEvent } from "react";

/**
 * Clears a form when its page is left. Next keeps a page alive, hidden, after navigating away,
 * and shows it again exactly as it was on the way back: without this, what one person typed (an
 * email, a password, a "Checking…" button) is still there for the next visit, even after signing
 * out. React runs the cleanup as the page is hidden, so the next visit always starts empty, and
 * nothing clears while the person is still looking at it. (In development React also runs it once
 * on opening, on an empty form: harmless.)
 */
export function useClearOnLeave(clear: () => void) {
  const onLeave = useEffectEvent(clear);
  useEffect(() => () => onLeave(), []);
}
