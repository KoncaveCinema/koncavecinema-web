"use client";

import { KeyRound, LayoutDashboard, ShieldAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/states/states";
import { Button } from "@/components/ui/button";
import { isStaff, isSuperAdmin } from "@/features/auth/roles";
import { useSession } from "@/features/auth/session";
import { TwoFactorSetupFlow } from "@/features/auth/two-factor-settings";

/*
 * The admin console's guard. Signed-out visitors are sent to the staff sign-in by the layout's
 * redirect; this covers a signed-in account without the role. Pages keep rendering while the
 * session is checked (so navigation stays instant); their data waits on `useStaffSignedIn`.
 * The API's role checks are the real protection.
 */

/**
 * True once a member of staff is signed in with two-factor sign-in on: gate admin queries on it.
 * Without it every admin route answers TWO_FACTOR_REQUIRED, so nothing is asked for until then.
 */
export function useStaffSignedIn(): boolean {
  return useSession(
    (state) =>
      state.status === "signed-in" &&
      isStaff(state.user?.role) &&
      state.user?.twoFactorEnabled === true,
  );
}

/** True once the super admin is signed in (two-factor on): gate their pages' queries on it. */
export function useSuperAdminSignedIn(): boolean {
  return useSession(
    (state) =>
      state.status === "signed-in" &&
      isSuperAdmin(state.user?.role) &&
      state.user?.twoFactorEnabled === true,
  );
}

/** The console for a member of staff without two-factor sign-in: set it up first, here */
function SetUpTwoFactor() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-surface-1/60 p-6 sm:p-8">
      <span className="grid size-12 place-items-center rounded-2xl bg-gold/12 text-gold ring-1 ring-gold/30">
        <KeyRound aria-hidden="true" className="size-5" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-black">
        Set up two-factor sign-in to use the admin tools
      </h1>
      <p className="mt-2 mb-6 text-sm text-white/55">
        Staff accounts sign in with a password and a code from an app on your phone. It takes a
        minute, and the console opens as soon as it&apos;s on.
      </p>
      <TwoFactorSetupFlow onDone={() => {}} />
    </div>
  );
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
  // Every admin route refuses staff without it (TWO_FACTOR_REQUIRED): set it up here
  if (status === "signed-in" && isStaff(user?.role) && !user?.twoFactorEnabled) {
    return <SetUpTwoFactor />;
  }
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
