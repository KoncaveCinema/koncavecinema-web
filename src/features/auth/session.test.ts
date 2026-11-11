import { act, render } from "@testing-library/react";
// eslint-disable-next-line no-restricted-imports -- stubs the network beneath the API client
import axios, { AxiosError } from "axios";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setAccessToken } from "@/api/access-token";
import type { UserProfile } from "@/api/auth/auth-schemas";
import { refreshAccessToken } from "@/api/client";
import { getQueryClient } from "@/api/query-client";

import { SessionRestorer, useSession } from "./session";

// The page-load restore stays pending, so only the refusal below changes the session
vi.mock("@/api/auth/auth-api", () => ({ restoreSession: () => new Promise(() => {}) }));

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

  describe("when the API refuses the refresh", () => {
    const originalAdapter = axios.defaults.adapter;
    afterEach(() => {
      axios.defaults.adapter = originalAdapter;
    });

    it("ends the session here, so the person is sent to sign in", async () => {
      render(createElement(SessionRestorer));
      useSession.getState().setUser(person("ada"));
      setAccessToken("expired");
      getQueryClient().setQueryData(["/tickets/my-tickets"], ["pass"]);
      // A replaced refresh token came back: the API ended every session of the account
      axios.defaults.adapter = async (config) => {
        throw new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, {
          status: 401,
          statusText: "",
          headers: {},
          config,
          data: { statusCode: 401, code: "REFRESH_TOKEN_INVALID", message: "x" },
        });
      };

      await act(() => refreshAccessToken());

      expect(useSession.getState()).toMatchObject({ status: "signed-out", user: null });
      expect(cached()).toBeUndefined();
    });
  });
});
