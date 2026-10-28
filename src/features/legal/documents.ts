/** The policy documents, in the order they are listed in the legal pages' navigation. */
export const LEGAL_DOCS = [
  { href: "/terms", label: "Terms of use" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/refunds", label: "Refunds and cancellations" },
  { href: "/cookies", label: "Cookie policy" },
] as const;

export type LegalPath = (typeof LEGAL_DOCS)[number]["href"];

export interface TocItem {
  id: string;
  title: string;
}

/**
 * The version of the terms a new account accepts, sent with registration and stored by the API.
 * It is the date the policies were last updated: bump it whenever their wording changes. The
 * "Last updated" date on every policy page is derived from it, so the two always match.
 */
export const TERMS_VERSION = "2026-10-27";
export const TERMS_UPDATED = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${TERMS_VERSION}T00:00:00Z`));
