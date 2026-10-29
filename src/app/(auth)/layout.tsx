import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CrimsonHalo, FilmGrain, Spotlight } from "@/components/brand/atmosphere";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { robots: { index: false } };

/**
 * Sign-in, registration and password pages. Wide screens: a cinema still beside the form. Phones:
 * the still as a band across the top, with the form on a raised panel sliding over it, so the
 * page never feels like a form floating on black. No site navigation; the logo leads home.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main
      id="main"
      className="relative isolate flex min-h-svh flex-col lg:grid lg:grid-cols-[1.05fr_1fr]"
    >
      {/* The still: a top band on phones, the left half on wide screens */}
      <div className="relative h-[34svh] min-h-56 shrink-0 overflow-hidden lg:h-auto">
        <Image
          src="/placeholder/hall-communal.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 100vw"
          className="animate-ken-burns object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.55)_0%,rgb(0_0_0/0.2)_40%,rgb(0_0_0/0.7)_100%)] lg:bg-[linear-gradient(90deg,rgb(0_0_0/0.15)_0%,rgb(0_0_0/0.35)_65%,#000_100%),linear-gradient(0deg,#000_0%,rgb(0_0_0/0.6)_30%,transparent_60%)]"
        />
        <CrimsonHalo className="opacity-60 mix-blend-screen" />
        <Link
          href="/"
          aria-label="Koncave Cinema home"
          className="absolute top-5 left-5 sm:left-10 lg:hidden"
        >
          <Logo variant="inline" priority />
        </Link>
        <div className="absolute inset-x-5 bottom-14 sm:inset-x-10 lg:inset-x-12 lg:bottom-14 lg:max-w-md">
          <p className="font-display text-2xl leading-[0.95] font-black uppercase sm:text-3xl lg:text-4xl">
            The premiere <span className="block text-outline">comes home</span>
          </p>
          <p className="mt-3 hidden text-sm leading-relaxed text-white/70 lg:block">
            Scheduled showtimes, communal halls and private suites for African film. New premieres
            every week.
          </p>
        </div>
        <Spotlight className="hidden lg:block" />
      </div>

      {/* The form: a raised panel over the band on phones, the right half on wide screens */}
      <div className="relative z-10 -mt-8 flex flex-1 flex-col rounded-t-3xl border-t border-white/10 bg-surface-1 px-5 pt-8 pb-6 sm:px-10 lg:mt-0 lg:rounded-none lg:border-0 lg:bg-background lg:px-16 lg:py-8">
        <FilmGrain className="-z-10" />
        <Link href="/" aria-label="Koncave Cinema home" className="hidden self-start lg:block">
          <Logo variant="inline" priority />
        </Link>
        <div className="flex flex-1 items-start lg:items-center lg:py-12">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
