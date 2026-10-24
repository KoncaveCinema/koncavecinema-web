import type { Metadata } from "next";

import { HoldingPage } from "@/components/layout/holding-page";

// The reservation flow arrives in Phase F4; showtime links and the API's marketing deep links
// (/movies/:slug/showtimes/:id) already point here.
export const metadata: Metadata = { title: "Reserve your seat", robots: { index: false } };

export default function ShowtimePage() {
  return (
    <HoldingPage
      eyebrow="Reservations"
      title="Reserving seats opens soon"
      description="Choose your auditorium, add a private suite and pay securely, all in one step. Arriving in the next release."
    />
  );
}
