import { Suspense } from "react";

import { ConsoleShell } from "@/components/console/console-shell";
import { AdminSidebar, AdminTabs, AdminTrail } from "@/features/admin/navigation";
import { RequireStaff } from "@/features/admin/require-staff";
import { PageSkeleton, SignInRedirect } from "@/features/auth/require-session";

/**
 * The admin console: the shared console frame with the staff navigation. Signed-out visitors
 * go to the staff sign-in and come straight back; a member account sees a plain refusal. As in
 * the dashboard, pages always render and their data waits for a member of staff.
 */
export default function AdminConsoleLayout({ children }: LayoutProps<"/admin">) {
  return (
    <ConsoleShell
      area="Admin"
      homeHref="/admin"
      account="admin"
      sidebar={<AdminSidebar />}
      tabs={<AdminTabs />}
      trail={<AdminTrail />}
    >
      <Suspense>
        <SignInRedirect signInPath="/admin/login" />
      </Suspense>
      <RequireStaff>
        <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      </RequireStaff>
    </ConsoleShell>
  );
}
