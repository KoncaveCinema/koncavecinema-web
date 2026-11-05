import { roomName } from "@/features/dashboard/ticket-card";
import type { TicketTier } from "@/types/domain";

/** A room's name for staff, with a suite's size: both suites share the members' name */
export function roomLabel(tier: TicketTier): string {
  if (tier === "PRIVATE_5") return `${roomName(tier)} (5)`;
  if (tier === "PRIVATE_10") return `${roomName(tier)} (10)`;
  return roomName(tier);
}
