import { Building2, Clapperboard, Film, MessageSquare, Scale, ShieldCheck, Tv } from "lucide-react";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "ticketing" | "streaming" | "kyc" | "suites" | "concessions";
}

export const FAQS: FaqItem[] = [
  {
    id: "scheduled-premieres",
    category: "ticketing",
    question: "How do scheduled virtual premieres work on Koncave Cinema?",
    answer:
      "Unlike traditional streaming libraries where films sit passively on-demand, Koncave Cinema exhibits films as synchronized theatrical events with scheduled showtimes. All ticket-holding viewers enter the auditorium lobby 30 minutes before showtime (T-30m) and begin streaming simultaneously at T-0, capturing the excitement and communal conversation of an opening-night theatrical premiere.",
  },
  {
    id: "admission-tiers",
    category: "ticketing",
    question: "What are the four cinema admission tiers?",
    answer:
      "Koncave Cinema offers four tailored viewing formats: 1) Individual Watch (solo cinema immersion, zero distractions, zero KYC); 2) Public Theatres (communal hall up to 1,000 viewers with live emoji chat and verified aliases); 3) Private Suite 5 (exclusive room for 5 friends with LiveKit WebRTC voice lounge); and 4) Private Suite 10 (VIP room for 10 friends with voice lounge and custom host permissions).",
  },
  {
    id: "transaction-fees",
    category: "ticketing",
    question: "Why is there a payment processing fee at checkout?",
    answer:
      "Koncave Cinema inverts traditional multiplex economics to return the primary share of box office proceeds directly to African filmmakers. To safeguard this creator box office pool, standard payment gateway processing fees are transparently itemized and passed through directly to the processor at checkout.",
  },
  {
    id: "refund-policy",
    category: "ticketing",
    question: "Are tickets refundable if I cannot attend?",
    answer:
      "Because virtual admissions represent reserved capacity in scheduled screenings, tickets are non-refundable once purchased. However, if a screening is cancelled by the filmmaker or platform, or if a confirmed platform server outage interrupts playback, automated refunds or credit passes are guaranteed under our Refund Policy.",
  },
  {
    id: "connection-buffering",
    category: "streaming",
    question: "What happens if my internet connection stalls or buffers during the movie?",
    answer:
      "Koncave Cinema incorporates an intelligent 4-Zone Catch-Up Engine. If your connection buffers briefly (4–30s), our player uses pitch-corrected 1.05x micro-acceleration to seamlessly bring you back to the live edge. For longer buffering pauses, our system keeps the screening room open for up to 15 minutes post-credits, ensuring you can finish the movie without missing the climax.",
  },
  {
    id: "device-concurrency",
    category: "streaming",
    question: "Why did my stream freeze when I opened another browser tab or device?",
    answer:
      "Each admission pass authorizes a single concurrent playback session to protect content security and creator royalties. If you open the movie in a second tab or device, your original session is immediately suspended with a concurrency lock notice.",
  },
  {
    id: "kyc-explanation",
    category: "kyc",
    question: "Why does Public Theatre checkout ask for phone verification?",
    answer:
      "To preserve a respectful, troll-free environment in 1,000-seat communal theatres, we verify phone numbers exclusively during checkout. In accordance with strict data minimization principles, your raw phone number is never stored; it is converted into an irreversible HMAC-SHA256 hash. Individual Watch and Private Suites bypass this completely.",
  },
  {
    id: "private-suites-hosting",
    category: "suites",
    question: "How do Private VIP Suites work with friends?",
    answer:
      "When you book a Private Suite (Suite 5 or Suite 10), you receive an exclusive room link to share with your chosen guests. The suite includes an integrated spatial voice lounge powered by LiveKit WebRTC, allowing your group to talk naturally over the film with host-controlled audio balancing.",
  },
  {
    id: "chowdeck-delivery",
    category: "concessions",
    question: "How does concession delivery work with Chowdeck?",
    answer:
      "When booking your ticket in supported delivery zones, you can add cinema snacks (popcorn, hot food, drinks) to your order. Delivery is coordinated through Chowdeck Relay to arrive before showtime so you can enjoy theatre concessions from your home.",
  },
];

export interface ContactChannel {
  icon: typeof Clapperboard;
  title: string;
  email: string;
  description: string;
  actionText: string;
  badge: string;
}

export const CONTACT_CHANNELS: ContactChannel[] = [
  {
    icon: Clapperboard,
    title: "Filmmaker & Premiere Submissions",
    email: "info@koncavecinema.com",
    description:
      "Direct channel for directors, producers, and Nollywood studios seeking synchronized virtual theatrical exhibition.",
    actionText: "Filmmaker Inquiries",
    badge: "Filmmakers First",
  },
  {
    icon: MessageSquare,
    title: "Viewer Support & Ticketing",
    email: "info@koncavecinema.com",
    description:
      "Assistance with showtime reservations, ticket receipts, screening room access, and Chowdeck concession delivery.",
    actionText: "Audience Care",
    badge: "Audience Care",
  },
  {
    icon: ShieldCheck,
    title: "Privacy & Compliance Office",
    email: "info@koncavecinema.com",
    description:
      "Inquiries regarding data minimization, account records, and content classification standards.",
    actionText: "Compliance",
    badge: "Privacy & Legal",
  },
  {
    icon: Building2,
    title: "Press & Institutional Partnerships",
    email: "info@koncavecinema.com",
    description:
      "Media inquiries, festival partnerships, brand collaborations, and enterprise private suite bookings.",
    actionText: "Partnerships",
    badge: "Corporate & Media",
  },
];

export const PRODUCER_COMPARISONS = [
  {
    feature: "Box Office Remittance",
    physical: "Heavy deductions for multiplex chain overhead, distributor cuts, and delayed splits",
    koncave: "Majority box office share remitted directly to the filmmaker and copyright holder",
  },
  {
    feature: "Auditing & Reporting",
    physical: "Opaque end-of-month spreadsheets with delayed ticket reconciliations",
    koncave: "Live ticket counter, seat occupancy telemetry, and transparent producer dashboard",
  },
  {
    feature: "Settlement Schedule",
    physical: "60 to 90 days delayed settlement periods",
    koncave: "Weekly automated settlements remitted directly via commercial bank transfer",
  },
  {
    feature: "Audience Reach",
    physical:
      "Restricted to physical cinema screen counts and geographic concentration in major cities",
    koncave: "Simultaneous premiere access for viewers across Nigeria and the global diaspora",
  },
  {
    feature: "Anti-Piracy Security",
    physical: "Camcording risks and physical bootleg recording in unmonitored theatres",
    koncave: "Mux Multi-DRM (FairPlay, Widevine, PlayReady) + Brownian forensic watermarking",
  },
  {
    feature: "IP & Master Rights",
    physical: "Restrictive theatrical exhibition windows and rights encumbrance",
    koncave: "Filmmaker retains full master copyright ownership and distribution sovereignty",
  },
];

export const EXHIBITION_FORMATS = [
  {
    id: "individual",
    icon: Film,
    title: "Individual Watch",
    subtitle: "Solo Immersion",
    description:
      "Dedicated solo cinephile experience. Distraction-free, zero chat notifications, and high-bitrate 1080p stream for focused viewers.",
    bgImage: "/placeholder/hall-purist.jpg",
  },
  {
    id: "public",
    icon: Tv,
    title: "Public Theatres",
    subtitle: "Communal Auditorium",
    description:
      "Communal cinema halls seating up to 1,000 verified attendees with live synchronized emoji reactions and moderated conversation.",
    bgImage: "/placeholder/hall-communal.jpg",
  },
  {
    id: "suite-5",
    icon: Clapperboard,
    title: "Private Suite 5",
    subtitle: "5-Guest VIP Room",
    description:
      "Intimate virtual screening room for 5 friends with LiveKit WebRTC spatial voice lounge and synchronized group playback.",
    bgImage: "/placeholder/hall-living-room.jpg",
  },
  {
    id: "suite-10",
    icon: Scale,
    title: "Private Suite 10",
    subtitle: "10-Guest VIP Room",
    description:
      "Exclusive VIP premiere for 10 attendees with voice lounge, custom showtime hosting, and host-controlled intermission capabilities.",
    bgImage: "/placeholder/hall-deluxe.jpg",
  },
];

export const LEGAL_DOCS = [
  { href: "/terms", label: "Terms of Use" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refunds", label: "Refund & Cancellation" },
  { href: "/cookies", label: "Cookie Policy" },
];
