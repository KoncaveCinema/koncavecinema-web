import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { CrimsonHalo, ProjectorBeam } from "@/components/brand/atmosphere";
import { SectionHeading } from "@/components/cinema/section-heading";
import { Button } from "@/components/ui/button";

import { StepSpy } from "./client";
import { AuditoriumVignette, LobbyVignette, ShowtimeVignette, SnackVignette } from "./vignettes";

const SECTION_ID = "how-it-works";

const STEPS: { moment: string; title: string; body: string; vignette: ReactNode }[] = [
  {
    moment: "Days before",
    title: "Pick your showtime",
    body: "Every film premieres at set times, like opening night at the cinema. Book ahead before the doors close.",
    vignette: <ShowtimeVignette />,
  },
  {
    moment: "When you book",
    title: "Choose how you watch",
    body: "Solo and distraction-free, in a public hall full of fans, or in a private suite where your group talks over voice.",
    vignette: <AuditoriumVignette />,
  },
  {
    moment: "Before showtime",
    title: "Snacks to your door",
    body: "Add cinema favourites to your booking and they arrive before the film starts.",
    vignette: <SnackVignette />,
  },
  {
    moment: "30 minutes to go",
    title: "Take your seat together",
    body: "The lobby opens half an hour early. At showtime the film begins for everyone at the same second.",
    vignette: <LobbyVignette />,
  },
];

const stepNumber = (index: number) => String(index + 1).padStart(2, "0");

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-title"
      id={SECTION_ID}
      className="relative isolate py-20 sm:py-24"
    >
      <StepSpy sectionId={SECTION_ID} />
      <CrimsonHalo className="-z-10 mask-[linear-gradient(to_bottom,transparent,#000_30%,#000_70%,transparent)] opacity-40" />
      <div className="mx-auto grid max-w-360 gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-16">
        {/* Static side: stays in view while the steps scroll past */}
        <div className="relative lg:sticky lg:top-28 lg:self-start lg:py-6">
          <SectionHeading
            id="how-it-works-title"
            eyebrow="How it works"
            title="The night of the premiere, at home"
            description="Koncave isn't a library you scroll at random. Every film is an event with a time, a room and an audience. Here's how the night unfolds."
          />

          <ol className="mt-10 hidden lg:block" aria-hidden="true">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                data-step-marker
                className="group/marker flex items-baseline gap-4 border-b border-white/6 py-3 text-white/70 transition-colors duration-500 in-data-spy:text-white/35 data-current:text-white"
              >
                <span className="w-6 font-display text-xs font-black tabular-nums transition-colors duration-500 group-data-current/marker:text-brand">
                  {stepNumber(index)}
                </span>
                <span className="text-sm font-semibold">{step.title}</span>
                <span className="ml-auto text-[0.62rem] font-bold tracking-[0.24em] uppercase opacity-70">
                  {step.moment}
                </span>
              </li>
            ))}
          </ol>
          <div className="hidden h-0.5 overflow-hidden bg-white/8 lg:block" aria-hidden="true">
            <div className="h-full origin-left scale-x-(--step-progress,1) bg-brand transition-[scale] duration-700 ease-cinema" />
          </div>

          <Button asChild variant="glass" size="lg" className="mt-10">
            <Link href="/#now-showing">
              See what&apos;s showing
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        {/* Scrolling side */}
        <ol className="relative steps-timeline">
          {/* The rail fills with red as the steps scroll past (browser-driven, no JavaScript) */}
          <div aria-hidden="true" className="absolute top-2 bottom-2 left-5.5 w-px bg-white/10">
            <div className="h-full w-full origin-top rail-fill bg-linear-to-b from-brand via-brand to-crimson" />
          </div>

          {STEPS.map((step, index) => (
            <li
              key={step.title}
              data-step
              className="group/step relative grid grid-cols-[2.75rem_1fr] gap-5 pb-10 last:pb-0 sm:gap-7 lg:min-h-[46vh] lg:items-center lg:pb-0 lg:last:min-h-0 lg:last:pt-16"
            >
              <span className="relative z-10 grid size-11 place-items-center self-start rounded-full border border-brand/60 bg-black font-display text-sm font-black text-brand shadow-[0_0_0_6px_#000,0_0_30px_-4px_rgb(214_2_17/0.7)] transition-[scale,color,border-color,box-shadow] duration-500 ease-cinema group-data-current/step:scale-110 group-data-current/step:border-brand group-data-current/step:text-brand group-data-current/step:shadow-[0_0_0_6px_#000,0_0_34px_-2px_rgb(214_2_17/0.8)] in-data-spy:border-white/15 in-data-spy:text-white/40 in-data-spy:shadow-[0_0_0_6px_#000] lg:self-center">
                {stepNumber(index)}
              </span>
              <div className="space-y-4 rounded-3xl border border-white/8 bg-white/2 p-6 transition-[opacity,border-color,background-color] duration-500 ease-cinema group-data-current/step:border-brand/25 group-data-current/step:bg-white/4 group-data-current/step:opacity-100 in-data-spy:opacity-50 sm:p-8">
                <p className="text-[0.68rem] font-bold tracking-[0.28em] text-white/45 uppercase">
                  {step.moment}
                </p>
                <h3 className="font-display text-2xl font-extrabold sm:text-3xl">{step.title}</h3>
                <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
                <div className="pt-2">{step.vignette}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
      {/* After the content, so the beam lights the steps it sweeps across */}
      <ProjectorBeam />
    </section>
  );
}
