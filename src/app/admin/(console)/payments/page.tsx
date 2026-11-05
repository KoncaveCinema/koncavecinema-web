import type { Metadata } from "next";

import { PaymentsList } from "@/features/admin/money/payments-list";

export const metadata: Metadata = { title: "Payments" };

export default function AdminPaymentsPage() {
  return <PaymentsList />;
}
