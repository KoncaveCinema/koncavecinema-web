"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { verifyEmailHref } from "./links";
import { useSession } from "./session";

/**
 * On the pages that need an account (dashboard, booking, the screening room): a member signed in
 * without having confirmed their address goes to the code step, and comes back here once it's
 * done. Public pages stay open to browse. Renders nothing.
 */
export function ConfirmEmailRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const user = useSession((state) => state.user);
  const unconfirmed = user !== null && !user.emailVerified;

  useEffect(() => {
    if (!unconfirmed) return;
    const here = search ? `${pathname}?${search}` : pathname;
    router.replace(verifyEmailHref(user.email, here, true));
  }, [unconfirmed, user?.email, pathname, search, router]);

  return null;
}
