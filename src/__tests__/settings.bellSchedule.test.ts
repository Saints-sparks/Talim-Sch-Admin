import {
  addPeriod,
  generatePeriodKey,
  isInTimeOrder,
  mapServerPeriodErrors,
  movePeriod,
  previewDay,
  removePeriod,
  sortByStart,
  timezoneOptions,
  toDrafts,
  toPeriodsPayload,
  toggleSchoolDay,
  updatePeriod,
  validateBellSchedule,
  type PeriodDraft,
} from "@/components/settings/schoolDay/bellSchedule";
import {
  isSchoolDayDirty,
  toAcademicPayload,
  toSchoolDayValues,
  validateSchoolDay,
} from "@/components/settings/schoolDay/schoolDayForm";
import type { AcademicSettings } from "@/app/services/school-settings.service";

const saved: AcademicSettings = {
  schoolId: "s1",
  timezone: "Africa/Lagos",
  schoolDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  registerCloseTime: "11:00",
  registerEditUntil: "16:00",
  registerTrackingSince: "2026-09-01",
  periods: [
    { key: "p1", label: "Period 1", startTime: "08:00", endTime: "08:40", isBreak: false },
    { key: "brk", label: "Break", startTime: "08:40", endTime: "09:00", isBreak: true },
    { key: "p2", label: "Period 2", startTime: "09:00", endTime: "09:40", isBreak: false },
  ],
};

/** Rows with predictable ids for assertions. */
function rows(): PeriodDraft[] {
  return toDrafts(saved.periods).map((r, i) => ({ ...r, id: `r${i}` }));
}

describe("validateBellSchedule", () => {
  it("accepts touching periods in time order", () => {
    expect(validateBellSchedule(rows())).toEqual({});
  });

  it("flags an end that is not after the start", () => {
    const list = updatePeriod(rows(), "r0", { endTime: "08:00" });
    expect(validateBellSchedule(list).r0?.endTime).toMatch(/after the start/);
  });

  it("flags an overlap on the later period and names the earlier one", () => {
    const list = updatePeriod(rows(), "r2", { startTime: "08:50" });
    expect(validateBellSchedule(list).r2?.startTime).toBe("Overlaps Break (ends 09:00).");
    expect(validateBellSchedule(list).r1).toBeUndefined();
  });

  it("flags a row that starts before the row above it", () => {
    const list = updatePeriod(rows(), "r2", { startTime: "07:00", endTime: "07:40" });
    const errors = validateBellSchedule(list);
    expect(errors.r2?.startTime).toMatch(/Starts before the period above/);
    expect(isInTimeOrder(list)).toBe(false);
    expect(validateBellSchedule(sortByStart(list))).toEqual({});
  });

  it("requires unique labels, ignoring case and spaces", () => {
    const list = updatePeriod(rows(), "r2", { label: " period 1 " });
    const errors = validateBellSchedule(list);
    expect(errors.r0?.label).toMatch(/already has this name/);
    expect(errors.r2?.label).toMatch(/already has this name/);
  });

  it("requires a label and readable times", () => {
    const list = updatePeriod(rows(), "r0", { label: " ", startTime: "" });
    const errors = validateBellSchedule(list);
    expect(errors.r0?.label).toBeTruthy();
    expect(errors.r0?.startTime).toBe("Set a start time.");
  });
});

describe("keys", () => {
  it("generates the first free key per kind", () => {
    expect(generatePeriodKey([], false)).toBe("p1");
    expect(generatePeriodKey([{ key: "p1" }, { key: "p3" }], false)).toBe("p2");
    expect(generatePeriodKey([], true)).toBe("brk");
    expect(generatePeriodKey([{ key: "brk" }], true)).toBe("brk2");
  });

  it("keeps every existing key through edits, moves, deletes and adds", () => {
    let list = rows();
    list = updatePeriod(list, "r0", { label: "Assembly", startTime: "07:50", isBreak: true });
    list = movePeriod(list, 2, -1);
    list = removePeriod(list, "r1");
    list = addPeriod(list, false);
    const byId = Object.fromEntries(list.map((r) => [r.id, r.key]));
    expect(byId.r0).toBe("p1");
    expect(byId.r2).toBe("p2");
    expect(list[list.length - 1].key).toBe("p3");
    expect(new Set(list.map((r) => r.key)).size).toBe(list.length);
  });

  it("sends the keys unchanged and drops local ids", () => {
    const payload = toPeriodsPayload(updatePeriod(rows(), "r0", { label: "  Period One " }));
    expect(payload[0]).toEqual({ key: "p1", label: "Period One", startTime: "08:00", endTime: "08:40", isBreak: false });
    expect(payload.every((p) => !("id" in p))).toBe(true);
  });
});

describe("addPeriod", () => {
  it("starts an empty schedule at 08:00 with a 40-minute period", () => {
    const [first] = addPeriod([], false);
    expect(first).toMatchObject({ key: "p1", label: "Period 1", startTime: "08:00", endTime: "08:40", isBreak: false });
  });

  it("appends straight after the latest end", () => {
    const list = addPeriod(rows(), true);
    expect(list[3]).toMatchObject({ key: "brk2", startTime: "09:40", endTime: "10:00", isBreak: true });
    expect(validateBellSchedule(list)).toEqual({});
  });
});

describe("movePeriod", () => {
  it("swaps the pair's slots, keeping each length and the window", () => {
    const list = movePeriod(rows(), 1, 1); // Break later, Period 2 earlier
    expect(list.map((r) => [r.key, r.startTime, r.endTime])).toEqual([
      ["p1", "08:00", "08:40"],
      ["p2", "08:40", "09:20"],
      ["brk", "09:20", "09:40"],
    ]);
    expect(validateBellSchedule(list)).toEqual({});
  });

  it("keeps the gap between the two rows", () => {
    const base = updatePeriod(rows(), "r2", { startTime: "09:10", endTime: "09:50" });
    const list = movePeriod(base, 2, -1);
    expect(list[1]).toMatchObject({ key: "p2", startTime: "08:40", endTime: "09:20" });
    expect(list[2]).toMatchObject({ key: "brk", startTime: "09:30", endTime: "09:50" });
  });

  it("does nothing off either end", () => {
    expect(movePeriod(rows(), 0, -1).map((r) => r.id)).toEqual(["r0", "r1", "r2"]);
    expect(movePeriod(rows(), 2, 1).map((r) => r.id)).toEqual(["r0", "r1", "r2"]);
  });
});

describe("previewDay", () => {
  it("lays out periods, breaks and gaps in proportion", () => {
    const list = updatePeriod(rows(), "r2", { startTime: "09:20", endTime: "10:00" });
    const segments = previewDay(list);
    expect(segments.map((s) => [s.kind, s.minutes])).toEqual([
      ["period", 40],
      ["break", 20],
      ["gap", 20],
      ["period", 40],
    ]);
    expect(segments.reduce((sum, s) => sum + s.percent, 0)).toBeCloseTo(100);
  });
});

describe("mapServerPeriodErrors", () => {
  it("points `periods.N.field` details at the row sent at N", () => {
    const errors = mapServerPeriodErrors(rows(), {
      "periods.2.startTime": "overlaps periods.1",
      "periods.1.key": "must be unique",
      timezone: "ignored",
    });
    expect(errors.r2?.startTime).toBe("Time overlaps periods.1");
    expect(errors.r1?.label).toBe("Key must be unique");
  });
});

describe("school day form", () => {
  it("is clean until something changes, and keeps weekend days", () => {
    const values = toSchoolDayValues({ ...saved, schoolDays: ["Monday", "Saturday"] });
    expect(isSchoolDayDirty(values, { ...saved, schoolDays: ["Monday", "Saturday"] })).toBe(false);
    const next = toggleSchoolDay(values.schoolDays, "Friday", true);
    expect(next).toEqual(["Monday", "Friday", "Saturday"]);
  });

  it("needs a school day and an edit window that does not end before the close", () => {
    const values = { ...toSchoolDayValues(saved), schoolDays: [], registerEditUntil: "10:00" };
    const { fields } = validateSchoolDay(values);
    expect(fields.schoolDays).toBeTruthy();
    expect(fields.registerEditUntil).toMatch(/at least the close time/);
  });

  it("sends every field with the periods replacing the list", () => {
    expect(toAcademicPayload(toSchoolDayValues(saved))).toEqual({
      timezone: "Africa/Lagos",
      schoolDays: saved.schoolDays,
      registerCloseTime: "11:00",
      registerEditUntil: "16:00",
      periods: saved.periods,
    });
  });
});

describe("timezoneOptions", () => {
  it("puts Africa/Lagos first and keeps an unlisted saved zone", () => {
    const zones = timezoneOptions("Mars/Olympus");
    expect(zones[0]).toBe("Africa/Lagos");
    expect(zones).toContain("Mars/Olympus");
    expect(new Set(zones).size).toBe(zones.length);
  });
});
