/** @jest-environment jsdom */
import React from "react";
import { render, waitFor } from "@testing-library/react";
import {
  useStructureUrlAction,
  type StructureAction,
} from "@/hooks/curriculum/useStructureUrlAction";
import type { Subject } from "@/app/services/subjects.service";

const subjects = [
  {
    _id: "sub-1",
    name: "Mathematics",
    code: "MTH",
    schoolId: "school-1",
    courses: [
      {
        _id: "course-1",
        title: "Algebra",
        description: "",
        courseCode: "MTH101",
        subjectId: "sub-1",
      },
    ],
  },
] as Subject[];

function Harness(props: {
  action: string | null;
  courseId?: string | null;
  subjects: Subject[];
  isLoading: boolean;
  onAction: (action: StructureAction) => void;
}) {
  useStructureUrlAction({
    action: props.action,
    courseId: props.courseId ?? null,
    subjects: props.subjects,
    isLoading: props.isLoading,
    onAction: props.onAction,
  });
  return null;
}

describe("useStructureUrlAction", () => {
  it("does nothing without an action", () => {
    const onAction = jest.fn();
    render(<Harness action={null} subjects={subjects} isLoading={false} onAction={onAction} />);
    expect(onAction).not.toHaveBeenCalled();
  });

  it("opens the subject modal before the subjects have loaded", () => {
    const onAction = jest.fn();
    render(<Harness action="add-subject" subjects={[]} isLoading onAction={onAction} />);
    expect(onAction).toHaveBeenCalledWith({ type: "add-subject" });
  });

  it("waits for the subjects before opening the course modal", async () => {
    const onAction = jest.fn();
    const { rerender } = render(
      <Harness action="add-course" subjects={[]} isLoading onAction={onAction} />,
    );
    expect(onAction).not.toHaveBeenCalled();

    rerender(<Harness action="add-course" subjects={subjects} isLoading={false} onAction={onAction} />);
    await waitFor(() =>
      expect(onAction).toHaveBeenCalledWith({ type: "add-course", subject: subjects[0] }),
    );
  });

  it("reports when there is no subject to add a course to", () => {
    const onAction = jest.fn();
    render(<Harness action="add-course" subjects={[]} isLoading={false} onAction={onAction} />);
    expect(onAction).toHaveBeenCalledWith({
      type: "unavailable",
      reason: "No subjects available. Please create a subject first.",
    });
  });

  it("finds the course named by courseId", () => {
    const onAction = jest.fn();
    render(
      <Harness
        action="edit-course"
        courseId="course-1"
        subjects={subjects}
        isLoading={false}
        onAction={onAction}
      />,
    );
    expect(onAction).toHaveBeenCalledWith({
      type: "edit-course",
      course: subjects[0].courses?.[0],
    });
  });

  it("reports an unknown course instead of opening an empty modal", () => {
    const onAction = jest.fn();
    render(
      <Harness
        action="edit-course"
        courseId="missing"
        subjects={subjects}
        isLoading={false}
        onAction={onAction}
      />,
    );
    expect(onAction).toHaveBeenCalledWith({ type: "unavailable", reason: "Course not found." });
  });

  it("fires an action once, even as the subject cache updates", () => {
    const onAction = jest.fn();
    const { rerender } = render(
      <Harness action="add-subject" subjects={subjects} isLoading={false} onAction={onAction} />,
    );
    rerender(
      <Harness action="add-subject" subjects={[...subjects]} isLoading={false} onAction={onAction} />,
    );
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
