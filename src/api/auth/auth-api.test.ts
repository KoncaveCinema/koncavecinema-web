import { afterEach, describe, expect, it, vi } from "vitest";

import { getAccessToken, setAccessToken } from "../access-token";
import { refreshAccessToken, restoreAccessToken } from "../client";
import { ApiError, ErrorCode } from "../errors";
import { http } from "../http";
import {
  RESTORE_RETRY_MS,
  enableTwoFactor,
  restoreSession,
  signIn,
  updateScreenAlias,
  verifyEmail,
  verifyIdentity,
} from "./auth-api";

vi.mock("../http", () => ({ http: vi.fn() }));
vi.mock("../client", () => ({ refreshAccessToken: vi.fn(), restoreAccessToken: vi.fn() }));

const restoreMock = vi.mocked(restoreAccessToken);
const offline = new ApiError({ status: 0, code: ErrorCode.NETWORK_ERROR, messages: ["offline"] });
const noWait = (_ms: number) => Promise.resolve();

const httpMock = vi.mocked(http);
const profile = {
  id: "u1",
  email: "ada@example.com",
  publicScreenAlias: "Ada_Watches",
  isPhoneVerified: false,
  role: "VIEWER",
  createdAt: "2026-09-22T18:00:00.000Z",
  emailVerified: true,
  twoFactorEnabled: false,
  aliasChangeableAt: null,
};

describe("auth calls", () => {
  afterEach(() => vi.clearAllMocks());

  it("sign in at once, or hold off with a challenge when two-factor sign-in is on", async () => {
    setAccessToken(null);
    httpMock.mockResolvedValueOnce({
      twoFactorRequired: true,
      challengeToken: "c1",
      expiresIn: 300,
    });
    const challenged = await signIn("ada@example.com", "S3cure!pass");
    expect(challenged).toEqual({
      signedIn: false,
      challenge: { twoFactorRequired: true, challengeToken: "c1", expiresIn: 300 },
    });
    // No token until the code is right
    expect(getAccessToken()).toBeNull();

    httpMock.mockResolvedValueOnce({ accessToken: "t1", expiresIn: 900, user: profile });
    await expect(verifyEmail("ada@example.com", "482913")).resolves.toEqual({
      signedIn: true,
      user: profile,
    });
    expect(getAccessToken()).toBe("t1");
  });

  it("switch to the new session when two-factor sign-in is turned on", async () => {
    httpMock.mockResolvedValueOnce({
      accessToken: "t2",
      expiresIn: 900,
      user: { ...profile, twoFactorEnabled: true },
      recoveryCodes: ["k7m2p-x9q4r"],
    });
    const enabled = await enableTwoFactor("482913");
    expect(enabled.recoveryCodes).toEqual(["k7m2p-x9q4r"]);
    expect(getAccessToken()).toBe("t2");
  });

  it("refresh the access token after an alias change, since the token carries the alias", async () => {
    httpMock.mockResolvedValue(profile);

    await expect(updateScreenAlias("Ada_Watches")).resolves.toEqual(profile);
    expect(httpMock).toHaveBeenCalledWith({
      url: "/auth/me",
      method: "PATCH",
      data: { publicScreenAlias: "Ada_Watches" },
    });
    expect(refreshAccessToken).toHaveBeenCalledOnce();
  });

  it("leave the alias out of the identity check for a member who already has one", async () => {
    httpMock.mockResolvedValue(profile);

    await verifyIdentity({ otp: "123456", legalFullName: "Ada Obi" });
    const [request] = httpMock.mock.calls[0]!;
    expect(JSON.parse(JSON.stringify(request.data))).toEqual({
      otp: "123456",
      legalFullName: "Ada Obi",
    });
  });
});

describe("restoring the session on page load", () => {
  afterEach(() => {
    vi.clearAllMocks();
    setAccessToken(null);
  });

  it("tries again while the API can't be reached, and signs in once it answers", async () => {
    restoreMock.mockRejectedValueOnce(offline).mockRejectedValueOnce(offline);
    restoreMock.mockResolvedValueOnce("token");
    httpMock.mockResolvedValue(profile);
    const wait = vi.fn(noWait);

    await expect(restoreSession(wait)).resolves.toEqual(profile);
    expect(wait.mock.calls.map(([ms]) => ms)).toEqual(RESTORE_RETRY_MS.slice(0, 2));
  });

  it("is signed out at once when the API refuses the cookie", async () => {
    restoreMock.mockResolvedValue(null);

    await expect(restoreSession(noWait)).resolves.toBeNull();
    expect(restoreMock).toHaveBeenCalledOnce();
  });

  it("gives up after its last try, releasing anything waiting on a token", async () => {
    setAccessToken("stale");
    restoreMock.mockRejectedValue(offline);

    await expect(restoreSession(noWait)).rejects.toBe(offline);
    expect(restoreMock).toHaveBeenCalledTimes(RESTORE_RETRY_MS.length + 1);
    expect(getAccessToken()).toBeNull();
  });
});
