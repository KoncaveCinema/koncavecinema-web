import { afterEach, describe, expect, it, vi } from "vitest";

import { refreshAccessToken } from "../client";
import { http } from "../http";
import { updateScreenAlias, verifyIdentity } from "./auth-api";

vi.mock("../http", () => ({ http: vi.fn() }));
vi.mock("../client", () => ({ refreshAccessToken: vi.fn() }));

const httpMock = vi.mocked(http);
const profile = {
  id: "u1",
  email: "ada@example.com",
  publicScreenAlias: "Ada_Watches",
  isPhoneVerified: false,
  role: "VIEWER",
  createdAt: "2026-09-22T18:00:00.000Z",
  aliasChangeableAt: null,
};

describe("auth calls", () => {
  afterEach(() => vi.clearAllMocks());

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
