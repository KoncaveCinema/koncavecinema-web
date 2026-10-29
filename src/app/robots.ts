import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

/** Public marketing pages are crawlable; signed-in areas and the screening room are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/checkout",
        "/invite",
        "/studio",
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
