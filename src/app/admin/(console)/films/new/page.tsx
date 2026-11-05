import type { Metadata } from "next";

import { NewFilm } from "@/features/admin/films/film-form";

export const metadata: Metadata = { title: "New film" };

export default function AdminNewFilmPage() {
  return <NewFilm />;
}
