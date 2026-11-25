import { describe, expect, it } from "vitest";

import { baseUrl } from "./env";

describe("baseUrl", () => {
  it("drops a trailing slash, so links built on it never double the slash", () => {
    const origin = baseUrl.parse("https://staging.koncavecinema.com/");
    expect(`${origin}/invite/VIP-4DB8477FE3`).toBe(
      "https://staging.koncavecinema.com/invite/VIP-4DB8477FE3",
    );
  });

  it("keeps a URL without one as it is", () => {
    expect(baseUrl.parse("http://localhost:3000/api")).toBe("http://localhost:3000/api");
  });
});
