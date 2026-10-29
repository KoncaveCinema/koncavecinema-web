import type { Metadata } from "next";
import { Suspense } from "react";

import { FilmGrain, ScreenGlow } from "@/components/brand/atmosphere";
import { getSchedule } from "@/features/catalog/queries";
import { ScheduleBrowser } from "@/features/catalog/schedule-browser";

export const metadata: Metadata = {
  title: "Showtimes",
  description:
    "The Koncave Cinema schedule: every showtime across every film, by day, in your own time zone.",
  alternates: { canonical: "/showtimes" },
};

export default async function ShowtimesPage() {
  const showtimes = await getSchedule();

  return (
    <div className="relative isolate">
      <ScreenGlow className="-z-10" />
      <FilmGrain className="-z-10" />
      <div className="mx-auto max-w-360 px-5 pt-28 pb-24 sm:px-8 sm:pb-32 lg:px-16 lg:pt-32">
        <header className="mb-8 max-w-2xl">
          <p className="flex items-center gap-3 text-[0.7rem] font-bold tracking-[0.32em] text-brand uppercase">
            <span aria-hidden="true" className="h-px w-6 bg-brand" />
            Schedule
          </p>
          <h1 className="mt-3 font-display text-4xl font-black uppercase sm:text-5xl">
            Show<span className="text-outline">times</span>
          </h1>
          <p className="mt-4 text-white/65">
            Pick a day, then a time. Times are in your own time zone, prices include all fees, and
            the lobby opens 30 minutes before each screening.
          </p>
        </header>

        {showtimes.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-white/12 p-10 text-center text-muted-foreground">
            New showtimes are announced every week. Check back soon.
          </p>
        ) : (
          // The day and time filters read the link (?date=, ?time=) in the browser
          <Suspense fallback={<ScheduleFallback />}>
            <ScheduleBrowser showtimes={showtimes} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

function ScheduleFallback() {
  return (
    <div aria-hidden="true">
      <div className="h-20 border-b border-white/10" />
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="grid gap-7 border-t border-white/8 py-7 sm:grid-cols-[13rem_1fr]"
        >
          <div className="aspect-video rounded-xl bg-white/4" />
          <div className="space-y-3">
            <div className="h-6 w-48 rounded bg-white/5" />
            <div className="h-11 w-72 rounded-xl bg-white/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
