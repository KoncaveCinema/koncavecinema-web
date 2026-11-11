import { describe, expect, it } from "vitest";

import { formatLagosDate, formatLagosDateTime, formatMoney } from "./format";

describe("console formats", () => {
  // 19:00 in Lagos (UTC+1)
  const iso = "2026-11-06T18:00:00.000Z";

  it("names Lagos time, whatever the viewer's zone", () => {
    expect(formatLagosDateTime(iso)).toBe("Fri 6 Nov, 7:00 pm WAT");
    expect(formatLagosDateTime(iso, { year: true })).toBe("Fri 6 Nov 2026, 7:00 pm WAT");
  });
  it("uses the Lagos calendar day near midnight", () => {
    // 23:30 UTC on the 6th is 00:30 on the 7th in Lagos
    expect(formatLagosDate("2026-11-06T23:30:00.000Z")).toBe("7 Nov 2026");
  });
  it("keeps kobo only where there is some", () => {
    expect(formatMoney(5000)).toBe("₦5,000");
    expect(formatMoney("1234.5")).toBe("₦1,234.50");
    // The processing fee adds kobo: shown as Paystack charges it
    expect(formatMoney(5177.67)).toBe("₦5,177.67");
  });
});
