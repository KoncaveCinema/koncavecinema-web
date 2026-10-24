import type { Metadata } from "next";
import { Suspense } from "react";

import { Auditoriums } from "@/features/home/auditoriums";
import { ComingSoon } from "@/features/home/coming-soon";
import { Concessions } from "@/features/home/concessions";
import { Hero, HeroSkeleton } from "@/features/home/hero";
import { HowItWorks } from "@/features/home/how-it-works";
import { KoncaveStandard } from "@/features/home/koncave-standard";
import { NowShowing } from "@/features/home/now-showing";
import { HomeStructuredData } from "@/features/home/structured-data";
import { PremiereTape, ShowingStrip } from "@/features/home/tickers";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Home: an overview of what Koncave is, built as a static shell with cached catalog data
 * streamed into the sections that need it.
 */
export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>
      <PremiereTape />
      <HowItWorks />
      <Suspense fallback={<div className="h-144" />}>
        <NowShowing />
      </Suspense>
      <Suspense fallback={<div className="h-160" />}>
        <Auditoriums />
      </Suspense>
      <Concessions />
      <Suspense>
        <ComingSoon />
      </Suspense>
      <KoncaveStandard />
      <Suspense>
        <ShowingStrip />
      </Suspense>
      <Suspense>
        <HomeStructuredData />
      </Suspense>
    </>
  );
}
