import type { Metadata } from "next";
import { Suspense } from "react";

import { MemberPage } from "@/features/admin/members/member-page";
import { PageSkeleton } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Member" };

/** One member. The id comes from the address, so the page streams in behind its skeleton. */
export default function AdminMemberPage({ params }: PageProps<"/admin/members/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MemberPage params={params} />
    </Suspense>
  );
}
