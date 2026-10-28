import { ProjectorBeam } from "@/components/brand/atmosphere";
import { SectionHeading } from "@/components/cinema/section-heading";
import { getCatalog } from "@/features/catalog/get-catalog";
import { allScreenings } from "@/features/catalog/screening";

import { comingSoonFilms } from "../schedule";
import { PremiereCard } from "./premiere-card";

export async function ComingSoon() {
  const { films } = await getCatalog();
  const upcoming = comingSoonFilms(films, allScreenings(films)).slice(0, 4);
  if (upcoming.length === 0) return null;

  return (
    <section
      aria-labelledby="coming-soon-title"
      id="coming-soon"
      className="relative isolate overflow-hidden py-20 sm:py-24"
    >
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-16">
        <SectionHeading
          id="coming-soon-title"
          eyebrow="Coming soon"
          title="Save the date"
          description="Pre-book your seat, or add the date to your calendar so you don't miss the lobby."
          action={{ href: "/showtimes", label: "Full schedule" }}
        />
        <div className="-mx-4 mt-10 snap-rail gap-4 px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {upcoming.map((film) => (
            <PremiereCard key={film.id} film={film} />
          ))}
        </div>
      </div>
      <ProjectorBeam side="right" />
    </section>
  );
}
