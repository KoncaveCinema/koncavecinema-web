# Phase F1: Design System & App Shell

## Objective

Turn the Figma designs into a token-driven design system and the layouts every screen sits in.

## Deliverables

- **Tokens** (in `src/app/globals.css` under `@theme`): colour (cinema-dark surfaces, brand
  accent, semantic success / warning / danger / info), typography scale, spacing, radii,
  shadows, z-index layers, motion durations and easings. Dark is the default theme; light only if
  the designs call for it.
- **Typography**: brand fonts through `next/font` (self-hosted, `display: swap`, subsetted).
- **Primitives** (shadcn, restyled to the tokens): Button, Input, Label, Form, Select, Dialog,
  Sheet, Drawer (mobile), Tabs, Tooltip, Popover, Dropdown Menu, Avatar, Badge, Card, Skeleton,
  Separator, Sonner, Input OTP, Progress, Scroll Area.
- **Cinema components**: PosterCard, Billboard (hero), AgeRatingBadge (G, PG, 12, 15, 18),
  TierCard (Individual, Public Hall, Private Suite 5 / 10), PriceBreakdown, Countdown,
  ShowtimeChip, EmptyState, ErrorState (shows `X-Request-Id`), Money formatter (₦).
- **Layouts**: marketing (header, footer, legal links), auth (split screen), account, studio
  (sidebar), watch (full-bleed, no chrome).
- **Motion system**: page transitions, card hover, sheet and dialog entrances, shared-element
  poster to film page; all disabled under `prefers-reduced-motion`.
- Component catalogue route (`/dev/ui`, development only) to review every component and state.

## Acceptance Criteria

- [ ] Every Figma screen can be assembled from the catalogue without one-off styles.
- [ ] All interactive components are keyboard operable with visible focus; text contrast meets
      WCAG 2.1 AA.
- [ ] No layout shift from fonts or images on the marketing layout.
