import { beforeEach, describe, expect, it } from "vitest";

import type { UserProfile } from "@/api/auth/auth-schemas";
import { getQueryClient } from "@/api/query-client";

import { useSession } from "./session";

const person = (id: string): UserProfile => ({
  id,
  email: `${id}@example.com`,
  publicScreenAlias: null,
  isPhoneVerified: false,
  role: "VIEWER",
  createdAt: "2026-09-22T18:00:00.000Z",
  aliasChangeableAt: null,
});

const cached = () => getQueryClient().getQueryData(["/tickets/my-tickets"]);

describe("the session", () => {
  beforeEach(() => {
    useSession.setState({ status: "loading", user: null });
    getQueryClient().clear();
  });

  it("keeps the cache when the session is restored or the profile changes", () => {
    useSession.getState().setUser(person("ada"));
    getQueryClient().setQueryData(["/tickets/my-tickets"], ["pass"]);

    useSession.getState().setUser({ ...person("ada"), publicScreenAlias: "Ada_Watches" });

    expect(cached()).toEqual(["pass"]);
  });

  it("clears the cache when the person signs out", () => {
    useSession.getState().setUser(person("ada"));
    getQueryClient().setQueryData(["/tickets/my-tickets"], ["pass"]);

    useSession.getState().setUser(null);

    expect(cached()).toBeUndefined();
    expect(useSession.getState().status).toBe("signed-out");
  });

  it("clears the cache when someone else signs in on this device", () => {
    useSession.getState().setUser(person("ada"));
    getQueryClient().setQueryData(["/tickets/my-tickets"], ["pass"]);

    useSession.getState().setUser(person("bola"));

    expect(cached()).toBeUndefined();
  });
});
