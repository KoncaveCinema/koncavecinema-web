"use client";

import { LayoutDashboard, ShieldAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/states/states";
import { Button } from "@/components/ui/button";
import { isStaff, isSuperAdmin } from "@/features/auth/roles";
import { useSession } from "@/features/auth/session";

/*
 * The admin console's guard. Signed-out visitors are sent to the staff sign-in by the layout's
 * redirect; this covers a signed-in account without the role. Pages keep rendering while the
 * session is checked (so navigation stays instant); their data waits on `useStaffSignedIn`.
 * The API's role checks are the real protection.
 */

/** True once a member of staff is signed in: gate admin queries on it. */
export function useStaffSignedIn(): boolean {
  return useSession((state) => state.status === "signed-in" && isStaff(state.user?.role));
}

/** True once the super admin is signed in: gate their pages' queries on it. */
export function useSuperAdminSignedIn(): boolean {
  return useSession((state) => state.status === "signed-in" && isSuperAdmin(state.user?.role));
}

/** Its children, unless the signed-in account lacks the role: then a plain refusal instead. */
export function RequireStaff({
  superAdmin = false,
  children,
}: {
  /** The page is the super admin's alone (staff accounts, the audit log) */
  superAdmin?: boolean;
  children: ReactNode;
}) {
  const { status, user } = useSession();
  const refused =
    status === "signed-in" && !(superAdmin ? isSuperAdmin(user?.role) : isStaff(user?.role));
  if (!refused) return children;

  const staff = isStaff(user?.role);
  return (
    <div className="rounded-3xl border border-white/10 bg-surface-1/60">
      <EmptyState
        icon={ShieldAlert}
        title={staff ? "Only the super admin can open this page" : "This area is for Koncave staff"}
        hint={
          staff
            ? "Ask the super admin if you need something from here."
            : "You're signed in with a member account. Your tickets and settings are in your dashboard."
        }
        action={
          <Button asChild size="lg" variant={staff ? "outline" : "default"}>
            <Link href={staff ? "/admin" : "/dashboard"}>
              <LayoutDashboard data-icon="inline-start" />
              {staff ? "Back to the overview" : "Go to your dashboard"}
            </Link>
          </Button>
        }
      />
    </div>
  );
}
