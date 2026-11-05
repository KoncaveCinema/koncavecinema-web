import type { Metadata } from "next";

import { ShowtimesList } from "@/features/admin/showtimes/showtimes-list";

export const metadata: Metadata = { title: "Showtimes" };

export default function AdminShowtimesPage() {
  return <ShowtimesList />;
}
