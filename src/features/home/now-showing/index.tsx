import { ScreenGlow } from "@/components/brand/atmosphere";
import { SectionHeading } from "@/components/cinema/section-heading";
import { getCatalog } from "@/features/catalog/get-catalog";
import { allScreenings } from "@/features/catalog/screening";

import { tonightWindow } from "../schedule";
import { FilmCard } from "./film-card";

export async function NowShowing() {
  const { films, unavailable } = await getCatalog();
  const screenings = tonightWindow(allScreenings(films)).slice(0, 6);

  return (
    <section
      aria-labelledby="now-showing-title"
      id="now-showing"
      className="relative isolate pt-20 pb-12 sm:pt-24 sm:pb-16"
    >
      <ScreenGlow className="-z-10" />
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-16">
        <SectionHeading
          id="now-showing-title"
          eyebrow="Now showing"
          title="Premieres playing this week"
          description="Every film screens at a set time. The lobby opens 30 minutes before, then everyone watches together."
        />
        {screenings.length > 0 ? (
          <div className="-mx-5 mt-12 snap-rail gap-4 px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 xl:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
            {screenings.map((screening) => (
              <FilmCard key={screening.showtime.id} screening={screening} />
            ))}
          </div>
        ) : (
          <p className="mt-12 rounded-3xl border border-dashed border-white/12 p-10 text-center text-muted-foreground">
            {unavailable
              ? "We couldn't load the schedule. Please refresh in a moment."
              : "New premieres are announced every week. Check back soon."}
          </p>
        )}
      </div>
    </section>
  );
}
