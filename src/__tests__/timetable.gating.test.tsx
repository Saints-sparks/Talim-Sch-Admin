/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@/test-utils/render";
import { TimetableControls } from "@/components/timetable/TimetableControls";
import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import { CoursePalette } from "@/components/timetable/CoursePalette";
import {
  TimetableEntryModal,
  validateEntryForm,
} from "@/components/timetable/TimetableEntryModal";
import type { TimetableGridData } from "@/components/timetable/timetable.model";
import type { TimetableCourse } from "@/app/services/timetable.service";
import type { Class } from "@/app/services/school.service";

const courses: TimetableCourse[] = [
  {
    _id: "co1",
    title: "Algebra",
    subjectId: { _id: "s1", name: "Mathematics" },
    teacherId: { _id: "t1", userId: { firstName: "Ada", lastName: "Lovelace" } },
  },
];

const classes = [
  { _id: "c1", name: "JSS 1", schoolId: "sc1", classTeacherId: "", assignedCourses: [] },
] as Class[];

const grid: TimetableGridData = {
  Monday: [
    {
      _id: "e1",
      time: "08:00 - 09:00",
      startTime: "08:00",
      endTime: "09:00",
      course: "Algebra",
      subject: "Mathematics",
      class: "c1",
      courseId: "co1",
      subjectId: "s1",
      day: "Monday",
      teacherName: "Ada Lovelace",
    },
  ],
};

const noop = () => undefined;

function renderControls(canManage: boolean) {
  return render(
    <TimetableControls
      classes={classes}
      isLoadingClasses={false}
      selectedClassId="c1"
      onSelectClass={noop}
      termOptions={[{ id: "t1", label: "2025/2026 · First Term", isCurrent: true }]}
      selectedTermId="t1"
      onSelectTerm={noop}
      canManage={canManage}
      hasCourses
      isApplyingTemplate={false}
      onApplyTemplate={noop}
      onAddEntry={noop}
    />
  );
}

// ─── Controls ─────────────────────────────────────────────────────────────────

describe("TimetableControls gating", () => {
  it("offers the write actions to a viewer who may manage the timetable", () => {
    renderControls(true);
    expect(screen.getByRole("button", { name: /add entry/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy from template/i })).toBeInTheDocument();
  });

  it("hides both write actions from a read-only viewer", () => {
    renderControls(false);
    expect(screen.queryByRole("button", { name: /add entry/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copy from template/i })).not.toBeInTheDocument();
  });

  it("lists the real terms instead of hard-coded sessions", () => {
    renderControls(true);
    expect(screen.getByText(/2025\/2026 · First Term/)).toBeInTheDocument();
  });

  it("says so when the school has no terms yet", () => {
    render(
      <TimetableControls
        classes={classes}
        isLoadingClasses={false}
        selectedClassId="c1"
        onSelectClass={noop}
        termOptions={[]}
        selectedTermId=""
        onSelectTerm={noop}
        canManage
        hasCourses
        isApplyingTemplate={false}
        onApplyTemplate={noop}
        onAddEntry={noop}
      />
    );
    expect(screen.getByText("No terms set up yet")).toBeInTheDocument();
  });
});

// ─── Grid ─────────────────────────────────────────────────────────────────────

describe("TimetableGrid gating", () => {
  it("offers a remove button on a lesson to an editor", () => {
    render(
      <TimetableGrid
        grid={grid}
        canManage
        deletingEntryId={null}
        onDropCourse={noop}
        onRemoveEntry={noop}
      />
    );
    expect(screen.getByRole("button", { name: /remove algebra from monday/i })).toBeInTheDocument();
    expect(screen.getAllByText("Drop here").length).toBeGreaterThan(0);
  });

  it("shows a read-only grid without remove buttons or drop hints", () => {
    render(
      <TimetableGrid
        grid={grid}
        canManage={false}
        deletingEntryId={null}
        onDropCourse={noop}
        onRemoveEntry={noop}
      />
    );
    expect(screen.queryByRole("button", { name: /remove algebra/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Drop here")).not.toBeInTheDocument();
    expect(screen.getAllByText("Free").length).toBeGreaterThan(0);
  });

  it("passes the whole entry back when a lesson is removed", () => {
    const onRemoveEntry = jest.fn();
    render(
      <TimetableGrid
        grid={grid}
        canManage
        deletingEntryId={null}
        onDropCourse={noop}
        onRemoveEntry={onRemoveEntry}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /remove algebra from monday/i }));
    expect(onRemoveEntry).toHaveBeenCalledWith(expect.objectContaining({ _id: "e1" }));
  });
});

// ─── Palette ──────────────────────────────────────────────────────────────────

describe("CoursePalette gating", () => {
  it("makes cards draggable only for an editor", () => {
    const { container, rerender } = render(
      <CoursePalette
        courses={courses}
        isLoading={false}
        teacherNames={new Map()}
        canManage
        onDragStart={noop}
      />
    );
    expect(container.querySelector('[draggable="true"]')).not.toBeNull();

    rerender(
      <CoursePalette
        courses={courses}
        isLoading={false}
        teacherNames={new Map()}
        canManage={false}
        onDragStart={noop}
      />
    );
    expect(container.querySelector('[draggable="true"]')).toBeNull();
  });

  it("says when the class has no courses to schedule", () => {
    render(
      <CoursePalette
        courses={[]}
        isLoading={false}
        teacherNames={new Map()}
        canManage
        onDragStart={noop}
      />
    );
    expect(screen.getByText("No courses found for this class.")).toBeInTheDocument();
  });
});

// ─── Entry form ───────────────────────────────────────────────────────────────

describe("validateEntryForm", () => {
  it("requires every field the DTO marks as required", () => {
    const errors = validateEntryForm({ courseId: "", day: "", startTime: "", endTime: "" });
    expect(Object.keys(errors).sort()).toEqual(["courseId", "day", "endTime", "startTime"]);
  });

  it("rejects an end time that is not after the start", () => {
    expect(
      validateEntryForm({
        courseId: "co1",
        day: "Monday",
        startTime: "10:00",
        endTime: "09:00",
      }).endTime
    ).toMatch(/after the start/);
    expect(
      validateEntryForm({
        courseId: "co1",
        day: "Monday",
        startTime: "10:00",
        endTime: "10:00",
      }).endTime
    ).toMatch(/after the start/);
  });

  it("accepts a complete, ordered entry", () => {
    expect(
      validateEntryForm({
        courseId: "co1",
        day: "Monday",
        startTime: "08:00",
        endTime: "09:00",
      })
    ).toEqual({});
  });
});

describe("TimetableEntryModal", () => {
  it("does not submit an incomplete form, and shows what is missing", () => {
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
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Choose the course to schedule.")).toBeInTheDocument();
    expect(screen.getByText("Choose a day.")).toBeInTheDocument();
  });

  it("submits the DTO's fields once the form is complete", () => {
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
      />
    );
    fireEvent.change(screen.getByLabelText("Subject/Course"), { target: { value: "co1" } });
    fireEvent.change(screen.getByLabelText("Day"), { target: { value: "Monday" } });
    fireEvent.change(screen.getByLabelText("Start Time"), { target: { value: "08:00" } });
    fireEvent.change(screen.getByLabelText("End Time"), { target: { value: "09:00" } });
    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      courseId: "co1",
      day: "Monday",
      startTime: "08:00",
      endTime: "09:00",
    });
  });

  it("renders nothing while closed and restores page scrolling after it closes", () => {
    const { container, rerender } = render(
      <TimetableEntryModal
        open
        courses={courses}
        teacherNames={new Map()}
        isSaving={false}
        error={null}
        onClose={noop}
        onSubmit={noop}
      />
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <TimetableEntryModal
        open={false}
        courses={courses}
        teacherNames={new Map()}
        isSaving={false}
        error={null}
        onClose={noop}
        onSubmit={noop}
      />
    );
    expect(container).toBeEmptyDOMElement();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});
