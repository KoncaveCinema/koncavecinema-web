"use client";

import { screeningPhase } from "@/lib/screening-window";
import { formatClock, formatCountdown, formatElapsed, formatShowtime } from "@/lib/format";
import { useNow, useViewerTimeZone } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

import { LiveDot } from "./live-dot";

/* Times that follow the viewer's clock and timezone. Both render Lagos calendar time on the
 * server, so the server and client markup match, then go live once the page is interactive. */

/**
 * A time in the viewer's timezone ("Today, 8:00 PM"), rendered in Lagos time until the page
 * is interactive so the server and client markup match.
 */
export function LocalTime({
  iso,
  format = "showtime",
}: {
  iso: string;
  format?: "showtime" | "clock";
}) {
  const now = useNow();
  const timeZone = useViewerTimeZone();
  const text = format === "clock" ? formatClock(iso, timeZone) : formatShowtime(iso, now, timeZone);
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}

interface ScreeningStatusProps {
  startTime: string;
  endTime: string;
  className?: string;
  /** `chip` is a filled pill for imagery; `inline` is plain text with a dot */
  appearance?: "chip" | "inline";
  /** Render only time-sensitive states (within a day, lobby, live); nothing otherwise */
  relativeOnly?: boolean;
}

const HOUR = 3_600_000;

/**
 * Live screening state: "Starts in 08:42", "Lobby open · 08:42", "Live · 22m in". Before the
 * page is interactive it shows the calendar time, so server and client markup match.
 */
export function ScreeningStatus({
  startTime,
  endTime,
  className,
  appearance = "chip",
  relativeOnly = false,
}: ScreeningStatusProps) {
  const now = useNow();
  const timeZone = useViewerTimeZone();

  let tone: "live" | "lobby" | "gold" | "muted" = "muted";
  let label: string;
  let pulse = false;

  if (relativeOnly) {
    if (now === null) return null;
    const phase = screeningPhase({ startTime, endTime }, now);
    if (phase === "ended" || (phase === "upcoming" && Date.parse(startTime) - now >= 24 * HOUR)) {
      return null;
    }
  }

  if (now === null) {
    label = formatShowtime(startTime, null, timeZone);
  } else {
    const phase = screeningPhase({ startTime, endTime }, now);
    const untilStart = Date.parse(startTime) - now;
    if (phase === "live") {
      tone = "live";
      pulse = true;
      label = `Live · ${formatElapsed(now - Date.parse(startTime))} in`;
    } else if (phase === "lobby") {
      tone = "lobby";
      pulse = true;
      label = `Lobby open · ${formatCountdown(untilStart)}`;
    } else if (phase === "ended") {
      label = "Screening ended";
    } else if (untilStart < 24 * HOUR) {
      tone = untilStart < HOUR ? "live" : "gold";
      pulse = untilStart < HOUR;
      label = `Starts in ${formatCountdown(untilStart)}`;
    } else {
      label = formatShowtime(startTime, now, timeZone);
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold tracking-wide whitespace-nowrap tabular-nums",
        appearance === "chip" &&
          "h-7 rounded-full border border-white/12 bg-black/55 px-3 backdrop-blur-md",
        appearance === "chip" && tone === "live" && "border-live/50 bg-live/15",
        appearance === "chip" && tone === "lobby" && "border-lobby/40 bg-lobby/10",
        className,
      )}
    >
      <LiveDot tone={tone} pulse={pulse} />
      <span suppressHydrationWarning>{label}</span>
    </span>
  );
}
