import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/features/auth/require-session";
import { InvitePage } from "@/features/booking/invite-page";

export const metadata: Metadata = { title: "You're invited" };

export default function Page({ params }: PageProps<"/invite/[code]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InvitePage params={params} />
    </Suspense>
  );
}
