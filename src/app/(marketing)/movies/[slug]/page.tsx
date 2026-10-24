import type { Metadata } from "next";

import { HoldingPage } from "@/components/layout/holding-page";

// Film pages arrive in Phase F3; links from the home page already point here.
export const metadata: Metadata = { title: "Film details", robots: { index: false } };

export default function FilmPage() {
  return (
    <HoldingPage
      eyebrow="Film details"
      title="The full film page is coming soon"
      description="Synopsis, cast, every showtime and tier pricing for this film arrive in the next release."
    />
  );
}
