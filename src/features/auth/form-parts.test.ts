import { describe, expect, it } from "vitest";

import { safeNext } from "./form-parts";

describe("safeNext", () => {
  it("follows same-site paths", () => {
    expect(safeNext("/movies/x/showtimes/y?room=PUBLIC")).toBe("/movies/x/showtimes/y?room=PUBLIC");
  });
  it("refuses other origins and protocol-relative links", () => {
    expect(safeNext("https://evil.example")).toBe("/movies");
    expect(safeNext("//evil.example")).toBe("/movies");
    expect(safeNext(null)).toBe("/movies");
  });
  it("refuses paths a browser would read as another site", () => {
    for (const trick of [
      "/\\evil.example",
      "/\\/evil.example",
      "/\t/evil.example",
      "/\n/evil.example",
    ]) {
      expect(safeNext(trick)).toBe("/movies");
    }
  });
  it("keeps the query and fragment of a same-site path", () => {
    expect(safeNext("/invite/VIP-1?x=1#top", "/dashboard")).toBe("/invite/VIP-1?x=1#top");
    expect(safeNext("movies", "/dashboard")).toBe("/dashboard");
  });
});
