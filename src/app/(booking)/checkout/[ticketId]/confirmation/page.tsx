import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/features/auth/require-session";
import { Confirmation } from "@/features/booking/confirmation";

export const metadata: Metadata = { title: "Booking confirmed" };

export default function ConfirmationPage({
  params,
}: PageProps<"/checkout/[ticketId]/confirmation">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Confirmation params={params} />
    </Suspense>
  );
}
