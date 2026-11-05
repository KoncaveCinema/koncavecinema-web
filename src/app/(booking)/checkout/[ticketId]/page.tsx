import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/features/auth/require-session";
import { CheckoutPage } from "@/features/booking/checkout-page";

export const metadata: Metadata = { title: "Checkout" };

export default function Page({ params }: PageProps<"/checkout/[ticketId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CheckoutPage params={params} />
    </Suspense>
  );
}
