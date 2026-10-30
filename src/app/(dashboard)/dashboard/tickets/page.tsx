import type { Metadata } from "next";

import { TicketsList } from "@/features/dashboard/tickets-list";

export const metadata: Metadata = { title: "My tickets" };

export default function TicketsPage() {
  return <TicketsList />;
}
