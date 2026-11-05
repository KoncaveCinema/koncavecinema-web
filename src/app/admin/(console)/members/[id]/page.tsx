import type { Metadata } from "next";
import { Suspense } from "react";

import { MemberDetailsPage } from "@/features/admin/members/member-details-page";
import { PageSkeleton } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Member" };

/** One member. The id comes from the address, so the page streams in behind its skeleton. */
export default function Page({ params }: PageProps<"/admin/members/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MemberDetailsPage params={params} />
    </Suspense>
  );
}
