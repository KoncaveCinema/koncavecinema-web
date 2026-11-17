import { describe, expect, it } from "vitest";

import type { ChatMessage } from "@/api/rooms/rooms-schemas";

import { MAX_FLOATING, MAX_MESSAGES, withMessages, withReaction } from "./room-store";

const message = (id: number): ChatMessage => ({
  id: `m${id}`,
  senderAlias: "Ada_Watches",
  text: `Message ${id}`,
  sentAt: "2026-11-16T18:00:00.000Z",
});

describe("room chat", () => {
  it("adds new messages after the old, each once", () => {
    const first = withMessages([], [message(1), message(2)]);
    // A reconnect resends the recent messages: only the new one is added
    const next = withMessages(first, [message(1), message(2), message(3)]);
    expect(next.map((entry) => entry.id)).toEqual(["m1", "m2", "m3"]);
    // Nothing new keeps the same list, so nothing re-renders
    expect(withMessages(next, [message(3)])).toBe(next);
  });

  it("keeps the latest messages only", () => {
    const many = Array.from({ length: MAX_MESSAGES + 30 }, (_, index) => message(index));
    const kept = withMessages([], many);
    expect(kept).toHaveLength(MAX_MESSAGES);
    expect(kept[0]?.id).toBe("m30");
    expect(kept.at(-1)?.id).toBe(`m${MAX_MESSAGES + 29}`);
  });

  it("floats a few reactions at once, across the picture", () => {
    let floating = withReaction([], "👏");
    for (let index = 0; index < MAX_FLOATING + 5; index++) floating = withReaction(floating, "🔥");
    expect(floating).toHaveLength(MAX_FLOATING);
    expect(floating.every((reaction) => reaction.emoji === "🔥")).toBe(true);
    expect(floating.every((reaction) => reaction.left >= 10 && reaction.left < 90)).toBe(true);
  });
});
