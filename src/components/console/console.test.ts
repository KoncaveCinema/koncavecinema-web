import { describe, expect, it } from "vitest";

import { reasonProblem, typedConfirmationMatches } from "./confirm-dialog";
import { isActive } from "./console-nav";
import { statusMeta } from "./status-badge";

describe("statusMeta", () => {
  it("gives every known status its words and tone", () => {
    expect(statusMeta("ticket", "RESERVED")).toEqual({ label: "On hold", tone: "attention" });
    expect(statusMeta("payment", "SUCCESS")).toEqual({ label: "Paid", tone: "positive" });
    expect(statusMeta("showtime", "LIVE")).toEqual({ label: "Live", tone: "live" });
    expect(statusMeta("role", "SUPER_ADMIN").label).toBe("Super admin");
  });
  it("shows a status the API adds later instead of breaking", () => {
    expect(statusMeta("payment", "PARTIALLY_REFUNDED")).toEqual({
      label: "Partially refunded",
      tone: "neutral",
    });
  });
});

describe("reasonProblem", () => {
  const rule = { label: "Reason", min: 5, max: 500 };
  it("asks for the API's minimum, ignoring surrounding spaces", () => {
    expect(reasonProblem("  abc  ", rule)).toBe("Write at least 5 characters.");
    expect(reasonProblem("Rescheduled", rule)).toBeNull();
  });
  it("refuses more than the maximum", () => {
    expect(reasonProblem("x".repeat(501), rule)).toBe("Keep it under 500 characters.");
  });
  it("words a required note plainly", () => {
    expect(reasonProblem("", { label: "Note", min: 1, max: 500 })).toBe("This can't be empty.");
  });
});

describe("typedConfirmationMatches", () => {
  it("ignores case and spaces", () => {
    expect(typedConfirmationMatches(" delete ", "DELETE")).toBe(true);
    expect(typedConfirmationMatches("DELET", "DELETE")).toBe(false);
  });
});

describe("isActive", () => {
  it("matches a section and its records", () => {
    expect(isActive({ href: "/admin/films" }, "/admin/films")).toBe(true);
    expect(isActive({ href: "/admin/films" }, "/admin/films/abc")).toBe(true);
    expect(isActive({ href: "/admin/films" }, "/admin/filmstrip")).toBe(false);
  });
  it("keeps an area's home from lighting up on every page", () => {
    expect(isActive({ href: "/admin", exact: true }, "/admin/films")).toBe(false);
    expect(isActive({ href: "/admin", exact: true }, "/admin")).toBe(true);
  });
});
