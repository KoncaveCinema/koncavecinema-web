import { Ticket } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ConsoleShell } from "@/components/console/console-shell";
import { Button } from "@/components/ui/button";
import { PageSkeleton, SignInRedirect } from "@/features/auth/require-session";
import { DashboardSidebar, DashboardTabs, DashboardTrail } from "@/features/dashboard/navigation";

// A member's own area: never indexed (robots.ts disallows it too)
export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard · Koncave Cinema" },
  robots: { index: false, follow: false },
};

/**
 * The member dashboard: the shared console frame with the member's navigation. Signed-out
 * visitors go to sign-in and come straight back. The pages always render (so navigation stays
 * instant and prerenderable); their data loads only once someone is signed in, so nothing
 * private is ever shown or requested without a session.
 */
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <ConsoleShell
      area="Dashboard"
      homeHref="/dashboard"
      sidebar={<DashboardSidebar />}
      tabs={<DashboardTabs />}
      trail={<DashboardTrail />}
      actions={
        <Button asChild>
          <Link href="/movies">
            <Ticket data-icon="inline-start" />
            Book a screening
          </Link>
        </Button>
      }
    >
      <Suspense>
        <SignInRedirect />
      </Suspense>
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
    </ConsoleShell>
  );
}
