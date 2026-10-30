import type { Metadata } from "next";

import { DashboardHome } from "@/features/dashboard/dashboard-home";

export const metadata: Metadata = { title: { absolute: "Dashboard · Koncave Cinema" } };

export default function DashboardPage() {
  return <DashboardHome />;
}
