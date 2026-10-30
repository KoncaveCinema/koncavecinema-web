"use client";

import { CircleDot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";

import { RatingBadge } from "@/components/cinema/badges";
import { useNow, useViewerTimeZone } from "@/hooks/use-now";
import { dayKey, formatMoney, formatRuntime } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { ApiScheduleShowtime } from "./api-types";
import { DateStrip, type StripDay } from "./date-strip";
import { screeningPhase } from "@/lib/screening-window";
import { ShowtimeChip } from "./showtime-chip";

/*
 * The schedule: pick a day on the strip, and every film playing that day is listed once with its
 * times as chips (grouped by film, not one row per showtime). Days follow the viewer's timezone.
 * The day and time-of-day filters live in the link (?date=, ?time=) so a view can be shared.
 */

const PERIODS = [
  { id: "all", label: "Any time" },
  { id: "afternoon", label: "Before 5 pm", from: 0, to: 17 },
  { id: "evening", label: "5 – 9 pm", from: 17, to: 21 },
  { id: "late", label: "After 9 pm", from: 21, to: 24 },
] as const;

const periodParser = parseAsStringLiteral(PERIODS.map((period) => period.id)).withDefault("all");
const dateParser = parseAsString.withDefault("");

function hourIn(iso: string, timeZone?: string): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone }).format(
      new Date(iso),
    ),
  );
}

interface FilmGroup {
  movie: ApiScheduleShowtime["movie"];
  showtimes: ApiScheduleShowtime[];
}

function FilmRow({ group }: { group: FilmGroup }) {
  const { movie, showtimes } = group;
  const from = Math.min(...showtimes.map((showtime) => showtime.priceFrom));
  return (
    <li className="grid reveal gap-5 border-t border-white/8 py-7 first:border-t-0 sm:grid-cols-[13rem_1fr] sm:gap-7 lg:grid-cols-[16rem_1fr]">
      <Link
        href={`/movies/${movie.slug}`}
        className="group relative block aspect-video overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/8"
      >
        <Image
          src={movie.posterLandscape}
          alt=""
          fill
          sizes="(min-width: 1024px) 16rem, (min-width: 640px) 13rem, 92vw"
          className="object-cover transition-transform duration-700 ease-cinema group-hover:scale-[1.04]"
        />
      </Link>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="font-display text-xl leading-tight font-extrabold">
            <Link href={`/movies/${movie.slug}`} className="hover:underline">
              {movie.title}
            </Link>
          </h3>
          <RatingBadge rating={movie.ageRating} />
        </div>
        <p className="mt-1.5 text-sm text-white/50">
          {formatRuntime(movie.durationMinutes)}
          <span className="tabular-nums">
            {" "}
            · from {formatMoney(from, showtimes[0]!.currency)}, fees included
          </span>
        </p>
        <ul className="mt-4 flex flex-wrap gap-2.5" aria-label={`${movie.title} showtimes`}>
          {showtimes.map((showtime) => (
            <li key={showtime.id}>
              <ShowtimeChip
                href={`/movies/${movie.slug}/showtimes/${showtime.id}`}
                startTime={showtime.startTime}
                endTime={showtime.endTime}
                price={{ amount: showtime.priceFrom, currency: showtime.currency }}
              />
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/** Screenings playing or in their lobby right now, across every film */
function LiveNow({ showtimes, now }: { showtimes: ApiScheduleShowtime[]; now: number }) {
  const live = showtimes.filter((showtime) => {
    const phase = screeningPhase(showtime, now);
    return phase === "live" || phase === "lobby";
  });
  if (live.length === 0) return null;
  return (
    <div className="mb-10 flex flex-wrap items-center gap-3 rounded-2xl border border-brand/25 bg-brand/5 px-5 py-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <CircleDot className="size-4 text-brand" />
        Happening now
      </p>
      <ul className="flex flex-wrap gap-2">
        {live.map((showtime) => (
          <li key={showtime.id}>
            <Link
              href={`/movies/${showtime.movie.slug}/showtimes/${showtime.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/30 px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-white/35"
            >
              {showtime.movie.title}
              <span className="font-normal text-white/55">
                {screeningPhase(showtime, now) === "live" ? "playing" : "lobby open"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ScheduleBrowser({ showtimes }: { showtimes: ApiScheduleShowtime[] }) {
  const now = useNow();
  const timeZone = useViewerTimeZone();
  const [date, setDate] = useQueryState("date", dateParser);
  const [period, setPeriod] = useQueryState("time", periodParser);

  const upcoming = now === null ? showtimes : showtimes.filter((s) => Date.parse(s.endTime) > now);
  const byDay = new Map<string, ApiScheduleShowtime[]>();
  for (const showtime of upcoming) {
    const key = dayKey(Date.parse(showtime.startTime), timeZone);
    byDay.set(key, [...(byDay.get(key) ?? []), showtime]);
  }
  const days: StripDay[] = [...byDay.entries()].map(([key, items]) => ({
    key,
    iso: items[0]!.startTime,
  }));
  const selected = byDay.has(date) ? date : (days[0]?.key ?? "");

  const match = PERIODS.find((item) => item.id === period);
  const dayShowtimes = (byDay.get(selected) ?? []).filter((showtime) => {
    if (!match || match.id === "all") return true;
    const hour = hourIn(showtime.startTime, timeZone);
    return hour >= match.from && hour < match.to;
  });

  // One row per film, in order of its first showtime that day
  const groups: FilmGroup[] = [];
  for (const showtime of dayShowtimes) {
    const group = groups.find((item) => item.movie.slug === showtime.movie.slug);
    if (group) group.showtimes.push(showtime);
    else groups.push({ movie: showtime.movie, showtimes: [showtime] });
  }

  return (
    <div>
      {now !== null && <LiveNow showtimes={upcoming} now={now} />}

      {/* Sticky under the site header, so the day and filters stay in reach while scrolling */}
      <div className="sticky top-18 z-20 -mx-5 bg-black/85 px-5 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:-mx-16 lg:px-16">
        <DateStrip
          days={days}
          selected={selected}
          onSelect={(key) => void setDate(key)}
          todayKey={now === null ? null : dayKey(now, timeZone)}
          timeZone={timeZone}
        />
        <div
          role="group"
          aria-label="Time of day"
          className="scrollbar-none flex gap-2 overflow-x-auto py-3"
        >
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={period === item.id}
              onClick={() => void setPeriod(item.id === "all" ? null : item.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                period === item.id
                  ? "border-white bg-white text-black"
                  : "border-white/10 text-white/55 hover:border-white/25 hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-white/12 p-10 text-center">
          <p className="font-display text-xl font-extrabold">Nothing on at that time.</p>
          <button
            type="button"
            onClick={() => void setPeriod(null)}
            className="mt-3 text-sm text-muted-foreground underline decoration-brand hover:text-foreground"
          >
            Show the whole day
          </button>
        </div>
      ) : (
        <ul className="mt-4">
          {groups.map((group) => (
            <FilmRow key={group.movie.slug} group={group} />
          ))}
        </ul>
      )}
    </div>
  );
}
