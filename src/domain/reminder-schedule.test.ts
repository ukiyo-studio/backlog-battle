import { describe, expect, it } from "vitest";

import { calculateNextReminderAt } from "./reminder-schedule";

describe("calculateNextReminderAt", () => {
  const base = new Date("2026-07-06T12:00:00.000Z");

  it("adds 7 days for weekly", () => {
    const next = calculateNextReminderAt("weekly", base);
    expect(next.toISOString()).toBe("2026-07-13T12:00:00.000Z");
  });

  it("adds 14 days for biweekly", () => {
    const next = calculateNextReminderAt("biweekly", base);
    expect(next.toISOString()).toBe("2026-07-20T12:00:00.000Z");
  });

  it("adds 30 days for monthly", () => {
    const next = calculateNextReminderAt("monthly", base);
    expect(next.toISOString()).toBe("2026-08-05T12:00:00.000Z");
  });
});
