import {
  BarChart3,
  CheckCircle2,
  Clapperboard,
  DollarSign,
  Lock,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CrimsonHalo, FilmGrain, Spotlights, Sprockets } from "@/components/brand/atmosphere";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EXHIBITION_FORMATS, PRODUCER_COMPARISONS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Filmmaker Distribution & Box Office | Koncave Cinema",
  description:
    "Invert traditional cinema economics. Direct box office retention on your Nollywood film with studio-grade DRM and dynamic forensic watermarking.",
};

export default function ProducerDistributionPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* =========================================================================
          SECTION 1: HERO STAGE
          ========================================================================= */}
      <section className="relative isolate flex min-h-[80svh] w-full flex-col justify-center overflow-hidden px-5 pt-32 pb-24 sm:px-8 lg:min-h-[85svh] lg:px-16 lg:pt-40 lg:pb-32">
        <Image
          src="/placeholder/scene-projector.jpg"
          alt="Cinema projector beam over dark theatre"
          fill
          priority
          sizes="100vw"
          quality={80}
          className="pointer-events-none -z-30 animate-ken-burns object-cover object-[70%_25%]"
        />
        {/* Scrim gradient: dark at top to respect header, transparent in center, black at bottom */}
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
            className="mb-4 border-brand/50 bg-black/60 px-3.5 py-1 text-brand backdrop-blur-md"
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
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full bg-brand px-8 py-3 font-semibold text-brand-foreground shadow-lg shadow-brand/25 transition-transform hover:scale-105 hover:bg-brand/90"
              asChild
            >
              <a href="#submit-film">Submit Your Film for Distribution</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/20 bg-black/50 px-8 py-3 backdrop-blur-md hover:bg-white/10"
              asChild
            >
              <Link href="/terms">Review Distribution Terms</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Screen Divider */}
      <Sprockets className="w-full text-white/12" />

      {/* =========================================================================
          SECTION 2: PILLARS OF PRODUCER EMPOWERMENT
          ========================================================================= */}
      <section className="relative w-full py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="border-brand/30 text-brand">
              Filmmaker Architecture
            </Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Engineered to Protect and Monetize Your Work
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              From cryptographic stream encryption to automated weekly reconciliations, our platform
              gives African filmmakers complete exhibition sovereignty.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-white/10 bg-surface-1/90 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-brand/40">
              <CardHeader className="pb-3">
                <DollarSign className="size-6 text-brand" />
                <CardTitle className="text-xl font-bold">Majority Box Office</CardTitle>
                <CardDescription>Direct Creator Revenue Split</CardDescription>
              </CardHeader>
              <CardContent className="text-xs leading-relaxed text-muted-foreground">
                Retain the lion&rsquo;s share of ticket sales across Individual Watch and Public
                Theatres with transparent payment gateway pass-through.
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-surface-1/90 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-brand/40">
              <CardHeader className="pb-3">
                <Lock className="size-6 text-brand" />
                <CardTitle className="text-xl font-bold">Studio-Grade DRM</CardTitle>
                <CardDescription>Apple, Google &amp; Microsoft</CardDescription>
              </CardHeader>
              <CardContent className="text-xs leading-relaxed text-muted-foreground">
                Mux Multi-DRM (FairPlay, Widevine, PlayReady) with hardware cryptographic decryption
                and single-device concurrency locks.
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-surface-1/90 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-brand/40">
              <CardHeader className="pb-3">
                <ShieldCheck className="size-6 text-brand" />
                <CardTitle className="text-xl font-bold">Forensic Watermarking</CardTitle>
                <CardDescription>Brownian Motion Jitter</CardDescription>
              </CardHeader>
              <CardContent className="text-xs leading-relaxed text-muted-foreground">
                Dynamic, shifting semi-transparent canvas embeds viewer UID, IP, and timestamp
                imperceptibly into playback to eliminate illicit recording.
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-surface-1/90 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-brand/40">
              <CardHeader className="pb-3">
                <BarChart3 className="size-6 text-brand" />
                <CardTitle className="text-xl font-bold">Live Telemetry</CardTitle>
                <CardDescription>Real-Time Box Office Tally</CardDescription>
              </CardHeader>
              <CardContent className="text-xs leading-relaxed text-muted-foreground">
                Inspect real-time ticket counts, active screening room capacity, and gross earnings
                directly through your producer dashboard.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Screen Divider */}
      <Sprockets className="w-full text-white/12" />

      {/* =========================================================================
          SECTION 3: ECONOMIC COMPARISON TABLE
          ========================================================================= */}
      <section className="relative w-full py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Traditional Physical Chains vs. Koncave Cinema
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Why independent African filmmakers and Nollywood production houses are adopting
              scheduled virtual premieres.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-white/12 bg-surface-1/80 shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/12 bg-white/4">
                    <th className="p-4 font-semibold text-foreground">Exhibition Term</th>
                    <th className="p-4 font-semibold text-muted-foreground">
                      Traditional Multiplex Chains
                    </th>
                    <th className="p-4 font-semibold text-brand">Koncave Cinema Platform</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {PRODUCER_COMPARISONS.map((row) => (
                    <tr key={row.feature} className="transition-colors hover:bg-white/3">
                      <td className="p-4 font-medium text-foreground">{row.feature}</td>
                      <td className="p-4 text-muted-foreground">{row.physical}</td>
                      <td className="p-4 font-semibold text-brand">{row.koncave}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Screen Divider */}
      <Sprockets className="w-full text-white/12" />

      {/* =========================================================================
          SECTION 4: FOUR PREMIERE EXHIBITION FORMATS
          ========================================================================= */}
      <section className="relative w-full py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Four Premiere Formats for Your Title
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Give your audience the exact cinema atmosphere they desire while maximizing your
              theatrical revenue stream.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {EXHIBITION_FORMATS.map((fmt) => {
              const Icon = fmt.icon;
              return (
                <div
                  key={fmt.id}
                  className="group relative isolate overflow-hidden rounded-2xl border border-white/10 bg-surface-1/90 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-brand/40"
                >
                  <Image
                    src={fmt.bgImage}
                    alt={fmt.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="pointer-events-none -z-20 object-cover opacity-20 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-surface-1 via-surface-1/90 to-transparent" />
                  <Icon className="size-6 text-brand" />
                  <h3 className="mt-4 text-lg font-bold">{fmt.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-brand">{fmt.subtitle}</p>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {fmt.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Screen Divider */}
      <Sprockets className="w-full text-white/12" />

      {/* =========================================================================
          SECTION 5: SUBMISSION / INQUIRY FORM
          ========================================================================= */}
      <section id="submit-film" className="relative w-full py-20 sm:py-28">
        <div className="relative isolate mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/14 bg-surface-1/90 p-8 shadow-2xl backdrop-blur-2xl sm:p-12">
          <Image
            src="/placeholder/scene-aisle.jpg"
            alt="Cinema aisle atmosphere"
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="pointer-events-none -z-20 object-cover opacity-15"
          />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-surface-1/90 via-surface-1/95 to-surface-1" />

          <div className="text-center">
            <Clapperboard className="mx-auto size-10 text-brand" />
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Submit Your Film for Premiere Distribution
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our content acquisition team reviews feature films, documentaries, and limited series
              promptly.
            </p>
          </div>

          <form className="mt-8 space-y-4" action="/contact" method="GET">
            <div>
              <label
                htmlFor="film-title"
                className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Film Title
              </label>
              <input
                id="film-title"
                name="film_title"
                type="text"
                required
                placeholder="e.g. The King's Horseman"
                className="mt-1 w-full rounded-lg border border-white/12 bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="producer-name"
                  className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Producer / Contact Name
                </label>
                <input
                  id="producer-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Full Legal Name"
                  className="mt-1 w-full rounded-lg border border-white/12 bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="producer-email"
                  className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Contact Email
                </label>
                <input
                  id="producer-email"
                  name="email"
                  type="email"
                  required
                  placeholder="producer@example.com"
                  className="mt-1 w-full rounded-lg border border-white/12 bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="screener-link"
                className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Private Screener Link (Vimeo / Drive / Box)
              </label>
              <input
                id="screener-link"
                name="screener_link"
                type="url"
                placeholder="https://vimeo.com/..."
                className="mt-1 w-full rounded-lg border border-white/12 bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="synopsis"
                className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Logline &amp; Synopsis
              </label>
              <textarea
                id="synopsis"
                name="message"
                rows={3}
                required
                placeholder="Brief logline, principal cast, runtime, and NFVCB rating status..."
                className="mt-1 w-full rounded-lg border border-white/12 bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full bg-brand py-3 font-semibold text-brand-foreground shadow-lg shadow-brand/20 hover:bg-brand/90"
            >
              Submit Distribution Inquiry
              <Send className="ml-2 size-4" />
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              <span>All submissions protected under strict commercial confidentiality.</span>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
