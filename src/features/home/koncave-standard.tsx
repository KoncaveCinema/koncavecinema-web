import { Cast, MessagesSquare, Tv } from "lucide-react";

import { CrimsonHalo, FilmGrain, RotatingSeal } from "@/components/brand/atmosphere";
import { LogoMark } from "@/components/brand/logo";

const PROMISES = [
  {
    title: "Officially licensed",
    body: "Official cuts licensed from independent African storytellers. Every pass backs the people who made the film.",
  },
  {
    title: "Picture and sound, protected",
    body: "Adaptive streaming that holds up on fibre or 4G, with every premiere protected against piracy.",
  },
  {
    title: "Together, to the second",
    body: "Every twist, every laugh, at the same moment as fans at home and across the diaspora.",
  },
];

const ON_THE_SLATE = [
  { icon: Tv, label: "Smart TV apps" },
  { icon: Cast, label: "One-tap casting" },
  { icon: MessagesSquare, label: "Live director Q&A" },
];

export function KoncaveStandard() {
  return (
    <section
      aria-labelledby="standard-title"
      className="relative isolate overflow-hidden py-20 sm:py-28"
    >
      {/* Glow pooled behind the statement on the left */}
      <CrimsonHalo className="-z-10 -scale-x-100 opacity-45" />
      <FilmGrain className="-z-10" />
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-16">
        <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-24">
          <div className="reveal lg:sticky lg:top-32 lg:self-start">
            <p className="flex items-center gap-3 text-[0.7rem] font-bold tracking-[0.32em] text-brand uppercase">
              <span aria-hidden="true" className="h-px w-6 bg-brand" />
              The Koncave standard
            </p>
            <h2
              id="standard-title"
              className="mt-5 font-display text-4xl leading-[0.95] font-black text-balance uppercase sm:text-5xl xl:text-6xl"
            >
              Authentic cinema, <span className="text-outline">made for the occasion</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              No endless library and no pirated copies. Just the film as its makers intended, on the
              night it premieres, with the people you choose.
            </p>
            <RotatingSeal
              text="The Koncave standard · Authentic cinema · "
              className="mt-10 size-32 sm:size-36"
            >
              <LogoMark className="h-10 w-auto" />
            </RotatingSeal>
          </div>

          <ol className="border-t border-white/10">
            {PROMISES.map((promise, index) => (
              <li
                key={promise.title}
                className="group grid reveal grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-b border-white/10 py-9 sm:gap-x-10 sm:py-11"
              >
                <span
                  aria-hidden="true"
                  className="row-span-2 font-display text-6xl leading-none font-black text-outline-soft transition-[-webkit-text-stroke-color] duration-500 group-hover:[-webkit-text-stroke-color:var(--color-brand)] sm:text-7xl"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="self-end font-display text-xl font-extrabold sm:text-2xl">
                  {promise.title}
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {promise.body}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-16 flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/2 px-6 py-5 sm:flex-row sm:items-center sm:gap-8">
          <p className="text-[0.65rem] font-bold tracking-[0.3em] text-white/45 uppercase">
            On the slate
          </p>
          <ul className="flex flex-wrap gap-x-8 gap-y-3" aria-label="Coming soon">
            {ON_THE_SLATE.map((item) => (
              <li
                key={item.label}
                className="inline-flex items-center gap-2.5 text-sm text-white/80"
              >
                <item.icon className="size-4 text-gold" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
          <span className="self-start rounded-full border border-gold/35 px-3 py-1 text-[0.62rem] font-bold tracking-[0.18em] text-gold uppercase sm:ml-auto sm:self-auto">
            Coming soon
          </span>
        </div>
      </div>
    </section>
  );
}
