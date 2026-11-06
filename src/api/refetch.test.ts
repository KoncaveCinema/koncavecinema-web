import { describe, expect, it } from "vitest";

import { matchesPrefixes } from "./refetch";

describe("matchesPrefixes", () => {
  it("matches a query key by its API path", () => {
    expect(matchesPrefixes(["/admin/movies", { page: 2 }], ["/admin/movies"])).toBe(true);
    expect(matchesPrefixes(["/admin/movies/m1"], ["/admin/movies"])).toBe(true);
    expect(matchesPrefixes(["/movies/ember"], ["/admin/movies"])).toBe(false);
    // Keys of the modules not yet moved are left alone
    expect(matchesPrefixes(["admin", "films"], ["/admin/movies"])).toBe(false);
  });
});
