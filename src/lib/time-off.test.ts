import { describe, expect, it } from "vitest";
import type { Holiday } from "@/types";
import { countLeaveDays, daysOffFrom, eachDateKey, rangesOverlap } from "./time-off";

const MON_FRI = [1, 2, 3, 4, 5];
const holiday = (date: string, kind: Holiday["kind"] = "public"): Holiday => ({ id: date, organizationId: "org", calendarId: null, name: "H", date, kind });

describe("eachDateKey", () => {
  it("is inclusive and crosses month boundaries", () => {
    expect(eachDateKey("2026-09-29", "2026-10-02")).toEqual(["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"]);
  });

  it("is empty when the range is reversed", () => {
    expect(eachDateKey("2026-10-02", "2026-10-01")).toEqual([]);
  });
});

describe("countLeaveDays", () => {
  it("skips weekends", () => {
    // Fri 2 Oct 2026 → Mon 5 Oct 2026
    expect(countLeaveDays({ start: "2026-10-02", end: "2026-10-05", halfDay: false, workingDays: MON_FRI, daysOff: new Set() })).toBe(2);
  });

  it("skips public and company holidays but not optional ones", () => {
    const daysOff = daysOffFrom([holiday("2026-10-05"), holiday("2026-10-06", "company"), holiday("2026-10-07", "optional")]);
    expect(countLeaveDays({ start: "2026-10-05", end: "2026-10-09", halfDay: false, workingDays: MON_FRI, daysOff })).toBe(3);
  });

  it("counts a half day as 0.5, and 0 when the day is not worked", () => {
    expect(countLeaveDays({ start: "2026-10-01", end: "2026-10-01", halfDay: true, workingDays: MON_FRI, daysOff: new Set() })).toBe(0.5);
    expect(countLeaveDays({ start: "2026-10-03", end: "2026-10-03", halfDay: true, workingDays: MON_FRI, daysOff: new Set() })).toBe(0);
  });

  it("respects custom working weeks", () => {
    expect(countLeaveDays({ start: "2026-10-03", end: "2026-10-04", halfDay: false, workingDays: [1, 2, 3, 4, 5, 6], daysOff: new Set() })).toBe(1);
  });
});

describe("rangesOverlap", () => {
  it("treats a shared end date as overlapping", () => {
    expect(rangesOverlap({ startDate: "2026-10-01", endDate: "2026-10-03" }, { startDate: "2026-10-03", endDate: "2026-10-05" })).toBe(true);
    expect(rangesOverlap({ startDate: "2026-10-01", endDate: "2026-10-02" }, { startDate: "2026-10-03", endDate: "2026-10-05" })).toBe(false);
  });
});
