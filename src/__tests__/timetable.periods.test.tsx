/** @jest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@/test-utils/render";
import {
  EMPTY_ENTRY_FORM,
  choosePeriod,
  editTime,
  lessonPeriods,
  toEntrySubmit,
  validateEntryForm,
} from "@/components/timetable/entryForm";
import { TimetableEntryModal } from "@/components/timetable/TimetableEntryModal";
import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import {
  TIME_SLOTS,
  buildGridRows,
  templateSlots,
  toGridData,
  type TimetableGridData,
} from "@/components/timetable/timetable.model";
import type { SchoolPeriod } from "@/app/services/school-settings.service";
import type { TimetableCourse } from "@/app/services/timetable.service";

const periods: SchoolPeriod[] = [
  { key: "p1", label: "Period 1", startTime: "08:00", endTime: "08:40", isBreak: false },
  { key: "brk", label: "Break", startTime: "08:40", endTime: "09:00", isBreak: true },
  { key: "p2", label: "Period 2", startTime: "09:00", endTime: "09:40", isBreak: false },
];

const courses: TimetableCourse[] = [
  { _id: "co1", title: "Algebra", subjectId: { _id: "s1", name: "Mathematics" } },
];

const noop = () => undefined;

describe("period → time fill", () => {
  it("offers lesson periods only", () => {
    expect(lessonPeriods(periods).map((p) => p.key)).toEqual(["p1", "p2"]);
    expect(lessonPeriods(undefined)).toEqual([]);
  });

  it("fills the times and keeps the key when a period is picked", () => {
    const values = choosePeriod(EMPTY_ENTRY_FORM, "p2", periods);
    expect(values).toMatchObject({ periodKey: "p2", startTime: "09:00", endTime: "09:40" });
  });

  it("refuses a break or unknown key and keeps typed times for a custom slot", () => {
    const typed = { ...EMPTY_ENTRY_FORM, startTime: "10:00", endTime: "10:30" };
    expect(choosePeriod(typed, "brk", periods)).toMatchObject({ periodKey: "", startTime: "10:00" });
    expect(choosePeriod(typed, "", periods)).toMatchObject({ periodKey: "", endTime: "10:30" });
  });

  it("turns into a custom slot once a time is edited", () => {
    const picked = choosePeriod(EMPTY_ENTRY_FORM, "p1", periods);
    const edited = editTime(picked, "endTime", "08:50", periods);
    expect(edited).toMatchObject({ periodKey: "", startTime: "08:00", endTime: "08:50" });
    // Setting the same value keeps the period.
    expect(editTime(picked, "startTime", "08:00", periods).periodKey).toBe("p1");
  });

  it("sends the key only while it matches, and the room trimmed when given", () => {
    const base = { ...choosePeriod(EMPTY_ENTRY_FORM, "p1", periods), courseId: "co1", day: "Monday" };
    expect(toEntrySubmit({ ...base, room: "  Lab 2 " })).toEqual({
      courseId: "co1",
      day: "Monday",
      startTime: "08:00",
      endTime: "08:40",
      room: "Lab 2",
      periodKey: "p1",
    });
    expect(toEntrySubmit({ ...base, room: " ", periodKey: "" })).toEqual({
      courseId: "co1",
      day: "Monday",
      startTime: "08:00",
      endTime: "08:40",
    });
  });

  it("limits the room to 60 characters", () => {
    const base = { ...EMPTY_ENTRY_FORM, courseId: "co1", day: "Monday", startTime: "08:00", endTime: "08:40" };
    expect(validateEntryForm({ ...base, room: "x".repeat(61) }).room).toMatch(/60/);
    expect(validateEntryForm({ ...base, room: "Lab 2" })).toEqual({});
  });
});

describe("TimetableEntryModal with a bell schedule", () => {
  it("fills the times from the chosen period and submits its key and room", () => {
    const onSubmit = jest.fn();
    render(
      <TimetableEntryModal
        open
        courses={courses}
        teacherNames={new Map()}
        isSaving={false}
        error={null}
        onClose={noop}
        onSubmit={onSubmit}
        periods={periods}
      />
    );
    const period = screen.getByLabelText("Period");
    expect(Array.from((period as HTMLSelectElement).options).map((o) => o.value)).toEqual(["", "p1", "p2"]);

    fireEvent.change(screen.getByLabelText("Subject/Course"), { target: { value: "co1" } });
    fireEvent.change(screen.getByLabelText("Day"), { target: { value: "Tuesday" } });
    fireEvent.change(period, { target: { value: "p2" } });
    expect(screen.getByLabelText("Start Time")).toHaveValue("09:00");
    expect(screen.getByLabelText("End Time")).toHaveValue("09:40");
    fireEvent.change(screen.getByLabelText(/^Room/), { target: { value: "Lab 2" } });
    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      courseId: "co1",
      day: "Tuesday",
      startTime: "09:00",
      endTime: "09:40",
      room: "Lab 2",
      periodKey: "p2",
    });
  });

  it("drops back to a custom time when a time is edited", () => {
    render(
      <TimetableEntryModal
        open
        courses={courses}
        teacherNames={new Map()}
        isSaving={false}
        error={null}
        onClose={noop}
        onSubmit={noop}
        periods={periods}
      />
    );
    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "p1" } });
    fireEvent.change(screen.getByLabelText("End Time"), { target: { value: "09:10" } });
    expect(screen.getByLabelText("Period")).toHaveValue("");
  });

  it("without a bell schedule keeps free times and links to the editor", () => {
    render(
      <TimetableEntryModal
        open
        courses={courses}
        teacherNames={new Map()}
        isSaving={false}
        error={null}
        onClose={noop}
        onSubmit={noop}
        periods={[]}
        bellScheduleHref="/settings?section=school-day"
      />
    );
    expect(screen.queryByLabelText("Period")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /set up the bell schedule/i })).toHaveAttribute(
      "href",
      "/settings?section=school-day"
    );
  });
});

describe("grid rows", () => {
  const grid: TimetableGridData = toGridData(
    {
      Monday: [
        {
          _id: "e1",
          time: "09:00 - 09:40",
          startTime: "09:00",
          endTime: "09:40",
          courseId: "co1",
          course: "Algebra",
          teacherName: "Ada Lovelace",
          room: "Lab 2",
        },
        { _id: "e2", time: "13:15 - 13:55", startTime: "13:15", endTime: "13:55", courseId: "co1", course: "Algebra" },
      ],
    },
    courses,
    new Map(),
    "c1"
  );

  it("uses the periods as rows and adds a row for a lesson at other times", () => {
    const rows = buildGridRows(periods, grid);
    expect(rows.map((r) => [r.title ?? "", r.label, Boolean(r.isBreak), Boolean(r.isCustom)])).toEqual([
      ["Period 1", "8:00 - 8:40", false, false],
      ["Break", "8:40 - 9:00", true, false],
      ["Period 2", "9:00 - 9:40", false, false],
      ["", "13:15 - 13:55", false, true],
    ]);
  });

  it("keeps the hourly rows without a bell schedule", () => {
    const rows = buildGridRows([], {});
    expect(rows).toEqual(TIME_SLOTS);
    expect(templateSlots(periods).map((r) => r.periodKey)).toEqual(["p1", "p2"]);
  });

  it("shows the room on the lesson and takes no drop on a break", () => {
    const onDropCourse = jest.fn();
    render(
      <TimetableGrid
        grid={grid}
        canManage
        deletingEntryId={null}
        onDropCourse={onDropCourse}
        onRemoveEntry={noop}
        rows={buildGridRows(periods, grid)}
      />
    );
    expect(screen.getByText("Lab 2")).toBeInTheDocument();
    const breakCell = screen.getAllByText("Break").find((el) => el.closest("td[data-break]"));
    expect(breakCell).toBeDefined();
    fireEvent.drop(breakCell!.closest("td")!);
    expect(onDropCourse).not.toHaveBeenCalled();
  });
});
