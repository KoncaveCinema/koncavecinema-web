import { env } from "@/env";

/* Shared facts for metadata, structured data, the manifest and share images. */

export const SITE_NAME = "Koncave Cinema";

export const SITE_TAGLINE = "The premiere comes home";

export const SITE_DESCRIPTION =
  "Premiere screenings of African films online: scheduled showtimes, public halls full of fans, " +
  "private suites for 5 or 10, and a lobby that opens 30 minutes before the film.";

/** An absolute URL on this site, for structured data and sitemaps. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString();
}

/**
 * Serialises JSON-LD for a `<script type="application/ld+json">`. Escapes `<` so text from the
 * API (titles, synopses) can never close the script tag.
 */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
