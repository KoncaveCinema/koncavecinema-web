"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { safeNext } from "./form-parts";
import { verifyEmailHref } from "./links";
import { isStaff } from "./roles";
import { useSession } from "./session";

/**
 * Shows its children only to a signed-in person. Anyone else goes to sign-in and comes back
 * here afterwards. The API enforces this too; this only spares a round trip and a flash.
 */
export function RequireSession({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const status = useSession((state) => state.status);
  return (
    <>
      <SignInRedirect />
      {status === "signed-in" ? children : fallback}
    </>
  );
}

/**
 * Sends a signed-out visitor to sign-in, returning here afterwards (unless they signed out on
 * purpose: the page was theirs, not the next person's). Renders nothing, so a layout
 * can keep its pages rendering (and prerenderable) while the pages hold their data back until
 * someone is signed in (see `useSignedIn`). The admin console sends staff to its own sign-in.
 */
export function SignInRedirect({ signInPath = "/login" }: { signInPath?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const status = useSession((state) => state.status);
  const byChoice = useSession((state) => state.signedOutByChoice);

  useEffect(() => {
    if (status !== "signed-out") return;
    // Signed out on purpose: the next person to sign in may not be the one this page was for
    if (byChoice) return router.replace(signInPath);
    const next = search ? `${pathname}?${search}` : pathname;
    router.replace(`${signInPath}?next=${encodeURIComponent(next)}`);
  }, [status, byChoice, pathname, search, router, signInPath]);

  return null;
}

/**
 * True once a member is signed in with a confirmed address: gate private queries on it. Until
 * then the page shows its loading state while the code step takes over (ConfirmEmailRedirect),
 * so nothing private flashes up first.
 */
export function useSignedIn(): boolean {
  return useSession((state) => state.status === "signed-in" && state.user?.emailVerified === true);
}

/** A neutral placeholder while the session is checked */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-6">
      <div className="h-4 w-32 rounded-full bg-white/6" />
      <div className="h-10 w-2/3 max-w-md rounded-xl bg-white/6" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="h-96 rounded-3xl bg-white/3" />
        <div className="h-72 rounded-3xl bg-white/3" />
      </div>
    </div>
  );
}

/**
 * On a member sign-in page: someone already signed in goes straight on, to `next` or their
 * home (the console for staff, the dashboard for members). The staff sign-in has its own.
 */
export function SignedInRedirect({
  next,
  home,
}: {
  next: string | null;
  /** Where to go without `next`, when the form sends people elsewhere than their home */
  home?: string;
}) {
  const router = useRouter();
  const user = useSession((state) => (state.status === "signed-in" ? state.user : null));
  const role = user?.role;
  const destination = role
    ? safeNext(next, home ?? (isStaff(role) ? "/admin" : "/dashboard"))
    : null;
  // A member who hasn't confirmed their address finishes that first, with a fresh code, so
  // they never see the page behind it
  const to =
    user && destination && !user.emailVerified
      ? verifyEmailHref(user.email, destination, true)
      : destination;

  useEffect(() => {
    if (to) router.replace(to);
  }, [to, router]);

  return null;
}
