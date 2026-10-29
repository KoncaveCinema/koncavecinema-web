import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/features/auth/require-session";
import { CheckoutFlow } from "@/features/booking/checkout-flow";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage({ params }: PageProps<"/checkout/[ticketId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CheckoutFlow params={params} />
    </Suspense>
  );
}
