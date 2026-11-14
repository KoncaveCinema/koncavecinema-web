import { afterEach, describe, expect, it, vi } from "vitest";

import { http } from "../http";
import { authorizePlayback, secureStop } from "./stream-security-api";
import { drmTokenSchema, playbackAuthorizationSchema } from "./stream-security-schemas";

vi.mock("../http", () => ({ http: vi.fn() }));

const httpMock = vi.mocked(http);

// Shapes from openapi.json on dev (258ce4f), envelope removed
const authorization = {
  sessionId: "9b2f6c1e-4d3a-4f8e-a1b2-c3d4e5f60718",
  playbackId: "a1B2c3D4e5F6g7H8",
  playbackToken: "eyJhbGciOiJSUzI1NiJ9.playback.signature",
  drmToken: null,
  drmProtected: false,
  streamUrl: "https://stream.mux.com/a1B2c3D4e5F6g7H8.m3u8?token=eyJ",
  heartbeatIntervalSeconds: 45,
  leaseSeconds: 90,
  schedule: {
    startTime: "2026-11-14T18:47:01.761Z",
    endTime: "2026-11-14T20:45:01.761Z",
    hardCutoff: "2026-11-14T21:00:01.761Z",
    serverTime: "2026-11-14T18:20:00.000Z",
  },
  watermark: {
    mode: "SUBTLE",
    userRef: "u7f3a2c",
    alias: "Ada_Watches",
    sessionId: "9b2f6c1e-4d3a-4f8e-a1b2-c3d4e5f60718",
    seed: 482193,
  },
};

describe("playback schemas", () => {
  it("accept an authorisation with a watermark and without DRM", () => {
    const parsed = playbackAuthorizationSchema.parse(authorization);
    expect(parsed.watermark?.alias).toBe("Ada_Watches");
    expect(parsed.drmToken).toBeNull();
  });

  it("accept a DRM film with its watermark off", () => {
    const parsed = playbackAuthorizationSchema.parse({
      ...authorization,
      drmProtected: true,
      drmToken: "eyJhbGciOiJSUzI1NiJ9.licence.signature",
      watermark: null,
    });
    expect(parsed.drmProtected).toBe(true);
    expect(parsed.watermark).toBeNull();
    expect(
      drmTokenSchema.parse({ drmToken: "eyJ.next", expiresAt: "2026-11-14T18:25:00.000Z" }),
    ).toMatchObject({ drmToken: "eyJ.next" });
  });
});

describe("the playback session", () => {
  afterEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("is presented again after a reload, so the device keeps its own lease", async () => {
    httpMock.mockResolvedValue(authorization);

    await authorizePlayback("t1");
    expect(httpMock.mock.calls[0]![0].data).toEqual({ ticketId: "t1", sessionId: undefined });

    await authorizePlayback("t1");
    expect(httpMock.mock.calls[1]![0].data).toEqual({
      ticketId: "t1",
      sessionId: authorization.sessionId,
    });
  });

  it("is forgotten once Secure Stop gives the lease back", async () => {
    httpMock.mockResolvedValue(authorization);
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });

    await authorizePlayback("t1");
    secureStop("t1", authorization.sessionId);
    expect(beacon).toHaveBeenCalledWith(
      "http://api.test/api/stream-security/secure-stop",
      JSON.stringify({ ticketId: "t1", sessionId: authorization.sessionId }),
    );

    await authorizePlayback("t1");
    expect(httpMock.mock.calls[1]![0].data).toEqual({ ticketId: "t1", sessionId: undefined });
  });
});
