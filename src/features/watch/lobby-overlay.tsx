// Client code without its own "use client": only the watch room (already a client component)
// imports it.

import { useServerNow } from "@/hooks/use-now";
import { formatCountdown } from "@/lib/format";

/** The countdown itself: the one part of the lobby that changes every second */
function StartsIn({ startsAt }: { startsAt: number }) {
  const now = useServerNow();
  return <>{now === null ? "…" : formatCountdown(startsAt - now)}</>;
}

/**
 * The lobby's countdown over the stage. Light on purpose: the page shows it as soon as the pass
 * loads, and the film player (a large script) takes over the same spot once it has loaded.
 */
export function LobbyOverlay({
  startsAt,
  ownPace,
  endsAt,
}: {
  startsAt: number;
  ownPace: boolean;
  /** When access ends, as a clock time (Individual Watch) */
  endsAt: string;
}) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center text-center">
      <div>
        <p className="text-[0.7rem] font-bold tracking-[0.3em] text-lobby uppercase">
          Lobby open · starts in
        </p>
        <p className="mt-3 font-display text-5xl font-black tabular-nums sm:text-7xl">
          <StartsIn startsAt={startsAt} />
        </p>
        <p className="mt-3 text-sm text-white/60">
          {ownPace
            ? `Your film starts here. Pause and rewind as you like until ${endsAt}.`
            : "The film starts for everyone at once. Stay on this page."}
        </p>
      </div>
    </div>
  );
}
