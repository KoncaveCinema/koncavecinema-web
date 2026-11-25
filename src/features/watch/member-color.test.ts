import { describe, expect, it } from "vitest";

import { MEMBER_COLORS, memberColor, suiteColors } from "./member-color";

describe("member colours", () => {
  it("gives a member the same colour every time, from the twelve", () => {
    expect(memberColor("Tunde")).toBe(memberColor("Tunde"));
    expect(MEMBER_COLORS).toContain(memberColor("Trayshmhirk01"));
    expect(new Set(MEMBER_COLORS).size).toBe(12);
  });

  it("never gives two members of a suite the same colour", () => {
    const aliases = ["Trayshmhirk01", "first_member", "that_random_nigga_01", "Tunde", "Kemi"];
    const colors = suiteColors(aliases);
    expect(new Set(colors.values()).size).toBe(aliases.length);
  });

  it("keeps each member's own colour unless someone before them has it", () => {
    // Some alias shares Tunde's own colour: among twelve colours one turns up quickly
    const rival = Array.from({ length: 100 }, (_, n) => `member_${n}`).find(
      (alias) => memberColor(alias) === memberColor("Tunde"),
    )!;
    const colors = suiteColors(["Tunde", rival]);
    expect(colors.get("Tunde")).toBe(memberColor("Tunde"));
    expect(colors.get(rival)).not.toBe(memberColor("Tunde"));
  });

  it("gives every screen the same answer for the same members", () => {
    const members = ["Host_Ada", "g1", "g2", "g3"];
    expect([...suiteColors(members)]).toEqual([...suiteColors([...members])]);
  });
});
