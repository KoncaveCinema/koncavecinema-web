import { Clock3 } from "lucide-react";
import Image from "next/image";

import { SectionHeading } from "@/components/cinema/section-heading";
import { cn } from "@/lib/utils";

const MENU = [
  {
    name: "Popcorn",
    description: "Sweet, salted or mixed. The cinema classic, in a proper bucket.",
    image: "/placeholder/snack-popcorn.jpg",
    feature: true,
  },
  {
    name: "Chilled drinks",
    description: "Ice-cold soft drinks and juice.",
    image: "/placeholder/snack-drinks.jpg",
  },
  {
    name: "Ice cream",
    description: "Something sweet for the second half.",
    image: "/placeholder/snack-ice-cream.jpg",
  },
  {
    name: "Chicken & chips",
    description: "Crispy chicken with hot chips.",
    image: "/placeholder/snack-chicken.jpg",
    wide: true,
  },
];

/** Concessions showcase. Ordering arrives with API Phase 7; until then it is announced, not sold. */
export function Concessions() {
  return (
    <section
      aria-labelledby="concessions-title"
      id="concessions"
      className="relative isolate py-20 sm:py-24"
    >
      {/* Warm snack-bar light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_55%_at_20%_60%,rgb(245_183_0/0.07),transparent_70%)]"
      />
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            id="concessions-title"
            eyebrow="Concessions"
            title="The snack bar comes to you"
            description="Add your cinema favourites when you book, and they arrive at your door before the film starts."
          />
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/6 px-4 py-2 text-xs font-bold tracking-[0.18em] text-gold uppercase">
            <Clock3 className="size-3.5" aria-hidden="true" />
            Coming soon
          </span>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2">
          {MENU.map((item) => (
            <li
              key={item.name}
              className={cn(
                "group relative isolate flex min-h-52 reveal-clip flex-col justify-end overflow-hidden rounded-3xl bg-surface-1 p-5 sm:min-h-64 sm:p-6",
                item.feature && "col-span-2 min-h-80 lg:row-span-2 lg:min-h-0",
                "wide" in item && "col-span-2",
              )}
            >
              <Image
                src={item.image}
                alt=""
                fill
                sizes={
                  item.feature || "wide" in item
                    ? "(min-width: 1024px) 50vw, 100vw"
                    : "(min-width: 1024px) 25vw, 50vw"
                }
                className="-z-20 scale-110 parallax mask-[linear-gradient(to_bottom,#000_50%,transparent_88%)] object-cover transition-[scale] duration-1000 ease-cinema group-hover:scale-115"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent_35%,rgb(0_0_0/0.88))]"
              />
              <h3
                className={cn(
                  "font-display font-extrabold",
                  item.feature ? "text-3xl sm:text-4xl" : "text-lg sm:text-xl",
                )}
              >
                {item.name}
              </h3>
              <p className="mt-1 text-sm text-white/70">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
