import type { Metadata } from "next";

import { DashboardPage } from "@/features/dashboard/dashboard-page";

export const metadata: Metadata = { title: { absolute: "Dashboard · Koncave Cinema" } };

export default function Page() {
  return <DashboardPage />;
}
