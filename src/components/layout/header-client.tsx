"use client";

import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "@/features/auth/service";
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

function useSignOut() {
  const router = useRouter();
  const setUser = useSession((state) => state.setUser);
  return async () => {
    await signOut().catch(() => undefined);
    setUser(null);
    router.push("/");
  };
}

/**
 * The header's right-hand action: Sign in, or the account menu once signed in. Holds its size
 * while the session is checked, so the header never shifts.
 */
export function AccountMenu() {
  const { status, user } = useSession();
  const handleSignOut = useSignOut();

  if (status === "loading") {
    return <span aria-hidden="true" className="hidden h-9 w-24 rounded-full bg-white/5 sm:block" />;
  }
  if (status === "signed-out" || !user) {
    return (
      <Button asChild className="hidden sm:inline-flex">
        <Link href="/sign-in" prefetch={false}>
          Sign in
        </Link>
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="glass"
          className="hidden gap-2 pr-4 pl-1.5 sm:inline-flex"
          aria-label="Account menu"
        >
          <span className="grid size-7 place-items-center rounded-full bg-brand text-xs font-bold uppercase">
            {(user.publicScreenAlias ?? user.email).charAt(0)}
          </span>
          My account
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The navigation drawer on small screens. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const status = useSession((state) => state.status);
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
          {status === "signed-in" ? (
            <>
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
