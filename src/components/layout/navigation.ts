/** Primary navigation. Signed-in pages never appear here. */
export const PRIMARY_NAV = [
  { href: "/movies", label: "Now Showing" },
  { href: "/showtimes", label: "Showtimes" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/producers", label: "For Filmmakers" },
] as const;

export const FOOTER_NAV = [
  {
    title: "Explore",
    links: [
      { href: "/movies", label: "Now showing" },
      { href: "/showtimes", label: "Showtimes" },
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
