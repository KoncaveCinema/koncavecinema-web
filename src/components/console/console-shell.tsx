import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { ScreenGlow } from "@/components/brand/atmosphere";
import { LogoMark } from "@/components/brand/logo";

import { AccountMenu } from "@/features/auth/account-menu";

/**
 * The frame shared by the member dashboard and the admin console: the sidebar on desktop, a top
 * bar with where you are, the area's main action and the account menu, and a tab bar under the
 * thumb on phones. The content sits under the site's own screen glow and film grain, so the
 * console feels like part of the cinema, not a separate tool.
 *
 * Each area passes its own navigation (`sidebar`, `tabs`, `trail`), built from the console's
 * client components in a module of its own.
 */
export function ConsoleShell({
  area,
  homeHref,
  sidebar,
  tabs,
  trail,
  actions,
  children,
}: {
  area: string;
  homeHref: string;
  sidebar: ReactNode;
  tabs: ReactNode;
  /** Where you are, e.g. "Dashboard / My tickets" (desktop) */
  trail?: ReactNode;
  /** The area's main action in the top bar, e.g. "Book a screening" */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background lg:flex">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-brand px-4 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* The navigation reads the address (for the active link), so it streams in behind
          placeholders of the same size: the frame itself stays in the instant shell */}
      <aside className="relative z-40 hidden shrink-0 lg:block">
        <Suspense
          fallback={
            <div className="sticky top-0 h-svh w-68 border-r border-white/8 bg-surface-1" />
          }
        >
          {sidebar}
        </Suspense>
      </aside>

      <div className="relative isolate flex min-w-0 flex-1 flex-col">
        <ScreenGlow className="-z-10 h-112" />

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/8 bg-black/70 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
          <Link href={homeHref} className="flex items-center gap-2.5 lg:hidden">
            <LogoMark className="size-8" />
            <span className="font-display text-base font-extrabold">{area}</span>
          </Link>
          <div className="hidden min-w-0 lg:block">
            <Suspense>{trail}</Suspense>
          </div>
          <div className="flex items-center gap-3">
            {actions && <div className="hidden sm:block">{actions}</div>}
            <AccountMenu variant="console" />
          </div>
        </header>

        <main
          id="main"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-28 sm:px-6 sm:pt-10 lg:px-10 lg:pb-16"
        >
          {children}
        </main>
      </div>

      <Suspense
        fallback={
          <div className="fixed inset-x-0 bottom-0 h-16 border-t border-white/10 bg-black/90 lg:hidden" />
        }
      >
        {tabs}
      </Suspense>
    </div>
  );
}
