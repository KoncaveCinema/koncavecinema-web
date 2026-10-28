"use client";

import { CircleDot, DoorOpen } from "lucide-react";
import Link from "next/link";

import { useNow, useViewerTimeZone } from "@/hooks/use-now";
import { formatClock, formatMoney, formatRelativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";

import { screeningPhase } from "./screening";

/**
 * One showtime as a bookable chip: the time large, the price under it, and the screening state
 * in words and an icon (never colour alone). Used on film pages, cards and the schedule.
 */
export function ShowtimeChip({
  href,
  startTime,
  endTime,
  price,
  size = "md",
  withDay = false,
  className,
}: {
  href: string;
  startTime: string;
  endTime: string;
  price: { amount: number; currency: string } | null;
  /** `sm` for cards and schedule rows: the time and state only */
  size?: "sm" | "md";
  /** Show the day above the time, for chips from several days side by side */
  withDay?: boolean;
  className?: string;
}) {
  const now = useNow();
  const timeZone = useViewerTimeZone();
  const phase = now === null ? "upcoming" : screeningPhase({ startTime, endTime }, now);
  if (phase === "ended") return null;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col justify-center rounded-xl border transition-[border-color,background-color,transform] duration-200 active:scale-[0.97]",
        size === "md" ? "min-h-16 min-w-30 px-4 py-2.5" : "min-h-11 min-w-21 px-3 py-1.5",
        phase === "live"
          ? "border-brand/50 bg-brand/8 hover:border-brand hover:bg-brand/15"
          : phase === "lobby"
            ? "border-lobby/40 bg-lobby/6 hover:border-lobby hover:bg-lobby/12"
            : "border-white/12 bg-white/2 hover:border-white/35 hover:bg-white/6",
        className,
      )}
    >
      {withDay && (
        <span
          suppressHydrationWarning
          className="text-[0.6rem] font-bold tracking-[0.14em] whitespace-nowrap text-white/45 uppercase"
        >
          {formatRelativeDay(startTime, now, timeZone)}
        </span>
      )}
      <time
        dateTime={startTime}
        suppressHydrationWarning
        className={cn(
          "font-display leading-tight font-extrabold whitespace-nowrap tabular-nums",
          size === "md" ? "text-lg" : "text-sm",
        )}
      >
        {formatClock(startTime, timeZone)}
      </time>
      <span
        className={cn(
          "mt-0.5 flex items-center gap-1.5 text-[0.7rem] whitespace-nowrap text-white/55",
          size === "sm" && phase === "upcoming" && "hidden",
        )}
      >
        {phase === "live" ? (
          <>
            <CircleDot className="size-3 text-brand" />
            <span className="text-white/80">Playing now</span>
          </>
        ) : phase === "lobby" ? (
          <>
            <DoorOpen className="size-3 text-lobby" />
            <span className="text-white/80">Lobby open</span>
          </>
        ) : (
          price && (
            <span className="tabular-nums">from {formatMoney(price.amount, price.currency)}</span>
          )
        )}
      </span>
    </Link>
  );
}
