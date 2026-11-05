import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInRedirect } from "@/features/auth/require-session";

// The screening room: a pass holder's own, never indexed (robots.ts disallows it too)
export const metadata: Metadata = {
  title: { default: "Screening room", template: "%s · Koncave Cinema" },
  robots: { index: false, follow: false },
};

/** A full-screen theatre: no site chrome. Signed-out visitors sign in and come straight back. */
export default function WatchLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense>
        <SignInRedirect />
      </Suspense>
      {children}
    </>
  );
}
