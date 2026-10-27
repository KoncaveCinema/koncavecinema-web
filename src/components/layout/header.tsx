import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

import { HeaderScrollState, MobileNav } from "./header-client";
import { PRIMARY_NAV } from "./navigation";

/**
 * Logo left, navigation centred, one action right. Transparent over the hero, frosted glass once
 * the page scrolls (a data attribute set by one IntersectionObserver; no re-renders).
 */
export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-transparent transition-[background-color,border-color] duration-500 in-data-scrolled:border-white/8 in-data-scrolled:bg-black/75 in-data-scrolled:backdrop-blur-xl">
      <HeaderScrollState />
      <div className="mx-auto grid h-18 max-w-360 grid-cols-[1fr_auto] items-center gap-6 px-5 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-16">
        <Link
          href="/"
          aria-label="Koncave Cinema home"
          className="group relative justify-self-start rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {/* Crimson back-glow on hover */}
          <span
            aria-hidden="true"
            className="absolute -inset-4 rounded-full bg-crimson/0 blur-xl transition-colors duration-500 group-hover:bg-crimson/45"
          />
          <Logo className="relative" priority />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="relative inline-flex rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors after:absolute after:inset-x-4 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/sign-in" prefetch={false}>
              Sign in
            </Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
