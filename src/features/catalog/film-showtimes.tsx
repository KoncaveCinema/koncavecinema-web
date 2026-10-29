"use client";

import { CalendarX2 } from "lucide-react";
import { useState } from "react";

import { useNow, useViewerTimeZone } from "@/hooks/use-now";
import { dayKey } from "@/lib/format";

import { DateStrip, type StripDay } from "./date-strip";
import { lowestPrice } from "./screening";
import { ShowtimeChip } from "./showtime-chip";
import type { CatalogShowtime } from "./types";

/**
 * A film's showtimes, right on its page: pick a day, then a time. Days follow the viewer's own
 * timezone; until the page is interactive they follow Lagos time, so the markup matches.
 */
export function FilmShowtimes({ slug, showtimes }: { slug: string; showtimes: CatalogShowtime[] }) {
  const now = useNow();
  const timeZone = useViewerTimeZone();
  const [chosen, setChosen] = useState<string | null>(null);

  const upcoming = showtimes
    .filter((showtime) => now === null || Date.parse(showtime.endTime) > now)
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));

  const byDay = new Map<string, CatalogShowtime[]>();
  for (const showtime of upcoming) {
    const key = dayKey(Date.parse(showtime.startTime), timeZone);
    byDay.set(key, [...(byDay.get(key) ?? []), showtime]);
  }
  const days: StripDay[] = [...byDay.entries()].map(([key, items]) => ({
    key,
    iso: items[0]!.startTime,
    count: items.length,
  }));

  if (days.length === 0) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-dashed border-white/12 p-8 text-muted-foreground">
        <CalendarX2 className="size-6 shrink-0 text-white/40" />
        No upcoming showtimes for this film yet. New dates are announced every week.
      </div>
    );
  }

  const selected = chosen && byDay.has(chosen) ? chosen : days[0]!.key;
  const todayKey = now === null ? null : dayKey(now, timeZone);
  const items = byDay.get(selected) ?? [];

  return (
    <div>
      <DateStrip
        days={days}
        selected={selected}
        onSelect={setChosen}
        todayKey={todayKey}
        timeZone={timeZone}
      />
      <div role="tabpanel" aria-label="Showtimes" className="pt-6">
        <ul className="flex flex-wrap gap-3">
          {items.map((showtime) => (
            <li key={showtime.id} className="animate-rise">
              <ShowtimeChip
                href={`/movies/${slug}/showtimes/${showtime.id}`}
                startTime={showtime.startTime}
                endTime={showtime.endTime}
                price={lowestPrice([showtime])}
              />
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-white/45">
          Times in your time zone. Prices include all fees. The lobby opens 30 minutes before.
        </p>
      </div>
    </div>
  );
}
