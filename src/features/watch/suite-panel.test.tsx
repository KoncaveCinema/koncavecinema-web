import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RoomConnection } from "@/api/rooms/rooms-socket";

import { resetRoom, useRoom } from "./room-store";
import { SuiteDoor } from "./suite-door";
import { SuitePanel } from "./suite-panel";
import { useVoice } from "./suite-voice";

// The test browser lacks what a tooltip measures itself with
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const connection = (): RoomConnection => ({
  send: vi.fn(),
  react: vi.fn(),
  rejoin: vi.fn(),
  knock: vi.fn(),
  guest: vi.fn(),
  muteAll: vi.fn(),
  playback: vi.fn(),
  close: vi.fn(),
});

function suite(role: "host" | "guest", isPaused = false) {
  const open = connection();
  useRoom.setState({
    status: "open",
    connection: open,
    suite: {
      role,
      guests: [
        { ticketId: "g1", alias: "Tunde" },
        { ticketId: "g2", alias: "Ada_Watches" },
      ],
      waiting: role === "host" ? [{ ticketId: "g3", alias: "Kemi" }] : [],
      clock: {
        isPaused,
        position: 600,
        // Far ahead, so the countdown is stable while the test runs
        serverTime: new Date(Date.now() + 60_000).toISOString(),
        pauseRemainingSeconds: 1800,
      },
      maxCapacity: 5,
    },
  });
  useVoice.setState({ status: "connected", speaking: ["g2"] });
  return open;
}

afterEach(() => {
  resetRoom();
  useVoice.setState({ status: "idle", speaking: [], micLocked: false, names: {} });
});

describe("SuitePanel", () => {
  it("lets the host admit, mute and pause for everyone", () => {
    const open = suite("host");
    render(<SuitePanel ticketId="host-pass" alias="Host" />);
    expect(screen.getByText("Your suite · 3 of 5")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Let in" }));
    expect(open.guest).toHaveBeenCalledWith("admit", "g3");
    fireEvent.click(screen.getByRole("button", { name: "Mute Tunde" }));
    expect(open.guest).toHaveBeenCalledWith("mute", "g1");
    fireEvent.click(screen.getByRole("button", { name: "Pause for everyone" }));
    expect(open.playback).toHaveBeenCalledWith({ action: "pause" });
  });

  it("moves the film only while the host has it paused", () => {
    const open = suite("host", true);
    render(<SuitePanel ticketId="host-pass" alias="Host" />);
    fireEvent.click(screen.getByRole("button", { name: "Back 10 seconds" }));
    expect(open.playback).toHaveBeenCalledWith({ action: "seek", position: 590 });
    expect(screen.getByRole("button", { name: "Resume for everyone" })).toBeInTheDocument();
  });

  it("gives a guest the microphone and who's here, without the host's controls", () => {
    suite("guest");
    render(<SuitePanel ticketId="g1" alias="Tunde" />);
    expect(screen.getByText("You (Tunde)")).toBeInTheDocument();
    // A screen reader hears who's talking; sighted members see the ring
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "SPAN" && element.textContent === "Ada_Watches (talking)",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Turn on mic" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pause for everyone" })).not.toBeInTheDocument();
  });

  it("locks a guest's microphone while the host has them muted", () => {
    suite("guest");
    useVoice.setState({ micLocked: true });
    render(<SuitePanel ticketId="g1" alias="Tunde" />);
    expect(screen.getByRole("button", { name: "The host muted you" })).toBeDisabled();
    // Their own row says the same as their button
    expect(screen.getByLabelText("Muted by the host")).toBeInTheDocument();
  });

  it("names the host for a guest once voice knows them", () => {
    suite("guest");
    useVoice.setState({ names: { "host-pass": "Trayshmhirk01", g2: "Ada_Watches" } });
    render(<SuitePanel ticketId="g1" alias="Tunde" />);
    expect(screen.getByText("Trayshmhirk01")).toBeInTheDocument();
  });

  it("shows what each of the host's icon buttons does on hover", async () => {
    suite("host");
    render(<SuitePanel ticketId="host-pass" alias="Host" />);
    fireEvent.focus(screen.getByRole("button", { name: "Remove Tunde" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Remove Tunde");
  });
});

describe("SuiteDoor", () => {
  it("tells a knocking guest they're waiting for the host", () => {
    useRoom.setState({ admission: "waiting" });
    render(<SuiteDoor backToPass={null} />);
    expect(screen.getByText("Waiting for the host to let you in")).toBeInTheDocument();
  });

  it("lets a removed guest knock again", () => {
    const open = connection();
    useRoom.setState({ admission: "kicked", connection: open });
    render(<SuiteDoor backToPass={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Knock again" }));
    expect(open.knock).toHaveBeenCalled();
  });
});
