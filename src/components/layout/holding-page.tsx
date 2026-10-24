import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { CrimsonHalo, Spotlights } from "@/components/brand/atmosphere";
import { Button } from "@/components/ui/button";

interface HoldingCopy {
  eyebrow?: string;
  title: string;
  description: string;
}

/** Branded holding page for routes whose screens arrive in later phases (film and showtime pages). */
export function HoldingPage({ eyebrow = "Coming soon", title, description }: HoldingCopy) {
  return (
    <section className="relative isolate flex min-h-[80svh] items-center overflow-hidden px-4 pt-28 pb-20">
      <CrimsonHalo className="-z-10 opacity-70" />
      <Spotlights className="-z-10" />
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[0.7rem] font-bold tracking-[0.32em] text-brand uppercase">{eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl font-black text-balance sm:text-5xl">{title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground">
          {description}
        </p>
        <Button asChild variant="glass" size="lg" className="mt-9">
          <Link href="/">
            <ArrowLeft data-icon="inline-start" />
            Back to tonight&apos;s screenings
          </Link>
        </Button>
      </div>
    </section>
  );
}
