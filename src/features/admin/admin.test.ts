import { describe, expect, it } from "vitest";

import { toCsv } from "@/lib/csv";
import { fromLagosInputs, lagosInputs } from "@/lib/format";
import { browserSummary } from "@/lib/user-agent";

import { posterProblem } from "./films/schemas";
import { presetRange, rangeProblem, salesCsv } from "./money/sales";

describe("sales ranges", () => {
  // Wednesday 4 November 2026, noon in Lagos
  const now = Date.parse("2026-11-04T11:00:00.000Z");

  it("counts presets back in Lagos days", () => {
    expect(presetRange("today", now)).toEqual({ from: "2026-11-04", to: "2026-11-04" });
    expect(presetRange("7d", now)).toEqual({ from: "2026-10-29", to: "2026-11-04" });
    expect(presetRange("month", now)).toEqual({ from: "2026-11-01", to: "2026-11-04" });
    expect(presetRange("last-month", now)).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(presetRange("last-month", Date.parse("2026-01-10T11:00:00Z"))).toEqual({
      from: "2025-12-01",
      to: "2025-12-31",
    });
  });

  it("refuses backwards and over-long ranges", () => {
    expect(rangeProblem("2026-11-04", "2026-11-01")).toMatch(/before/);
    expect(rangeProblem("2025-01-01", "2026-11-04")).toMatch(/366/);
    expect(rangeProblem("2026-01-01", "2026-12-31")).toBeNull();
  });
});

describe("the sales CSV", () => {
  it("quotes what needs quoting and ends with the total", () => {
    const csv = salesCsv({
      from: "2026-11-01",
      to: "2026-11-04",
      currency: "NGN",
      refunds: { count: 0, amount: 0 },
      totals: {
        payments: 2,
        gross: 10356.5,
        gatewayFees: 255.34,
        vat: 0,
        producerShare: 8500,
        platformShare: 1601.16,
        ticketsByTier: { INDIVIDUAL: 2, PUBLIC: 0, PRIVATE_5: 0, PRIVATE_10: 0 },
      },
      movies: [],
    });
    const lines = csv.replace("﻿", "").split("\r\n");
    expect(lines[0]).toMatch(/^Film,Showtime \(WAT\),Payments/);
    expect(lines.at(-1)).toBe(
      '"Total, 2026-11-01 to 2026-11-04",,2,2,0,0,0,10356.50,255.34,0.00,8500.00,1601.16',
    );
    expect(toCsv(["a"], [['say "hi"']])).toContain('"say ""hi"""');
  });
});

describe("console helpers", () => {
  it("checks a poster before it is sent", () => {
    expect(posterProblem({ type: "image/gif", size: 10 })).toMatch(/JPEG/);
    expect(posterProblem({ type: "image/webp", size: 6 * 1024 * 1024 })).toMatch(/5 MB/);
    expect(posterProblem({ type: "image/jpeg", size: 1024 })).toBeNull();
  });

  it("turns Lagos input times into the API's moment and back", () => {
    const iso = fromLagosInputs("2026-11-07", "19:00");
    expect(iso).toBe("2026-11-07T18:00:00.000Z");
    expect(lagosInputs(iso)).toEqual({ date: "2026-11-07", time: "19:00" });
  });

  it("summarises a browser in a few words", () => {
    expect(
      browserSummary(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("Safari on iPhone");
    expect(browserSummary(null)).toBe("Unknown browser");
  });
});
