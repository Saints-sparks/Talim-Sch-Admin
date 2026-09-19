/** @jest-environment jsdom */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test-utils/render";
import { toast } from "@/components/CustomToast";
import { ApiError } from "@/lib/apiError";
import CourseModal from "@/components/CourseModal";
import {
  classSearchOptions,
  courseTeacherId,
  idOf,
  initialCourseForm,
  missingCourseFields,
  teacherName,
  teacherSearchOptions,
  toCreatePayload,
  toUpdatePayload,
  type CourseForModal,
} from "@/components/curriculum/course/courseForm";

const createMutate = jest.fn();
const updateMutate = jest.fn();

jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/hooks/queries/reference", () => ({
  useClasses: () => ({
    data: [
      { _id: "c1", name: "JSS1", gradeLevel: "7" },
      { _id: "c2", name: "JSS2" },
    ],
    isLoading: false,
  }),
}));
jest.mock("@/hooks/curriculum/queries", () => ({
  useTeacherOptions: () => ({
    data: [{ _id: "t1", userId: { _id: "u1" }, firstName: "Ada", lastName: "Okafor", email: "ada@school.edu" }],
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  }),
  useCourseMutations: () => ({
    create: { mutateAsync: createMutate, isPending: false },
    update: { mutateAsync: updateMutate, isPending: false },
  }),
}));

const course: CourseForModal = {
  _id: "k1",
  title: "Algebra",
  description: "Intro",
  courseCode: "MTH101",
  teacherId: { _id: "t1", userId: { _id: "u1" } },
  subjectId: { _id: "s1", name: "Maths" },
  classId: { _id: "c1" },
};

describe("course form logic", () => {
  it("reads ids populated or plain", () => {
    expect(idOf(undefined)).toBe("");
    expect(idOf("a")).toBe("a");
    expect(idOf({ _id: "b" })).toBe("b");
    expect(idOf({})).toBe("");
  });

  it("addresses a course's teacher by user id, falling back to their own id", () => {
    expect(courseTeacherId(undefined)).toBe("");
    expect(courseTeacherId("u9")).toBe("u9");
    expect(courseTeacherId({ _id: "t1", userId: "u1" })).toBe("u1");
    expect(courseTeacherId({ _id: "t1", userId: { _id: "u2" } })).toBe("u2");
    expect(courseTeacherId({ _id: "t1" })).toBe("t1");
  });

  it("names a teacher, falling back to their email", () => {
    expect(teacherName({ firstName: "Ada", lastName: "O" } as never)).toBe("Ada O");
    expect(teacherName({ email: "x@y.z" } as never)).toBe("x@y.z");
    expect(teacherName({} as never)).toBe("Unnamed teacher");
  });

  it("opens edit with the course's values and add with the page's subject and class", () => {
    expect(initialCourseForm("edit", course, "sX", "cX")).toEqual({
      title: "Algebra",
      description: "Intro",
      courseCode: "MTH101",
      teacherId: "u1",
      classId: "c1",
      subjectId: "s1",
    });
    expect(initialCourseForm("add", null, "s1", "c2")).toEqual({
      title: "",
      description: "",
      courseCode: "",
      teacherId: "",
      classId: "c2",
      subjectId: "s1",
    });
  });

  it("lists the empty required fields in form order", () => {
    expect(missingCourseFields(initialCourseForm("add", null))).toEqual([
      "Course Title",
      "Course Code",
      "Description",
      "Assigned Teacher",
      "Class",
      "Subject",
    ]);
    expect(missingCourseFields({ ...initialCourseForm("edit", course), title: "  " })).toEqual(["Course Title"]);
  });

  it("trims text in the payloads and leaves the subject out of an update", () => {
    const form = { ...initialCourseForm("edit", course), title: " Algebra ", courseCode: " MTH101 " };
    expect(toCreatePayload(form)).toEqual({
      title: "Algebra",
      description: "Intro",
      courseCode: "MTH101",
      subjectId: "s1",
      teacherId: "u1",
      classId: "c1",
    });
    expect(toUpdatePayload(form)).not.toHaveProperty("subjectId");
  });

  it("builds picker rows", () => {
    expect(classSearchOptions([{ _id: "c1", name: "JSS1", gradeLevel: "7" }, { _id: "c2", name: "JSS2" }])).toEqual([
      { id: "c1", label: "JSS1", hint: "Grade level: 7" },
      { id: "c2", label: "JSS2", hint: "" },
    ]);
    expect(teacherSearchOptions([{ _id: "t1", userId: { _id: "u1" }, firstName: "Ada", email: "a@b.c" } as never])).toEqual([
      { id: "u1", label: "Ada", hint: "a@b.c" },
    ]);
  });
});

describe("CourseModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createMutate.mockResolvedValue({});
    updateMutate.mockResolvedValue({});
    document.body.style.overflow = "";
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <CourseModal isOpen={false} onClose={jest.fn()} onSuccess={jest.fn()} mode="add" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("locks body scroll while open and restores it on close", () => {
    const { rerender } = render(<CourseModal isOpen onClose={jest.fn()} onSuccess={jest.fn()} mode="add" />);
    expect(document.body.style.overflow).toBe("hidden");
    rerender(<CourseModal isOpen={false} onClose={jest.fn()} onSuccess={jest.fn()} mode="add" />);
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps Create disabled until the form is complete", () => {
    render(<CourseModal isOpen onClose={jest.fn()} onSuccess={jest.fn()} mode="add" subjectId="s1" />);
    expect(screen.getByRole("button", { name: "Create Course" })).toBeDisabled();
  });

  it("updates an existing course with the class fixed", async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    render(<CourseModal isOpen onClose={onClose} onSuccess={onSuccess} mode="edit" course={course} />);

    expect(screen.getByLabelText("Class *")).toBeDisabled();
    expect(screen.getByLabelText("Class *")).toHaveValue("JSS1");
    const title = screen.getByLabelText("Course Title *");
    await user.clear(title);
    await user.type(title, "Algebra II");
    await user.click(screen.getByRole("button", { name: "Update Course" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(updateMutate).toHaveBeenCalledWith({
      courseId: "k1",
      payload: {
        title: "Algebra II",
        description: "Intro",
        courseCode: "MTH101",
        teacherId: "u1",
        classId: "c1",
      },
    });
    expect(toast.success).toHaveBeenCalledWith("Course updated successfully!");
    expect(onClose).toHaveBeenCalled();
  });

  it("shows the server's field errors when validation fails", async () => {
    const user = userEvent.setup();
    updateMutate.mockRejectedValue(
      new ApiError("VALIDATION_FAILED", "Some fields need attention.", 422, [
        { field: "courseCode", reason: "Course code already exists" },
      ]),
    );
    render(<CourseModal isOpen onClose={jest.fn()} onSuccess={jest.fn()} mode="edit" course={course} />);
    await user.click(screen.getByRole("button", { name: "Update Course" }));
    expect(await screen.findByText("Course code already exists")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalled();
  });
});
