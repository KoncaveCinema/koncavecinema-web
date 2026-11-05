import type { Metadata } from "next";

import { ShowtimesPage } from "@/features/admin/showtimes/showtimes-page";

export const metadata: Metadata = { title: "Showtimes" };

export default function Page() {
  return <ShowtimesPage />;
}
