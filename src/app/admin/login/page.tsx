import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthFrame } from "@/components/brand/auth-frame";
import { StaffSignInForm } from "@/features/admin/staff-sign-in";

export const metadata: Metadata = { title: "Staff sign-in", robots: { index: false } };

/** The staff door: the same frame as the members' sign-in, marked Admin */
export default function Page() {
  return (
    <AuthFrame
      badge={
        <span className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-[0.18em] text-[#ff6a72] uppercase">
          Admin
        </span>
      }
    >
      {/* The form reads ?next= and ?step= in the browser */}
      <Suspense>
        <StaffSignInForm />
      </Suspense>
    </AuthFrame>
  );
}
