import type { Metadata } from "next";

import { NewFilmPage } from "@/features/admin/films/new-film-page";

export const metadata: Metadata = { title: "New film" };

export default function Page() {
  return <NewFilmPage />;
}
