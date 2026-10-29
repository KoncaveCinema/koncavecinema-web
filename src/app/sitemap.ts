import type { MetadataRoute } from "next";

import { getCatalog } from "@/features/catalog/get-catalog";
import { absoluteUrl } from "@/lib/seo";

/**
 * Indexable pages: the marketing pages, Now showing, the schedule and every film page. Showtime
 * booking pages, checkout and the account area are left out (noindex).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { films } = await getCatalog();
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1.0 },
    { url: absoluteUrl("/movies"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/showtimes"), changeFrequency: "daily", priority: 0.9 },
    ...films.map((film) => ({
      url: absoluteUrl(`/movies/${film.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/producers"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/help"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/terms"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/privacy"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/refunds"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/cookies"), changeFrequency: "monthly", priority: 0.3 },
  ];
}
