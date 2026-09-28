import {
  emptyCalendarForm,
  eventDayCount,
  formatEventRange,
  groupByMonth,
  isRealDay,
  termIdFor,
  toCalendarForm,
  toCreateEventPayload,
  toUpdateEventPayload,
  validateCalendarForm,
  type CalendarFormValues,
} from "@/components/settings/calendar/calendarForm";
import type { CalendarEvent } from "@/app/services/calendar-events.service";

const holiday: CalendarFormValues = {
  title: "Independence Day",
  type: "holiday",
  startDate: "2026-10-01",
  endDate: "2026-10-01",
  endsAt: "",
};

describe("validateCalendarForm", () => {
  it("accepts a one-day holiday", () => {
    expect(validateCalendarForm(holiday)).toEqual({});
  });

  it("needs a title of at most 120 characters", () => {
    expect(validateCalendarForm({ ...holiday, title: "  " }).title).toBeTruthy();
    expect(validateCalendarForm({ ...holiday, title: "x".repeat(121) }).title).toMatch(/120/);
  });

  it("needs a real first day and a last day not before it", () => {
    expect(validateCalendarForm({ ...holiday, startDate: "" }).startDate).toBeTruthy();
    expect(validateCalendarForm({ ...holiday, startDate: "2026-02-30" }).startDate).toBe("Enter a real date.");
    expect(validateCalendarForm({ ...holiday, endDate: "2026-09-30" }).endDate).toMatch(/before the first day/);
    expect(validateCalendarForm({ ...holiday, endDate: "" })).toEqual({});
  });

  it("needs ends-at only for an early close", () => {
    expect(validateCalendarForm({ ...holiday, type: "early_close" }).endsAt).toBe("Set the time school closes.");
    expect(validateCalendarForm({ ...holiday, type: "early_close", endsAt: "25:00" }).endsAt).toMatch(/24-hour/);
    expect(validateCalendarForm({ ...holiday, type: "early_close", endsAt: "12:30" })).toEqual({});
    expect(validateCalendarForm({ ...holiday, type: "event", endsAt: "nonsense" })).toEqual({});
  });
});

describe("payloads", () => {
  it("defaults the last day to the first and trims the title", () => {
    expect(toCreateEventPayload({ ...holiday, title: " Independence Day ", endDate: "" })).toEqual({
      title: "Independence Day",
      type: "holiday",
      startDate: "2026-10-01",
      endDate: "2026-10-01",
    });
  });

  it("sends ends-at only with an early close", () => {
    expect(toCreateEventPayload({ ...holiday, endsAt: "12:00" })).not.toHaveProperty("endsAt");
    expect(toCreateEventPayload({ ...holiday, type: "early_close", endsAt: "12:00" }).endsAt).toBe("12:00");
  });

  it("attaches the term when known and never sends a null term", () => {
    expect(toCreateEventPayload(holiday, "t1").termId).toBe("t1");
    expect(toUpdateEventPayload(holiday)).not.toHaveProperty("termId");
  });

  it("round-trips an event through the form", () => {
    const event: CalendarEvent = {
      id: "e1",
      termId: null,
      title: "Staff training",
      type: "early_close",
      startDate: "2026-10-09",
      endDate: "2026-10-09",
      endsAt: "12:00",
    };
    expect(toUpdateEventPayload(toCalendarForm(event))).toEqual({
      title: "Staff training",
      type: "early_close",
      startDate: "2026-10-09",
      endDate: "2026-10-09",
      endsAt: "12:00",
    });
    expect(emptyCalendarForm("2026-10-02")).toMatchObject({ startDate: "2026-10-02", endDate: "2026-10-02", type: "holiday" });
  });
});

describe("list helpers", () => {
  const ev = (id: string, startDate: string, endDate = startDate): CalendarEvent => ({
    id,
    termId: null,
    title: id,
    type: "event",
    startDate,
    endDate,
    endsAt: null,
  });

  it("groups by start month, in date order", () => {
    const groups = groupByMonth([ev("c", "2026-11-03"), ev("a", "2026-10-30", "2026-11-02"), ev("b", "2026-10-01")]);
    expect(groups.map((g) => [g.key, g.label, g.events.map((e) => e.id)])).toEqual([
      ["2026-10", "October 2026", ["b", "a"]],
      ["2026-11", "November 2026", ["c"]],
    ]);
  });

  it("formats ranges and counts days inclusively", () => {
    expect(formatEventRange("2026-10-01", "2026-10-01")).toBe("Thu 1 Oct");
    expect(formatEventRange("2026-10-05", "2026-10-07")).toBe("Mon 5 – Wed 7 Oct");
    expect(formatEventRange("2026-09-30", "2026-10-02")).toMatch(/^Wed 30 Sept? – Fri 2 Oct$/);
    expect(eventDayCount("2026-10-05", "2026-10-07")).toBe(3);
  });

  it("finds the term a day falls in", () => {
    const terms = [
      { id: "t1", name: "First", start: "2026-09-07", end: "2026-12-11", isCurrent: true },
      { id: "t2", name: "Second", start: "2027-01-11", end: "2027-04-02", isCurrent: false },
    ];
    expect(termIdFor(terms, "2026-12-11")).toBe("t1");
    expect(termIdFor(terms, "2026-12-25")).toBeUndefined();
    expect(isRealDay("2026-12-25")).toBe(true);
  });
});
