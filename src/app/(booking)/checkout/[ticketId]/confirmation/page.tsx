import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/features/auth/require-session";
import { ConfirmationPage } from "@/features/booking/confirmation-page";

export const metadata: Metadata = { title: "Booking confirmed" };

export default function Page({ params }: PageProps<"/checkout/[ticketId]/confirmation">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ConfirmationPage params={params} />
    </Suspense>
  );
}
