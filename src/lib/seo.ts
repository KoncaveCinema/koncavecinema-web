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

/**
 * The interim brand mark as an SVG string, for generated images (share card, Apple touch
 * icon). Mirrors `LogoMark` in `components/brand/logo.tsx` and `app/icon.svg`; replace all three
 * with the designer's files.
 */
export const MARK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -2 126 128"><defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff1a26"/><stop offset=".55" stop-color="#d60211"/><stop offset="1" stop-color="#a80008"/></linearGradient><mask id="h"><rect x="-8" y="-2" width="126" height="128" fill="#fff"/>' +
  [24, 39, 54, 69, 84, 99]
    .map((y) => `<rect x="16" y="${y}" width="9" height="9.5" rx="2.5"/>`)
    .join("") +
  '</mask></defs><path d="M10 24 L38 8 V112 Q38 117 33.5 118.5 L15 123 Q10 124 10 119 Z" fill="url(#r)" mask="url(#h)"/><path d="M42 62 L86 16 H108 L62 64 Z" fill="url(#r)"/><path d="M42 62 L62 64 L56 70 Z" fill="#970001"/><path d="M50 68 L66 62 L108 120 H85 Z" fill="url(#r)"/></svg>';

export const MARK_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString("base64")}`;
