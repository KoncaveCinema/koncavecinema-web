"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";

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
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const status = useSession((state) => state.status);

  useEffect(() => {
    if (status !== "signed-out") return;
    const next = search ? `${pathname}?${search}` : pathname;
    router.replace(`/sign-in?next=${encodeURIComponent(next)}`);
  }, [status, pathname, search, router]);

  return status === "signed-in" ? children : fallback;
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
