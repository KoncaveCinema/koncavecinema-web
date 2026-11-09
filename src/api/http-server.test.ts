// @vitest-environment node
import axios, { AxiosError, type AxiosAdapter } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const envelope = (data: unknown) => ({ statusCode: 200, success: true, data });

/* The server client copies axios's defaults when it is created, so the stub goes in first */
async function load(adapter: AxiosAdapter) {
  vi.resetModules();
  axios.defaults.adapter = adapter;
  const { httpServer } = await import("./http-server");
  return httpServer;
}

describe("httpServer (cached public reads)", () => {
  afterEach(() => {
    axios.defaults.adapter = undefined;
  });

  it("tries a read once more when it never reached the API", async () => {
    let calls = 0;
    const httpServer = await load(async (config) => {
      calls += 1;
      if (calls === 1) throw new AxiosError("connect ECONNREFUSED", "ECONNREFUSED", config);
      return { status: 200, data: envelope({ slug: "sade" }), statusText: "", headers: {}, config };
    });

    await expect(httpServer({ url: "/movies/sade" })).resolves.toEqual({ slug: "sade" });
    expect(calls).toBe(2);
  });

  it("doesn't retry the API's own answers", async () => {
    let calls = 0;
    const httpServer = await load(async (config) => {
      calls += 1;
      const data = { statusCode: 404, code: "NOT_FOUND", message: "Movie not found." };
      const response = { status: 404, data, statusText: "", headers: {}, config };
      throw new AxiosError("Request failed", undefined, config, undefined, response);
    });

    await expect(httpServer({ url: "/movies/nope" })).rejects.toMatchObject({ status: 404 });
    expect(calls).toBe(1);
  });
});
