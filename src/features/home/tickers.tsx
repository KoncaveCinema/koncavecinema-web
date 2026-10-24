import { Sprockets } from "@/components/brand/atmosphere";
import { Ticker } from "@/components/brand/ticker";
import { LocalTime } from "@/components/cinema/live-time";
import { getCatalog } from "@/features/catalog/get-catalog";
import { sortedShowtimes } from "@/features/catalog/screening";

/* The home page's scrolling bands: the tape under the hero and the film strip above the footer. */

const FACTS = [
  "Scheduled premieres",
  "Lobby opens 30 minutes early",
  "Public halls full of fans",
  "Private suites for 5 or 10",
  "NFVCB rated",
  "Pay in naira",
  "Watch on any device",
  "Officially licensed films",
];

const MOTTOS = [
  "The premiere comes home",
  "Koncave Cinema",
  "Opening night, every night",
  "Watch together",
];

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 0c.9 6.6 5.4 11.1 12 12-6.6.9-11.1 5.4-12 12-.9-6.6-5.4-11.1-12-12C6.6 11.1 11.1 6.6 12 0Z"
      />
    </svg>
  );
}

/** Two stacked bands of tape under the hero, sliding in opposite directions: product facts
 * over a slower brand motto. */
export function PremiereTape() {
  return (
    <div className="relative z-20 -mt-14 overflow-hidden py-12 sm:-mt-20 sm:py-14">
      <div className="mx-[-5%] w-[110%]">
        <div className="bg-brand py-3.5 shadow-[0_18px_50px_-12px_rgb(214_2_17/0.6)]">
          <Ticker
            label="What to expect"
            items={FACTS}
            duration={55}
            separator={<Star className="mx-6 size-3.5 text-black/45" />}
            itemClassName="font-display text-sm font-black tracking-[0.14em] text-white uppercase sm:text-base"
          />
        </div>
        <div className="border-b border-white/8 bg-surface-1 py-3">
          <Ticker
            label="Koncave Cinema"
            items={MOTTOS}
            duration={70}
            reverse
            separator={<Star className="mx-6 size-3 text-brand" />}
            itemClassName="font-display text-sm font-black tracking-[0.18em] text-white/45 uppercase"
          />
        </div>
      </div>
    </div>
  );
}

/** A film strip of what is showing and when, running above the footer. */
export async function ShowingStrip() {
  const { films } = await getCatalog();
  const billed = films.filter((film) => film.showtimes.length > 0);
  if (billed.length === 0) return null;

  return (
    <div className="relative border-y border-white/8 bg-surface-1 py-5 text-white/10">
      <Sprockets className="absolute top-1.5 left-0 h-2.5" />
      <Ticker
        label="Showing on Koncave"
        duration={Math.max(40, billed.length * 9)}
        separator={<span className="mx-8 size-1.5 rounded-full bg-brand" />}
        itemClassName="gap-3 py-3"
        items={billed.map((film) => (
          <span key={film.id} className="flex items-baseline gap-3">
            <span className="font-display text-xl font-black text-white uppercase sm:text-2xl">
              {film.title}
            </span>
            <span className="text-sm font-medium text-white/50">
              <LocalTime iso={sortedShowtimes(film)[0]!.startTime} />
            </span>
          </span>
        ))}
      />
      <Sprockets className="absolute bottom-1.5 left-0 h-2.5" />
    </div>
  );
}
