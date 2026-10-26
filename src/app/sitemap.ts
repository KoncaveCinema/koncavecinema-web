import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

/**
 * Indexable pages. Holding pages are `noindex` and left out; each film page joins this list
 * (from the catalog) when it ships in Phase F3.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1.0 },
    { url: absoluteUrl("/producers"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/help"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/terms"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/privacy"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/refunds"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/cookies"), changeFrequency: "monthly", priority: 0.4 },
  ];
}
