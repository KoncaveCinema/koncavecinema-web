// Client code without its own "use client": only the watch room (already a client component)
// imports it.

import { useSession } from "@/features/auth/session";

import { useRoom } from "./room-store";
import { useVoice } from "./suite-voice";

/*
 * Each member's colour in the screening room: their name in the chat, their initial in a suite's
 * list and the ring while they talk. It comes from the screen alias, which the API keeps unique
 * per account, so a member has the same colour on every screen and every visit. In a suite, where
 * everyone is known, no two members share one.
 */

/** Twelve clearly different colours, none near the brand red, all legible on black */
export const MEMBER_COLORS = [
  "#fb923c", // orange
  "#fbbf24", // amber
  "#facc15", // yellow
  "#a3e635", // lime
  "#4ade80", // green
  "#2dd4bf", // teal
  "#22d3ee", // cyan
  "#38bdf8", // sky
  "#818cf8", // indigo
  "#a78bfa", // violet
  "#e879f9", // fuchsia
  "#f9a8d4", // light pink
] as const;

/** The member's own colour, by its place in MEMBER_COLORS */
function preferred(alias: string): number {
  // FNV-1a: close aliases ("member_1", "member_2") still land far apart
  let hash = 0x811c9dc5;
  for (const char of alias) hash = Math.imul(hash ^ char.codePointAt(0)!, 0x01000193);
  return (hash >>> 0) % MEMBER_COLORS.length;
}

/** The member's own colour, from their screen alias */
export function memberColor(alias: string): string {
  return MEMBER_COLORS[preferred(alias)]!;
}

/**
 * A suite's colours: each member keeps their own unless someone before them already has it, then
 * takes the next free one. Everyone sees the members in the same order (the host, then the
 * guests as the API lists them), so every screen gives the same answer.
 */
export function suiteColors(aliases: string[]): Map<string, string> {
  const taken = new Set<number>();
  const colors = new Map<string, string>();
  for (const alias of aliases) {
    if (colors.has(alias)) continue;
    let index = preferred(alias);
    for (let step = 0; step < MEMBER_COLORS.length && taken.has(index); step += 1) {
      index = (index + 1) % MEMBER_COLORS.length;
    }
    taken.add(index);
    colors.set(alias, MEMBER_COLORS[index]!);
  }
  return colors;
}

/**
 * The suite host's alias: this viewer's own as the host; for a guest, the voice name of the one
 * member who is neither a guest nor them (known once voice connects)
 */
export function useHostAlias(ticketId: string): string | undefined {
  const own = useSession((state) => state.user?.publicScreenAlias ?? undefined);
  const suite = useRoom((state) => state.suite);
  const names = useVoice((state) => state.names);
  if (!suite) return undefined;
  if (suite.role === "host") return own;
  const host = Object.keys(names).find(
    (id) => id !== ticketId && !suite.guests.some((guest) => guest.ticketId === id),
  );
  return host === undefined ? undefined : names[host];
}

/** Each member's colour, by alias: settled for everyone in a suite, the member's own elsewhere */
export function useMemberColors(ticketId: string): (alias: string) => string {
  const guests = useRoom((state) => state.suite?.guests);
  const hostAlias = useHostAlias(ticketId);
  if (!guests) return memberColor;
  const colors = suiteColors([
    ...(hostAlias ? [hostAlias] : []),
    ...guests.map((guest) => guest.alias),
  ]);
  return (alias) => colors.get(alias) ?? memberColor(alias);
}
