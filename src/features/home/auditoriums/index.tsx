import { Check, Crown, Sparkles, User, Users } from "lucide-react";
import Image from "next/image";

import { SeatRows } from "@/components/brand/atmosphere";
import { PriceFrom } from "@/components/cinema/badges";
import { SectionHeading } from "@/components/cinema/section-heading";
import { getCatalog } from "@/features/catalog/get-catalog";
import { lowestPrice } from "@/features/catalog/screening";
import type { TicketTier } from "@/features/catalog/types";

import { HallPreview } from "./hall-preview";
import { AUDITORIUMS } from "./halls";
import { PeekInside } from "./peek-inside";

const ICONS: Record<TicketTier, typeof User> = {
  INDIVIDUAL: User,
  PUBLIC: Users,
  PRIVATE_5: Sparkles,
  PRIVATE_10: Crown,
};

export async function Auditoriums() {
  const { films } = await getCatalog();
  const showtimes = films.flatMap((film) => film.showtimes);

  return (
    <section
      aria-labelledby="auditoriums-title"
      id="auditoriums"
      className="relative isolate overflow-hidden pt-12 pb-36 sm:pt-16 sm:pb-40"
    >
      {/* A faint wash where Now showing hands over, so the join reads as one space */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(55%_100%_at_50%_0%,rgb(151_0_1/0.1),transparent_75%)]"
      />
      <SeatRows className="-z-10 opacity-80" />
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-16">
        <SectionHeading
          id="auditoriums-title"
          eyebrow="Choose your auditorium"
          title="Every film, four ways to watch"
          description="Prices are set for each film and showtime. Pick the atmosphere that fits the night."
        />

        <div className="-mx-4 mt-10 snap-rail gap-4 px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
          {AUDITORIUMS.map((hall) => {
            const Icon = ICONS[hall.tier];
            const price = lowestPrice(showtimes, hall.tier);
            return (
              <article
                key={hall.tier}
                className="group relative isolate flex min-h-120 w-74 reveal flex-col justify-end overflow-hidden rounded-3xl border border-white/8 bg-black p-5 transition-[translate,border-color] duration-500 ease-cinema hover:-translate-y-1.5 hover:border-brand/40 md:w-auto"
              >
                <Image
                  src={hall.image}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 24vw, (min-width: 768px) 48vw, 20rem"
                  className="-z-20 scale-104 parallax mask-[linear-gradient(to_bottom,#000_50%,transparent_88%)] object-cover transition-[scale] duration-700 ease-out [--drift:1.8%] group-hover:scale-108"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(0_0_0/0.35)_0%,rgb(0_0_0/0.2)_30%,rgb(0_0_0/0.85)_62%,#000_100%)]"
                />

                <div className="absolute inset-x-5 top-5 flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-full glass">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    {hall.seats}
                  </span>
                </div>

                <p className="flex items-center gap-2 text-[0.7rem] font-bold tracking-[0.28em] text-white/75 uppercase">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
                  {hall.kind}
                </p>
                <h3 className="mt-2 font-display text-2xl leading-tight font-extrabold">
                  {hall.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{hall.description}</p>
                <ul className="mt-4 space-y-1.5">
                  {hall.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-xs text-white/70">
                      <Check className="mt-px size-3.5 shrink-0 text-brand" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <PriceFrom
                    price={price}
                    suffix={hall.priceSuffix}
                    className="text-sm text-white/80"
                  />
                  <PeekInside name={hall.name} description={`${hall.kind} · ${hall.seats}`}>
                    <HallPreview tier={hall.tier} />
                  </PeekInside>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
