import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/features/auth/require-session";
import { InviteClaim } from "@/features/booking/invite-claim";

export const metadata: Metadata = { title: "You're invited" };

export default function InvitePage({ params }: PageProps<"/invite/[code]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InviteClaim params={params} />
    </Suspense>
  );
}
