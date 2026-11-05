import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { FilmGrain, ScreenGlow } from "@/components/brand/atmosphere";
import { Logo } from "@/components/brand/logo";
import { StaffSignInForm } from "@/features/admin/staff-sign-in";

export const metadata: Metadata = { title: "Staff sign-in" };

/** The staff door: the logo, an Admin label and the form, on a plain dark page. */
export default function Page() {
  return (
    <main id="main" className="relative isolate flex min-h-svh flex-col bg-background px-5">
      <ScreenGlow className="-z-10 h-96" />
      <FilmGrain className="-z-10" />
      <header className="flex items-center gap-3 py-6 sm:px-5">
        <Link href="/" aria-label="Koncave Cinema home">
          <Logo variant="inline" priority />
        </Link>
        <span className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-[0.18em] text-[#ff6a72] uppercase">
          Admin
        </span>
      </header>
      <div className="flex flex-1 items-start justify-center pt-10 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface-1/90 p-7 shadow-[0_30px_80px_-40px_rgb(0_0_0/0.9)] backdrop-blur-xl sm:p-10">
          {/* The form reads ?next= in the browser */}
          <Suspense>
            <StaffSignInForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
