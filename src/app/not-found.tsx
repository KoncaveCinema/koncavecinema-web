import { ArrowLeft, Film } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CrimsonHalo, SeatRows, Spotlight } from "@/components/brand/atmosphere";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/**
 * Every unknown URL: an empty, darkened auditorium with one spotlight on the message. Rendered
 * at the root, outside the marketing layout.
 */
export default function NotFound() {
  return (
    <>
      <div id="top-sentinel" aria-hidden="true" className="absolute top-0 h-px w-px" />
      <main id="main" className="flex-1">
        <section className="relative isolate flex min-h-svh items-center overflow-hidden px-5 pt-28 pb-44">
          <CrimsonHalo className="-z-10 opacity-40" />
          <SeatRows className="-z-10 opacity-70" />

          <div className="mx-auto max-w-2xl text-center">
            <p className="animate-rise text-[0.7rem] font-bold tracking-[0.32em] text-brand uppercase">
              Error 404
            </p>
            <p
              aria-hidden="true"
              className="mt-4 animate-rise font-display text-[clamp(7rem,24vw,15rem)] leading-[0.85] font-black text-outline"
              style={{ animationDelay: "120ms" }}
            >
              404
            </p>
            <h1
              className="mt-6 animate-rise font-display text-3xl font-black text-balance sm:text-5xl"
              style={{ animationDelay: "220ms" }}
            >
              Page not found
            </h1>
            <p
              className="mx-auto mt-5 max-w-lg animate-rise text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg"
              style={{ animationDelay: "320ms" }}
            >
              Sorry, the page you&apos;re looking for doesn&apos;t exist or may have been moved.
              Check the address, or head back to the homepage.
            </p>
            <div
              className="mt-10 flex animate-rise flex-wrap justify-center gap-3"
              style={{ animationDelay: "420ms" }}
            >
              <Button asChild size="xl">
                <Link href="/">
                  <ArrowLeft data-icon="inline-start" />
                  Go to homepage
                </Link>
              </Button>
              <Button asChild size="xl" variant="glass">
                <Link href="/#now-showing">
                  <Film data-icon="inline-start" />
                  Browse films
                </Link>
              </Button>
            </div>
          </div>

          {/* The one light left on in the hall, trained on the message */}
          <Spotlight />
        </section>
      </main>
    </>
  );
}
