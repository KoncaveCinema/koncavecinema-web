import type { MetadataRoute } from "next";

import { indexable } from "@/lib/deployment";
import { absoluteUrl } from "@/lib/seo";

/**
 * Public marketing pages are crawlable; signed-in areas and the screening room are not. Staging
 * and preview deployments are closed to crawlers entirely.
 */
export default function robots(): MetadataRoute.Robots {
  if (!indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/admin",
        "/checkout",
        "/invite",
        "/watch",
        "/sign-in",
        "/register",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
