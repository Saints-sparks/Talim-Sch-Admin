/**
 * Calendar dates render as the day the server meant, west of Greenwich too.
 *
 * The zone is set before anything formats a date; Node applies a change to
 * `process.env.TZ` at once. It is put back afterwards so other suites sharing
 * this worker keep the machine's zone.
 */
const originalTz = process.env.TZ;
process.env.TZ = "America/Los_Angeles";

import {
  calendarYear,
  formatCalendarDate,
  parseCalendarDate,
  toDateInputValue,
  todayInputValue,
} from "@/lib/dates";
import { formatCalendarDate as financeCalendarDate } from "@/components/finance/formatters";
import { formatDate as feeDate, toDateInputValue as feeInput } from "@/components/fees/formatters";
import { formatSetupDate } from "@/components/settings/academic/academicForms";
import { formatLeaveDay } from "@/components/leave/leave.presentation";
import { formatDay as parentDay } from "@/components/users/parents/atoms";
import { day as transcriptDay } from "@/components/users/students/records/transcriptFormat";

const START = "2025-09-15T00:00:00.000Z";
const END = "2026-07-24T00:00:00.000Z";

afterAll(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

describe("the test zone", () => {
  it("is west of UTC, where local formatting shows the day before", () => {
    expect(new Date(START).getTimezoneOffset()).toBeGreaterThan(0);
    expect(new Date(START).toLocaleDateString("en-GB", { day: "numeric" })).toBe("14");
  });
});

describe("formatCalendarDate", () => {
  it("renders UTC midnight as the stored day", () => {
    expect(formatCalendarDate(START)).toMatch(/^15 Sept? 2025$/);
    expect(formatCalendarDate(END)).toMatch(/^24 Jul 2026$/);
  });

  it("reads a bare YYYY-MM-DD as that day", () => {
    expect(formatCalendarDate("2025-09-15")).toMatch(/^15 Sept? 2025$/);
  });

  it("reads a Date by its UTC day", () => {
    expect(formatCalendarDate(new Date(START))).toMatch(/^15 Sept? 2025$/);
  });

  it("takes the parts and locale", () => {
    expect(
      formatCalendarDate(START, {
        locale: "en-US",
        format: { month: "short", day: "numeric", year: "numeric" },
      })
    ).toBe("Sep 15, 2025");
    expect(formatCalendarDate(START, { format: { weekday: "long" } })).toBe("Monday");
  });

  it("falls back when there is no usable date", () => {
    expect(formatCalendarDate(undefined)).toBe("—");
    expect(formatCalendarDate(null, { fallback: "Not set" })).toBe("Not set");
    expect(formatCalendarDate("", { fallback: "-" })).toBe("-");
    expect(formatCalendarDate("nope")).toBe("—");
  });
});

describe("parseCalendarDate and calendarYear", () => {
  it("gives UTC midnight of the named day", () => {
    expect(parseCalendarDate(START)?.toISOString()).toBe(START);
    expect(parseCalendarDate("2025-09-15")?.toISOString()).toBe(START);
    expect(parseCalendarDate("garbage")).toBeNull();
  });

  it("keeps New Year's Day in its own year", () => {
    expect(new Date("2026-01-01T00:00:00.000Z").getFullYear()).toBe(2025);
    expect(calendarYear("2026-01-01T00:00:00.000Z")).toBe(2026);
    expect(calendarYear(undefined)).toBeNull();
  });
});

describe("date inputs", () => {
  it("pre-fill with the stored day", () => {
    expect(toDateInputValue(START)).toBe("2025-09-15");
    expect(toDateInputValue("2025-09-15")).toBe("2025-09-15");
    expect(toDateInputValue(undefined)).toBe("");
    expect(toDateInputValue("nope")).toBe("");
  });

  it("know today as the viewer's wall-clock day", () => {
    // 03:00 UTC on the 16th is still the evening of the 15th in Los Angeles.
    expect(todayInputValue(new Date("2025-09-16T03:00:00.000Z"))).toBe("2025-09-15");
  });
});

describe("the area helpers built on it", () => {
  it("all show 15 Sep for a session that starts on 15 Sep", () => {
    expect(financeCalendarDate(START)).toMatch(/^15 Sept? 2025$/);
    expect(feeDate(START)).toMatch(/^15 Sept? 2025$/);
    expect(feeInput(START)).toBe("2025-09-15");
    expect(formatSetupDate(START)).toMatch(/^15 Sept? 2025$/);
    expect(formatLeaveDay(START)).toMatch(/^15 Sept? 2025$/);
    expect(parentDay(START)).toMatch(/^15 Sept? 2025$/);
    expect(transcriptDay(START)).toMatch(/^15 Sept? 2025$/);
  });
});
