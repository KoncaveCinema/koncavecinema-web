import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RoomConnection } from "@/api/rooms/rooms-socket";

import { aliasColor, RoomChat } from "./room-chat";
import { resetRoom, settleFirst, useRoom } from "./room-store";

const at = "2026-11-16T18:00:00.000Z";

function openHall() {
  const connection: RoomConnection = {
    send: vi.fn(),
    react: vi.fn(),
    rejoin: vi.fn(),
    close: vi.fn(),
  };
  useRoom.setState({
    status: "open",
    room: { kind: "hall", hall: 2, members: 812, accessEndsAt: at },
    messages: [
      { id: "m1", senderAlias: "Tunde", text: "Here we go", sentAt: at },
      { id: "m2", senderAlias: "Ada_Watches", text: "Finally", sentAt: at, mine: true },
    ],
    connection,
  });
  return connection;
}

afterEach(resetRoom);

describe("RoomChat", () => {
  it("shows the hall, its messages and the reactions", () => {
    openHall();
    render(<RoomChat />);
    expect(screen.getByText("Hall 2 · 812 watching")).toBeInTheDocument();
    expect(screen.getByText("Here we go")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^React / })).toHaveLength(6);
  });

  it("keeps Send disabled until there is something to send, then sends it", () => {
    const connection = openHall();
    render(<RoomChat />);
    const send = screen.getByRole("button", { name: "Send" });
    expect(send).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "  Hello hall  " } });
    expect(send).toBeEnabled();
    fireEvent.click(send);
    expect(connection.send).toHaveBeenCalledWith("Hello hall");
    // On its way: shown as sending, and the box is free for the next one at once
    expect(screen.getByText("Sending…")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });

  it("sends messages written in a row one after another, never making anyone wait", () => {
    const connection = openHall();
    render(<RoomChat />);
    const box = screen.getByLabelText("Message");
    for (const text of ["one", "two"]) {
      fireEvent.change(box, { target: { value: text } });
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
    }
    // Only the first is on the wire; the second waits for its echo
    expect(connection.send).toHaveBeenCalledTimes(1);
    act(() => settleFirst());
    expect(connection.send).toHaveBeenLastCalledWith("two");
  });

  it("explains a message that was nothing but removed content", () => {
    openHall();
    useRoom.setState({ blocked: true, draft: "call 08012345678" });
    render(<RoomChat />);
    expect(screen.getByText(/left nothing to send/)).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveValue("call 08012345678");
  });

  it("says why a room refused instead of offering the composer", () => {
    useRoom.setState({ status: "refused", refusal: "KYC_REQUIRED" });
    render(<RoomChat />);
    expect(screen.getByText("Public hall chat needs a verified phone number.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Message")).not.toBeInTheDocument();
  });

  it("gives each name its own colour, the same every time, and never red", () => {
    expect(aliasColor("Tunde")).toBe(aliasColor("Tunde"));
    expect(aliasColor("Tunde")).not.toBe(aliasColor("Ada_Watches"));
    for (const alias of ["a", "Tunde", "Ada_Watches", "first_member", "Trayshmhirk01"]) {
      const hue = Number(/hsl\((\d+)/.exec(aliasColor(alias))?.[1]);
      expect(hue).toBeGreaterThanOrEqual(20);
      expect(hue).toBeLessThan(320);
    }
  });
});
