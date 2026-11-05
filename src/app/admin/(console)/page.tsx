import type { Metadata } from "next";

import { Overview } from "@/features/admin/overview/overview";

export const metadata: Metadata = { title: { absolute: "Admin · Koncave Cinema" } };

export default function AdminOverviewPage() {
  return <Overview />;
}
