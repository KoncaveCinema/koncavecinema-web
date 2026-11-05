import type { Metadata } from "next";

import { FilmsList } from "@/features/admin/films/films-list";

export const metadata: Metadata = { title: "Films" };

export default function AdminFilmsPage() {
  return <FilmsList />;
}
