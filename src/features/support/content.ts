/** Help centre questions and contact topics. Answers stay in plain language: no vendor or engineering names. */

export const SUPPORT_EMAIL = "info@koncavecinema.com";

export const FAQ_CATEGORIES = [
  { id: "tickets", label: "Tickets" },
  { id: "watching", label: "Watching" },
  { id: "privacy", label: "Privacy and verification" },
  { id: "suites", label: "Private suites" },
  { id: "concessions", label: "Concessions" },
] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number]["id"];

export interface Faq {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    id: "scheduled-premieres",
    category: "tickets",
    question: "How does a Koncave premiere work?",
    answer:
      "Every film plays at a scheduled showtime, like a cinema. The lobby opens 30 minutes before, and everyone with a ticket starts watching together at the same moment, so the laughs, gasps and chat happen in real time.",
  },
  {
    id: "ways-to-watch",
    category: "tickets",
    question: "What are the ways to watch?",
    answer:
      "Four: Individual watch, just you and the film; a Public hall, watching with hundreds of fans with live chat and reactions; and two Private suites, for up to 5 or up to 10 guests, with a voice lounge for your group.",
  },
  {
    id: "checkout-fees",
    category: "tickets",
    question: "Why is there a payment fee at checkout?",
    answer:
      "Payment processing fees are shown separately at checkout and added on top of the ticket price, so they never come out of the filmmaker's share. You always see the full breakdown before you pay.",
  },
  {
    id: "refunds",
    category: "tickets",
    question: "Can I get a refund if I can't make it?",
    answer:
      "Tickets are for a specific showtime, so they are not refundable if you miss it. If a screening is cancelled, or a fault on our side stops playback, you get a refund or a replacement ticket. The Refund policy has the details.",
  },
  {
    id: "payment-methods",
    category: "tickets",
    question: "How can I pay?",
    answer:
      "By card in naira, US dollars, pounds or euros, by bank transfer, by USSD, or with Apple Pay. Payments are processed by Paystack.",
  },
  {
    id: "diaspora",
    category: "tickets",
    question: "Can I watch from outside Nigeria?",
    answer:
      "Yes. Premieres are open to audiences across Nigeria and the diaspora, and showtimes are shown in your own time zone, so you always know when the film starts where you are.",
  },
  {
    id: "buffering",
    category: "watching",
    question: "What happens if my connection drops during the film?",
    answer:
      "Short stalls catch up on their own: the player gently speeds up until you are back with everyone else. After a longer interruption you can keep watching from where you were, and the room stays open for a while after the credits so you can finish the film.",
  },
  {
    id: "one-screen",
    category: "watching",
    question: "Why did the film stop when I opened it on another device?",
    answer:
      "Each ticket plays on one screen at a time. This protects the film and the people who made it. Opening it somewhere else pauses the first screen.",
  },
  {
    id: "devices",
    category: "watching",
    question: "Which devices can I watch on?",
    answer:
      "Any phone, tablet, laptop or desktop with an up-to-date browser: Chrome, Safari, Edge or Firefox. The picture adapts to your connection, from fibre to 4G.",
  },
  {
    id: "tv",
    category: "watching",
    question: "Can I watch on my TV?",
    answer:
      "Not with an app yet. Smart TV apps and one-tap casting are on our slate, and we will announce them here when they are ready.",
  },
  {
    id: "when-to-join",
    category: "watching",
    question: "When should I join a screening?",
    answer:
      "The lobby opens 30 minutes before showtime. Joining a few minutes early gives your connection time to settle before the film starts.",
  },
  {
    id: "phone-verification",
    category: "privacy",
    question: "Why do Public halls ask for my phone number?",
    answer:
      "A quick phone check keeps public halls free of bots and anonymous trolls. We never keep your number as you typed it; only a scrambled code that can't be turned back into it is stored. Individual watch and Private suites don't ask for it.",
  },
  {
    id: "card-details",
    category: "privacy",
    question: "Do you keep my card details?",
    answer:
      "No. Card details go straight to Paystack, our licensed payment processor. Koncave never sees or stores your full card number.",
  },
  {
    id: "delete-data",
    category: "privacy",
    question: "How do I delete my account or my data?",
    answer:
      "Under the Nigeria Data Protection Act you can ask us to delete your account and personal data at any time. Send the request from the email on your account to info@koncavecinema.com and we will confirm once it is done. The Privacy policy explains what we keep and why.",
  },
  {
    id: "suites-guests",
    category: "suites",
    question: "How do I watch with friends in a Private suite?",
    answer:
      "Book a suite and you get a private invite link to share. Your guests join the same room, the film plays in sync for everyone, and you can talk to each other in the voice lounge. As host, you can pause for the whole room.",
  },
  {
    id: "suite-tickets",
    category: "suites",
    question: "Do my guests need their own tickets?",
    answer:
      "No. One suite booking covers everyone: up to 5 or up to 10 guests, depending on the suite. Share the invite link and admit guests as they arrive.",
  },
  {
    id: "concessions",
    category: "concessions",
    question: "Can I order snacks for the screening?",
    answer:
      "Where delivery is available, you can add popcorn, food and drinks when you book. They are timed to arrive before the film starts.",
  },
];

/** Contact form topics. `PRODUCERS` is preselected when visitors arrive from the producers page. */
export const CONTACT_TOPICS = [
  {
    value: "SUPPORT",
    label: "Tickets and support",
    description: "Bookings, receipts, getting into a screening, playback problems.",
  },
  {
    value: "PRODUCERS",
    label: "Filmmakers and producers",
    description: "Premiering your film on Koncave, partnerships and the producer terms.",
  },
  {
    value: "PARTNERSHIPS",
    label: "Partnerships and private events",
    description: "Brands, festivals, and private screenings for companies or groups.",
  },
  {
    value: "PRESS",
    label: "Press",
    description: "Interviews, media requests and press materials.",
  },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"];
