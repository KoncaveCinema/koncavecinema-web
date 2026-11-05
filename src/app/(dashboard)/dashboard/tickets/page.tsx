import type { Metadata } from "next";

import { TicketsPage } from "@/features/dashboard/tickets-page";

export const metadata: Metadata = { title: "My tickets" };

export default function Page() {
  return <TicketsPage />;
}
