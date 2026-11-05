import type { Metadata } from "next";

import { SalesReport } from "@/features/admin/money/sales-report";

export const metadata: Metadata = { title: "Sales" };

export default function AdminSalesPage() {
  return <SalesReport />;
}
