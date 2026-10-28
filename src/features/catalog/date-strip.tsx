"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface StripDay {
  /** Calendar day in the viewer's timezone, e.g. "2026-10-28" */
  key: string;
  /** Any moment on that day, for labels */
  iso: string;
  /** Showtimes on the day, shown under the date */
  count?: number;
}

const DAY = 86_400_000;

function labels(iso: string, todayKey: string | null, key: string, timeZone?: string) {
  const date = new Date(iso);
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone }).format(date);
  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone }).format(date);
  let top = weekday;
  if (todayKey && key === todayKey) top = "Today";
  else if (todayKey && key === new Date(Date.parse(todayKey) + DAY).toISOString().slice(0, 10)) {
    top = "Tomorrow";
  }
  return { top, day, month };
}

/**
 * The date picker used across film pages, the catalogue and the schedule: a scrollable strip of
 * days with a red underline that slides to the chosen one. Keyboard: arrow keys move the choice.
 */
export function DateStrip({
  days,
  selected,
  onSelect,
  todayKey,
  timeZone,
  className,
}: {
  days: StripDay[];
  selected: string;
  onSelect: (key: string) => void;
  /** The viewer's today, once known, for the Today / Tomorrow labels */
  todayKey: string | null;
  timeZone?: string;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);

  // Measure the chosen day so the underline can glide to it
  useLayoutEffect(() => {
    const list = listRef.current;
    const button = list?.querySelector<HTMLButtonElement>(`[data-day="${selected}"]`);
    if (!list || !button) return;
    setBar({ left: button.offsetLeft, width: button.offsetWidth });
    // Scroll the strip sideways only; scrollIntoView would also scroll the page to it
    const overflowLeft = button.offsetLeft < list.scrollLeft;
    const overflowRight =
      button.offsetLeft + button.offsetWidth > list.scrollLeft + list.clientWidth;
    if (overflowLeft || overflowRight) {
      list.scrollTo({ left: button.offsetLeft - 16, behavior: "smooth" });
    }
  }, [selected, days.length]);

  function onKeyDown(event: React.KeyboardEvent) {
    const index = days.findIndex((day) => day.key === selected);
    const next =
      event.key === "ArrowRight"
        ? days[index + 1]
        : event.key === "ArrowLeft"
          ? days[index - 1]
          : null;
    if (!next) return;
    event.preventDefault();
    onSelect(next.key);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-day="${next.key}"]`)?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Choose a day"
      onKeyDown={onKeyDown}
      className={cn(
        "relative scrollbar-none flex snap-x gap-1 overflow-x-auto border-b border-white/10",
        className,
      )}
    >
      {days.map((day) => {
        const { top, day: number, month } = labels(day.iso, todayKey, day.key, timeZone);
        const active = day.key === selected;
        return (
          <button
            key={day.key}
            type="button"
            role="tab"
            data-day={day.key}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(day.key)}
            className={cn(
              "group flex min-w-18 shrink-0 snap-start flex-col items-center gap-0.5 px-3 pt-2 pb-3 transition-colors",
              active ? "text-foreground" : "text-white/45 hover:text-white/80",
            )}
          >
            <span
              suppressHydrationWarning
              className="text-[0.65rem] font-bold tracking-[0.18em] uppercase"
            >
              {top}
            </span>
            <span
              suppressHydrationWarning
              className="font-display text-2xl leading-none font-extrabold tabular-nums"
            >
              {number}
            </span>
            <span suppressHydrationWarning className="text-[0.7rem]">
              {month}
            </span>
          </button>
        );
      })}
      {bar && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-brand transition-[left,width] duration-300 ease-cinema"
          style={{ left: bar.left + 12, width: bar.width - 24 }}
        />
      )}
    </div>
  );
}
