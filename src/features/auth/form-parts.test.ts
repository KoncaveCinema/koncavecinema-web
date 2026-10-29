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
});
