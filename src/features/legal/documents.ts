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
