import { describe, expect, it } from "vitest";
import { addBrazilianBusinessDays, pendingPickupExpiresAt } from "./loan-dates";

describe("loan date rules", () => {
  it("adds 14 business days while skipping the national holiday on November 20", () => {
    const checkout = new Date("2026-11-19T15:30:00-03:00");
    expect(addBrazilianBusinessDays(checkout, 14).toISOString()).toBe("2026-12-10T18:30:00.000Z");
  });

  it("expires one business day after a weekday request", () => {
    const created = new Date("2026-11-16T15:30:00-03:00");
    expect(pendingPickupExpiresAt(created).toISOString()).toBe("2026-11-17T18:30:00.000Z");
  });

  it("skips weekends when a 24-hour business window reaches Saturday", () => {
    const created = new Date("2026-11-13T17:00:00-03:00");
    expect(pendingPickupExpiresAt(created).toISOString()).toBe("2026-11-16T20:00:00.000Z");
  });

  it("starts a weekend request at midnight on the next business date", () => {
    const created = new Date("2026-11-21T12:00:00-03:00");
    expect(pendingPickupExpiresAt(created).toISOString()).toBe("2026-11-24T03:00:00.000Z");
  });
});
