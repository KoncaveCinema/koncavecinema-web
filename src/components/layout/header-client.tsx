"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { accountLinks, useSignOut } from "@/features/auth/account-menu";
import { useSession } from "@/features/auth/session";

import { PRIMARY_NAV } from "./navigation";

/* The interactive parts of the header. */

/**
 * Marks the document as scrolled once the top of the page leaves the viewport, so the header can
 * turn from transparent to frosted glass in CSS. One IntersectionObserver, no scroll listener,
 * no React re-renders.
 */
export function HeaderScrollState() {
  useEffect(() => {
    const sentinel = document.getElementById("top-sentinel");
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => {
      document.documentElement.toggleAttribute("data-scrolled", !entry?.isIntersecting);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return null;
}

/** The navigation drawer on small screens. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { status, user } = useSession();
  const handleSignOut = useSignOut();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm border-white/10 bg-surface-1 p-0">
        <SheetHeader className="border-b border-white/8 px-6 py-5">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo variant="inline" className="self-start" />
        </SheetHeader>
        <nav aria-label="Main" className="flex flex-col px-3 py-4">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3.5 font-display text-lg font-bold transition-colors hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mx-6 space-y-3 border-t border-white/8 pt-6">
          {status === "signed-in" && user ? (
            <>
              <nav aria-label="Account" className="-mx-3 -mt-3 flex flex-col">
                {accountLinks(user.role).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-foreground"
                  >
                    <item.icon className="size-4 text-white/50" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Button
                size="lg"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  void handleSignOut();
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="lg" className="w-full">
              <Link href="/sign-in" prefetch={false} onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
