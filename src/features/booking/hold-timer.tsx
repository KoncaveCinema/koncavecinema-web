"use client";

import { Timer } from "lucide-react";

import { useNow } from "@/hooks/use-now";
import { serverOffset } from "@/lib/api";
import { formatCountdown } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Time left on the seat hold, counted down to the API's `lockExpiresAt` on the server's clock
 * (the device clock plus the offset from the API's timestamps), never from page load, so a reload
 * or a wrong phone clock shows the true time left. Turns gold in the last two minutes.
 */
export function HoldTimer({
  lockExpiresAt,
  className,
}: {
  lockExpiresAt: string;
  className?: string;
}) {
  const now = useNow();
  const left = now === null ? null : Date.parse(lockExpiresAt) - (now + serverOffset());
  const urgent = left !== null && left < 2 * 60_000;

  return (
    <p
      role="timer"
      aria-live="off"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tabular-nums",
        urgent ? "border-gold/50 bg-gold/10 text-gold" : "border-white/12 bg-white/4 text-white/80",
        className,
      )}
    >
      <Timer className="size-3.5" />
      {left === null
        ? "Seat held"
        : left > 0
          ? `Seat held for ${formatCountdown(left)}`
          : "Hold expired"}
    </p>
  );
}

/** True once the hold has run out; null before the clock starts */
export function useHoldExpired(lockExpiresAt: string | undefined): boolean {
  const now = useNow();
  return Boolean(
    lockExpiresAt && now !== null && Date.parse(lockExpiresAt) <= now + serverOffset(),
  );
}
