import type { Metadata } from "next";

import { OverviewPage } from "@/features/admin/overview/overview-page";

export const metadata: Metadata = { title: { absolute: "Admin · Koncave Cinema" } };

export default function Page() {
  return <OverviewPage />;
}
