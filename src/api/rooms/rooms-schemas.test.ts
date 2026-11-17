import { describe, expect, it } from "vitest";

import { chatMessageSchema, roomErrorSchema, roomStateSchema } from "./rooms-schemas";

const at = "2026-11-16T18:00:00.000Z";

describe("room events", () => {
  it("accept a hall's room_state, its recent messages without `mine`", () => {
    const state = roomStateSchema.parse({
      kind: "hall",
      room: "hall:s1:2",
      hall: 2,
      members: 812,
      recent: [{ id: "m1", senderAlias: "Ada_Watches", text: "Here we go", sentAt: at }],
      accessEndsAt: at,
    });
    expect(state.hall).toBe(2);
    expect(state.recent[0]?.mine).toBeUndefined();
  });

  it("accept a suite's room_state, with no hall", () => {
    const state = roomStateSchema.parse({
      kind: "suite",
      room: "suite:r1",
      hall: null,
      members: 4,
      recent: [],
      accessEndsAt: at,
    });
    expect(state.kind).toBe("suite");
  });

  it("accept a message and a refusal as the API sends them", () => {
    expect(
      chatMessageSchema.parse({
        id: "m2",
        senderAlias: "Tunde",
        text: "Call me on [number removed]",
        sentAt: at,
        mine: true,
      }).mine,
    ).toBe(true);
    expect(
      roomErrorSchema.parse({
        code: "MESSAGE_BLOCKED",
        message: "Nothing was left to send.",
        event: "send_message",
      }),
    ).toEqual({ code: "MESSAGE_BLOCKED", event: "send_message" });
  });
});
