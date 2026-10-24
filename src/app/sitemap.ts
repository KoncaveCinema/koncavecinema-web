import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

/**
 * Indexable pages. Holding pages are `noindex` and left out; each film page joins this list
 * (from the catalog) when it ships in Phase F3.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 }];
}
