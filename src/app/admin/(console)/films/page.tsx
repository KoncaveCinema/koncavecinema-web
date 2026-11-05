import type { Metadata } from "next";

import { FilmsPage } from "@/features/admin/films/films-page";

export const metadata: Metadata = { title: "Films" };

export default function Page() {
  return <FilmsPage />;
}
