import type { Metadata } from "next";

import { RefundsQueue } from "@/features/admin/money/refunds-queue";

export const metadata: Metadata = { title: "Refunds" };

export default function AdminRefundsPage() {
  return <RefundsQueue />;
}
