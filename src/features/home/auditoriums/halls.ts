import type { TicketTier } from "@/features/catalog/types";

export interface Auditorium {
  tier: TicketTier;
  name: string;
  kind: string;
  seats: string;
  image: string;
  priceSuffix: string;
  description: string;
  features: string[];
}

/** The four ways to watch, from the API's ticket tiers (TicketTier). */
export const AUDITORIUMS: Auditorium[] = [
  {
    tier: "INDIVIDUAL",
    name: "The Purist's Seclusion",
    kind: "Individual watch",
    seats: "Just you",
    image: "/placeholder/hall-purist.jpg",
    priceSuffix: "per ticket",
    description: "The film and nothing else. No chat, no pop-ups, no distractions.",
    features: [
      "Distraction-free player",
      "Full HD picture, adaptive to your connection",
      "Watch from any device",
    ],
  },
  {
    tier: "PUBLIC",
    name: "The Communal Premiere",
    kind: "Public hall",
    seats: "Hundreds of fans",
    image: "/placeholder/hall-communal.jpg",
    priceSuffix: "per seat",
    description: "The buzz of a packed opening night: live chat and reactions with fellow fans.",
    features: [
      "Live hall chat with emoji applause",
      "Verified attendees, no anonymous trolls",
      "Spoiler shield if you fall behind",
    ],
  },
  {
    tier: "PRIVATE_5",
    name: "The Digital Living Room",
    kind: "Private suite",
    seats: "Up to 5 guests",
    image: "/placeholder/hall-living-room.jpg",
    priceSuffix: "per suite",
    description: "Your own room with voice chat: laugh, gasp and argue about the ending together.",
    features: [
      "Voice lounge for your group",
      "Host controls: pause for everyone",
      "Private invite links",
    ],
  },
  {
    tier: "PRIVATE_10",
    name: "The Deluxe Watch Party",
    kind: "Private suite",
    seats: "Up to 10 guests",
    image: "/placeholder/hall-deluxe.jpg",
    priceSuffix: "per suite",
    description: "A private premiere for the whole crew, with room for ten and you in charge.",
    features: ["Voice lounge for ten", "Admit guests as they arrive", "One booking, ten passes"],
  },
];
