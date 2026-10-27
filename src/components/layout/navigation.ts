/** Primary navigation: sections of the home page until their own pages exist. */
export const PRIMARY_NAV = [
  { href: "/#now-showing", label: "Now Showing" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#auditoriums", label: "Auditoriums" },
  { href: "/#concessions", label: "Concessions" },
] as const;

export const FOOTER_NAV = [
  {
    title: "Explore",
    links: [
      { href: "/#now-showing", label: "Now showing" },
      { href: "/#coming-soon", label: "Coming soon" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#auditoriums", label: "Auditoriums" },
      { href: "/producers", label: "For filmmakers" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help centre" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of use" },
      { href: "/privacy", label: "Privacy policy (NDPA)" },
      { href: "/cookies", label: "Cookie policy" },
      { href: "/refunds", label: "Refund policy" },
    ],
  },
] as const;
