import { describe, expect, it } from "vitest";

import { signInSchema, userProfileSchema } from "./auth-schemas";

// GET /auth/me's documented reply (openapi.json on dev, df69c97), envelope removed
const profile = {
  id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  email: "user@koncavecinema.com",
  publicScreenAlias: "CinemaLover_99",
  isPhoneVerified: false,
  role: "VIEWER",
  createdAt: "2026-09-22T18:00:00.000Z",
  aliasChangeableAt: null,
};

describe("auth schemas", () => {
  it("accept the API's profile", () => {
    expect(userProfileSchema.parse(profile)).toEqual(profile);
    expect(
      userProfileSchema.parse({
        ...profile,
        publicScreenAlias: null,
        aliasChangeableAt: "2026-12-01T09:00:00.000Z",
      }).aliasChangeableAt,
    ).toBe("2026-12-01T09:00:00.000Z");
  });

  it("accept the sign-in reply", () => {
    const reply = { accessToken: "jwt", expiresIn: 900, user: profile };
    expect(signInSchema.parse(reply).user.email).toBe("user@koncavecinema.com");
  });

  it("refuse a profile the screens couldn't trust", () => {
    expect(userProfileSchema.safeParse({ ...profile, role: "OWNER" }).success).toBe(false);
    expect(userProfileSchema.safeParse({ ...profile, isPhoneVerified: "yes" }).success).toBe(false);
    const { aliasChangeableAt: _missing, ...withoutLock } = profile;
    expect(userProfileSchema.safeParse(withoutLock).success).toBe(false);
  });
});
