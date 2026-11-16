import type { Metadata } from "next";

import { FeaturedPage } from "@/features/admin/featured/featured-page";

export const metadata: Metadata = { title: "Featured films" };

export default function Page() {
  return <FeaturedPage />;
}
