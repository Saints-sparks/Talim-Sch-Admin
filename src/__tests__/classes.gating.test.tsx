/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@/test-utils/render";
import { mockSubAdmin } from "@/test-utils/render";
import { ClassCard } from "@/components/classes/ClassCard";
import { ClassCoursesTab } from "@/components/classes/ClassCoursesTab";
import { ClassTeacherTab } from "@/components/classes/ClassTeacherTab";
import { assignTeacherMessage } from "@/components/classes/AssignTeacherPanel";
import { ApiError } from "@/lib/apiError";
import type { ClassCourse, ClassDetail } from "@/components/classes/class.model";

const classItem: ClassDetail = {
  _id: "class-1",
  name: "Grade 1A",
  gradeLevel: "Grade 1",
  classCapacity: "30",
  courses: [],
  students: [],
};

const courses: ClassCourse[] = [
  {
    _id: "course-1",
    title: "Algebra",
    courseCode: "MTH101",
    subjectId: { _id: "sub-1", name: "Mathematics", code: "MTH" },
  },
];

/** A sub-admin holding only manage:students — neither classes nor curriculum. */
const studentsOnly = { ...mockSubAdmin, permissions: ["manage:students"] };
/** A sub-admin who may manage classes but not the curriculum. */
const classesOnly = { ...mockSubAdmin, permissions: ["manage:classes"] };

const noop = () => undefined;

describe("class card gating", () => {
  it("offers Edit to a full admin", () => {
    render(<ClassCard classItem={classItem} onOpen={noop} onEdit={noop} />);
    expect(screen.getByLabelText("Edit Grade 1A")).toBeInTheDocument();
  });

  it("hides Edit from a role without manage:classes, keeping the read-only way in", () => {
    render(<ClassCard classItem={classItem} onOpen={noop} onEdit={noop} />, {
      user: studentsOnly,
    });
    expect(screen.queryByLabelText("Edit Grade 1A")).not.toBeInTheDocument();
    expect(screen.getByText("Manage Class")).toBeInTheDocument();
  });
});

describe("course actions on the class detail screen", () => {
  it("shows the course controls when the curriculum may be managed", () => {
    render(
      <ClassCoursesTab
        courses={courses}
        canManageCurriculum
        deletingCourseId={null}
        onEditCourse={noop}
        onDeleteCourse={noop}
      />,
    );
    expect(screen.getByLabelText("Delete Algebra")).toBeInTheDocument();
  });

  it("hides them when it may not — courses are a curriculum permission", () => {
    render(
      <ClassCoursesTab
        courses={courses}
        canManageCurriculum={false}
        deletingCourseId={null}
        onEditCourse={noop}
        onDeleteCourse={noop}
      />,
    );
    expect(screen.queryByLabelText("Delete Algebra")).not.toBeInTheDocument();
    expect(screen.getByText("Algebra")).toBeInTheDocument();
  });
});

describe("class teacher tab", () => {
  it("offers to assign a teacher when the class may be managed", () => {
    render(<ClassTeacherTab classData={classItem} onAssignTeacher={noop} />, {
      user: classesOnly,
    });
    expect(screen.getByText("Assign Teacher")).toBeInTheDocument();
  });

  it("does not offer it to a role that cannot manage classes", () => {
    render(<ClassTeacherTab classData={classItem} onAssignTeacher={noop} />, {
      user: studentsOnly,
    });
    expect(screen.queryByText("Assign Teacher")).not.toBeInTheDocument();
    expect(screen.getByText("No teacher assigned")).toBeInTheDocument();
  });

  it("renders a populated teacher instead of the empty state", () => {
    const withTeacher: ClassDetail = {
      ...classItem,
      classTeacherId: {
        _id: "teacher-1",
        userId: { firstName: "Ada", lastName: "Lovelace", email: "ada@talim.test" },
        isFormTeacher: true,
      },
    };
    render(<ClassTeacherTab classData={withTeacher} onAssignTeacher={noop} />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Form Teacher")).toBeInTheDocument();
  });
});

describe("assignTeacherMessage", () => {
  it("explains a NOT_FOUND as a teacher outside this school", () => {
    expect(assignTeacherMessage(new ApiError("NOT_FOUND", "Teacher not found", 404))).toBe(
      "That teacher is not in this school, or the class no longer exists.",
    );
  });

  it("names the permission problem on FORBIDDEN", () => {
    expect(assignTeacherMessage(new ApiError("FORBIDDEN", "Forbidden", 403))).toBe(
      "You don't have permission to assign teachers to this class.",
    );
  });

  it("passes the server's message through on CONFLICT", () => {
    expect(
      assignTeacherMessage(new ApiError("CONFLICT", "Already a form teacher elsewhere", 409)),
    ).toBe("Already a form teacher elsewhere");
  });

  it("falls back for anything unrecognised", () => {
    expect(assignTeacherMessage(new Error("boom"))).toBe("boom");
    expect(assignTeacherMessage(null)).toBe("Failed to assign teacher.");
  });
});
