import { ArrowRight, Check, Fingerprint, Lock, MonitorSmartphone, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  AccentGlow,
  CrimsonHalo,
  FilmGrain,
  ProjectorBeam,
  ScreenGlow,
  Spotlight,
  Spotlights,
  Sprockets,
} from "@/components/brand/atmosphere";
import { SectionHeading } from "@/components/cinema/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AUDITORIUMS } from "@/features/home/auditoriums/halls";
import {
  COMPARISON,
  PREMIERE_STEPS,
  PRODUCER_COMMITMENTS,
  PROTECTIONS,
} from "@/features/producers/content";
import { SUPPORT_EMAIL } from "@/features/support/content";

export const metadata: Metadata = {
  title: "For filmmakers",
  description:
    "Premiere your film on Koncave Cinema: scheduled showtimes for audiences across Nigeria and the diaspora, most of every ticket to you, and studio-grade protection.",
  alternates: { canonical: "/producers" },
};

const CONTACT_HREF = "/contact?topic=producers";
const PROTECTION_ICONS = [Lock, Fingerprint, MonitorSmartphone];
/** A different accent per room, so the four cards read as four distinct experiences */
const ROOM_TONES = ["text-sky-400", "text-brand", "text-lobby", "text-gold"];
const container = "mx-auto max-w-360 px-5 sm:px-8 lg:px-16";

export default function ProducersPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative isolate flex min-h-[80svh] w-full flex-col justify-center overflow-hidden px-5 pt-32 pb-24 sm:px-8 lg:min-h-[85svh] lg:px-16 lg:pt-40 lg:pb-32">
        <Image
          src="/placeholder/scene-projector.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none -z-30 animate-ken-burns object-cover object-[70%_25%]"
        />
        {/* Scrim: dark under the header, open in the middle, black at the bottom */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(0deg,#070707_0%,rgb(7_7_7/0.75)_35%,rgb(7_7_7/0.6)_65%,rgb(7_7_7/0.88)_100%)]"
        />
        <CrimsonHalo className="pointer-events-none -z-10 opacity-70 mix-blend-screen" />
        <Spotlights />
        <FilmGrain className="-z-10" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Badge
            variant="outline"
            className="mb-4 border-brand/50 bg-black/60 px-3.5 py-1 text-brand"
          >
            <Sparkles className="mr-1.5 size-3.5" />
            The Nollywood Box Office Revolution
          </Badge>
          <h1 className="font-display text-4xl font-black tracking-tight text-balance sm:text-6xl lg:text-7xl">
            The Theatrical Box Office Model, <span className="text-brand">Inverted</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-balance text-white/80 sm:text-lg">
            Physical multiplexes extract the majority of theatrical earnings through exorbitant hall
            rental and operational overhead. Koncave Cinema inverts the paradigm—delivering
            synchronized virtual premieres directly to viewers while returning the primary share of
            ticket proceeds directly to the creators.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="xl">
              <Link href={CONTACT_HREF}>
                Talk to our team
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="glass">
              <a href="#how-it-runs">How a premiere runs</a>
            </Button>
          </div>
        </div>
      </section>

      {/* The deal */}
      <section aria-labelledby="deal-title" className="relative isolate py-20 sm:py-28">
        <ScreenGlow className="-z-10" />
        <AccentGlow tone="gold" at="70% 75%" className="-z-10" />
        <div className={container}>
          <SectionHeading
            id="deal-title"
            eyebrow="The deal"
            title={
              <>
                Your film. <span className="text-outline">Your box office.</span>
              </>
            }
            description="A cinema run usually pays for the building before it pays the filmmaker. A Koncave premiere has no hall to rent, so the money from every ticket goes where it should."
          />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCER_COMMITMENTS.map((item, index) => (
              <li key={item.title} className="reveal bg-background p-7 sm:p-8">
                <span className="font-display text-sm font-black text-gold tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 font-display text-xl leading-tight font-extrabold text-balance">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/65">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* How a premiere runs */}
      <section
        id="how-it-runs"
        aria-labelledby="runs-title"
        className="relative isolate scroll-mt-20 overflow-clip py-20 sm:py-28"
      >
        <div className={`${container} grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24`}>
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeading
              id="runs-title"
              eyebrow="How it runs"
              title="From first conversation to opening night"
              description="We handle the technology, the screening rooms and the audience. You bring the film."
            />
          </div>
          <ol className="space-y-12 sm:space-y-16">
            {PREMIERE_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="grid reveal grid-cols-[4.25rem_1fr] gap-4 sm:grid-cols-[7.5rem_1fr] sm:gap-6"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-5xl leading-none font-black text-outline-soft sm:text-7xl"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="border-t border-white/10 pt-5">
                  <h3 className="font-display text-2xl font-extrabold">{step.title}</h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-white/65">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        {/* After the content, so the beam lights what it crosses */}
        <ProjectorBeam side="right" />
      </section>

      <Sprockets className="w-full text-white/10" />

      {/* Where the film plays */}
      <section aria-labelledby="rooms-title" className="py-20 sm:py-28">
        <div className={container}>
          <SectionHeading
            id="rooms-title"
            eyebrow="Where your film plays"
            title="Four rooms, one showtime"
            description="Every premiere opens in all four formats at once, so each viewer can watch the way they like."
          />
          <ul className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {AUDITORIUMS.map((hall, index) => (
              <li
                key={hall.tier}
                className="reveal overflow-hidden rounded-2xl border border-white/8 bg-surface-1"
              >
                <div className="relative aspect-4/3">
                  <Image
                    src={hall.image}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 24vw, (min-width: 640px) 48vw, 92vw"
                    className="mask-[linear-gradient(to_bottom,#000_55%,transparent)] object-cover"
                  />
                </div>
                <div className="p-6 pt-2">
                  <p
                    className={`text-[0.7rem] font-bold tracking-[0.24em] uppercase ${ROOM_TONES[index]}`}
                  >
                    {hall.kind} · {hall.seats}
                  </p>
                  <h3 className="mt-2 font-display text-2xl leading-tight font-extrabold">
                    {hall.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{hall.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Protection */}
      <section
        aria-labelledby="protection-title"
        className="relative isolate overflow-hidden py-20 sm:py-28"
      >
        <AccentGlow tone="lobby" at="20% 50%" className="-z-10" />
        <div className={`${container} grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24`}>
          <SectionHeading
            id="protection-title"
            eyebrow="Protection"
            title="Protected from the first frame"
            description="Piracy is the fastest way to lose a box office. Every Koncave premiere is locked down by default."
          />
          <ul className="divide-y divide-white/8 border-y border-white/8">
            {PROTECTIONS.map((item, index) => {
              const Icon = PROTECTION_ICONS[index] ?? Lock;
              return (
                <li key={item.title} className="flex reveal gap-5 py-7">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-lobby/40 bg-lobby/10 text-lobby">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/65">{item.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Comparison */}
      <section aria-labelledby="compare-title" className="py-20 sm:py-28">
        <div className={container}>
          <SectionHeading
            id="compare-title"
            eyebrow="Side by side"
            title="A cinema run vs a Koncave premiere"
          />
          <div className="mt-12 border-t border-white/10">
            <div className="hidden grid-cols-[12rem_1fr_1fr] gap-8 py-4 text-[0.7rem] font-bold tracking-[0.24em] uppercase md:grid">
              <span className="text-white/40">&nbsp;</span>
              <span className="text-white/40">Traditional cinema run</span>
              <span className="text-brand">Koncave premiere</span>
            </div>
            <dl>
              {COMPARISON.map((row) => (
                <div
                  key={row.label}
                  className="grid reveal gap-2 border-t border-white/8 py-6 md:grid-cols-[12rem_1fr_1fr] md:gap-8"
                >
                  <dt className="font-display text-lg font-extrabold">{row.label}</dt>
                  <dd className="text-sm leading-relaxed text-white/50">
                    <span className="mr-2 text-[0.65rem] font-bold tracking-[0.2em] uppercase md:hidden">
                      Cinema run:
                    </span>
                    {row.traditional}
                  </dd>
                  <dd className="flex gap-2.5 text-sm leading-relaxed text-white/90">
                    <Check className="mt-0.5 size-4 shrink-0 text-lobby" />
                    {row.koncave}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Closing call */}
      <section
        aria-labelledby="cta-title"
        className="relative isolate overflow-hidden py-24 sm:py-32"
      >
        <CrimsonHalo className="-z-10 opacity-70" />
        <FilmGrain className="-z-10" />
        <div className={`${container} text-center`}>
          <p className="flex items-center justify-center gap-3 text-[0.7rem] font-bold tracking-[0.32em] text-brand uppercase">
            <span aria-hidden="true" className="h-px w-6 bg-brand" />
            Premiere with us
            <span aria-hidden="true" className="h-px w-6 bg-brand" />
          </p>
          <h2
            id="cta-title"
            className="mx-auto mt-6 max-w-4xl font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] font-black uppercase"
          >
            Bring your film <span className="block text-outline">to Koncave</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Premieres are arranged with our team. Tell us about your film and we&rsquo;ll walk you
            through the terms, the timeline and what opening night could look like.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="xl">
              <Link href={CONTACT_HREF}>
                Talk to our team
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="glass">
              <a href={`mailto:${SUPPORT_EMAIL}?subject=Premiering%20my%20film`}>{SUPPORT_EMAIL}</a>
            </Button>
          </div>
        </div>
        <Spotlight />
      </section>
    </div>
  );
}
