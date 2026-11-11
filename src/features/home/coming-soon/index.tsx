import { ProjectorBeam } from "@/components/brand/atmosphere";
import { SectionHeading } from "@/components/cinema/section-heading";
import { getAllFilms } from "@/features/catalog/queries";
import { allScreenings } from "@/features/catalog/screening";

import { comingSoonFilms } from "../schedule";
import { AnnouncedCard, PremiereCard } from "./premiere-card";

const MAX_CARDS = 4;
const MAX_ANNOUNCED = 2;

export async function ComingSoon() {
  const { films, announced } = await getAllFilms();
  // One row of four: up to two announced films keep their place, dated premieres fill the rest
  const undated = announced.slice(0, MAX_ANNOUNCED);
  const dated = comingSoonFilms(films, allScreenings(films)).slice(0, MAX_CARDS - undated.length);
  if (dated.length + undated.length === 0) return null;

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
          description="Pre-book your seat, add the date to your calendar, or watch the teaser for what's next."
          action={{ href: "/movies", label: "All films" }}
        />
        <div className="-mx-4 mt-10 snap-rail gap-4 px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {dated.map((film) => (
            <PremiereCard key={film.id} film={film} />
          ))}
          {undated.map((film) => (
            <AnnouncedCard key={film.id} film={film} />
          ))}
        </div>
      </div>
      <ProjectorBeam side="right" />
    </section>
  );
}
