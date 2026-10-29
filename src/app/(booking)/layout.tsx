import { LifeBuoy, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { FilmGrain, ScreenGlow } from "@/components/brand/atmosphere";
import { Logo } from "@/components/brand/logo";

// Booking pages are personal or short-lived: never indexed (robots.ts disallows them too)
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The booking frame: an enclosed layout (no site navigation, per checkout research), with the
 * logo as the way home and help always one tap away. Used by room choice, checkout and invites.
 */
export default function BookingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/8 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-360 items-center justify-between gap-4 px-5 sm:px-8 lg:px-16">
          <Link href="/" aria-label="Koncave Cinema home">
            <Logo variant="inline" priority />
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <span className="hidden items-center gap-1.5 text-white/50 sm:flex">
              <Lock className="size-3.5" />
              Secure booking
            </span>
            <Link
              href="/help"
              className="flex items-center gap-1.5 text-white/70 transition-colors hover:text-foreground"
            >
              <LifeBuoy className="size-4" />
              Help
            </Link>
          </div>
        </div>
      </header>
      <main id="main" className="relative isolate flex-1">
        <ScreenGlow className="-z-10" />
        <FilmGrain className="-z-10" />
        <div className="mx-auto max-w-360 px-5 pt-8 pb-32 sm:px-8 lg:px-16 lg:pt-12 lg:pb-24">
          {children}
        </div>
      </main>
    </>
  );
}
