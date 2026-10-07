/** @jest-environment jsdom */
/**
 * The classes and curriculum screens in the tl design system (v1.5 §4):
 * loading, empty, error and loaded states render in the new look, keep the
 * words and ids the browser suite reads, and pulse only while loading.
 */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@/test-utils/render";
import ClassesPage from "@/app/classes/page";
import CurriculumDashboard from "@/app/curriculum/page";
import CurriculumStructurePage from "@/app/curriculum/structure/page";
import { ClassFormModal } from "@/components/classes/ClassFormModal";

jest.mock("next/navigation", () => ({
  usePathname: () => "/classes",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));
jest.mock("@/components/CustomToast", () => ({
  toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() },
}));

/** A query result in a given state. */
interface QueryState {
  data?: unknown;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
}

/**
 * Builds the slice of a react-query result the screens read.
 *
 * @param state - The state to describe.
 * @returns The fake query.
 */
function query(state: QueryState) {
  return {
    data: state.data,
    isLoading: state.isLoading ?? false,
    isFetching: state.isLoading ?? false,
    isError: state.isError ?? false,
    error: state.error ?? null,
    refetch: jest.fn(),
  };
}

let classesState: QueryState = { data: [] };
let subjectsState: QueryState = { data: [] };
const createClass = jest.fn();

jest.mock("@/hooks/queries/reference", () => ({
  useClasses: () => query(classesState),
  useSubjects: () => query(subjectsState),
}));
jest.mock("@/hooks/classes/queries", () => ({
  useClassMutations: () => ({ create: { mutateAsync: createClass, isPending: false } }),
}));
jest.mock("@/hooks/curriculum/queries", () => ({
  useCurriculumContents: () => query({ data: [] }),
  useCurriculumKpis: () => query({ data: undefined }),
  useTeacherOptions: () => query({ data: [] }),
  useSubjectMutations: () => ({
    create: { mutateAsync: jest.fn(), isPending: false },
    update: { mutateAsync: jest.fn(), isPending: false },
    remove: { mutateAsync: jest.fn(), isPending: false },
  }),
  useCourseMutations: () => ({
    create: { mutateAsync: jest.fn(), isPending: false },
    update: { mutateAsync: jest.fn(), isPending: false },
    remove: { mutateAsync: jest.fn(), isPending: false },
  }),
}));

const grade5A = {
  _id: "c5a",
  name: "Grade 5A",
  gradeLevel: "Grade 5",
  classCapacity: "30",
  studentCount: 2,
  courses: [{ _id: "k1" }, { _id: "k2" }],
  students: [],
  schoolId: "school-1",
  classTeacherId: "",
  assignedCourses: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  classesState = { data: [] };
  subjectsState = { data: [] };
  document.body.style.overflow = "";
});

// ─── Classes ──────────────────────────────────────────────────────────────────

describe("classes page", () => {
  it("shows a pulsing skeleton, announced as busy, while the classes load", () => {
    classesState = { isLoading: true };
    const { container } = render(<ClassesPage />);
    expect(screen.getByRole("status", { name: "Loading classes" })).toHaveAttribute(
      "aria-busy",
      "true"
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: "Class Management" })).not.toBeInTheDocument();
  });

  it("says there are no classes yet and offers to create the first one", () => {
    render(<ClassesPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Class Management" })).toBeInTheDocument();
    expect(screen.getByText("No Classes Found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Your First Class/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Class/i })).toBeInTheDocument();
    expect(document.querySelector(".animate-pulse")).toBeNull();
  });

  it("reports a failed load with a retry", () => {
    classesState = { isError: true, error: new Error("Server fell over") };
    render(<ClassesPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Error Loading Classes");
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("lists each class as a card with its counts", () => {
    classesState = { data: [grade5A] };
    render(<ClassesPage />);
    const card = screen.getByRole("heading", { name: "Grade 5A" }).closest("article");
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText("2/30")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText(/2 courses/)).toBeInTheDocument();
    expect(
      within(card as HTMLElement).getByRole("button", { name: "Manage Class" })
    ).toBeInTheDocument();
    expect(document.querySelector(".animate-pulse")).toBeNull();
  });

  it("opens the create sheet named 'Create new class' with the suite's field ids", () => {
    render(<ClassesPage />);
    fireEvent.click(screen.getByRole("button", { name: /Add Class/i }));
    const dialog = screen.getByRole("dialog", { name: /Create new class/i });
    for (const id of ["class-name", "class-grade", "class-capacity", "class-description"]) {
      expect(dialog.querySelector(`#${id}`)).not.toBeNull();
    }
    expect(within(dialog).getByRole("button", { name: "Create Class" })).toBeInTheDocument();
  });
});

describe("create class sheet", () => {
  it("sends exactly the DTO's four fields", async () => {
    createClass.mockResolvedValue({});
    const onClose = jest.fn();
    render(<ClassFormModal isOpen onClose={onClose} />);
    fireEvent.change(screen.getByLabelText("Class Name *"), { target: { value: " Grade 7C " } });
    fireEvent.change(screen.getByLabelText("Grade Level *"), { target: { value: "Grade 7" } });
    fireEvent.change(screen.getByLabelText("Class Capacity *"), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Class" }));

    await waitFor(() => expect(createClass).toHaveBeenCalledTimes(1));
    expect(Object.keys(createClass.mock.calls[0][0]).sort()).toEqual([
      "classCapacity",
      "classDescription",
      "gradeLevel",
      "name",
    ]);
    expect(createClass.mock.calls[0][0]).toMatchObject({ name: "Grade 7C" });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("ties each validation message to its field", () => {
    render(<ClassFormModal isOpen onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Create Class" }));
    const name = screen.getByLabelText("Class Name *");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById(name.getAttribute("aria-describedby") ?? "")).toHaveTextContent(
      "Class name is required"
    );
    expect(createClass).not.toHaveBeenCalled();
  });
});

// ─── Curriculum ───────────────────────────────────────────────────────────────

describe("curriculum dashboard", () => {
  it("shows the page-shaped skeleton while the subjects load", () => {
    subjectsState = { isLoading: true };
    const { container } = render(<CurriculumDashboard />);
    expect(screen.getByRole("status", { name: "Loading curriculum" })).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("shows the stat tiles, quick actions and the empty recent content", () => {
    render(<CurriculumDashboard />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Curriculum Management" })
    ).toBeInTheDocument();
    expect(screen.getByText("Total Subjects")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: /Add Subject/ })).toBeInTheDocument();
    expect(screen.getByText("No curriculum content yet")).toBeInTheDocument();
    expect(document.querySelector(".animate-pulse")).toBeNull();
  });

  it("offers the first subject on an empty Structure tab", () => {
    render(<CurriculumDashboard />);
    fireEvent.click(screen.getByRole("tab", { name: "Structure" }));
    expect(screen.getByText("No subjects created yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Your First Subject/ })).toBeInTheDocument();
  });
});

describe("curriculum structure", () => {
  it("shows a skeleton while loading, then the empty state", () => {
    subjectsState = { isLoading: true };
    const { unmount } = render(<CurriculumStructurePage />);
    expect(
      screen.getByRole("status", { name: "Loading curriculum structure" })
    ).toBeInTheDocument();
    unmount();

    subjectsState = { data: [] };
    render(<CurriculumStructurePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Curriculum Structure" })
    ).toBeInTheDocument();
    expect(screen.getByText("No subjects yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add First Subject/ })).toBeInTheDocument();
  });

  it("lists a subject as a collapsible card", () => {
    subjectsState = {
      data: [
        {
          _id: "s1",
          name: "Mathematics",
          code: "MTH",
          schoolId: "school-1",
          courses: [
            {
              _id: "k1",
              title: "Mathematics 5A",
              description: "",
              courseCode: "MTH-5A",
              subjectId: "s1",
            },
          ],
        },
      ],
    };
    render(<CurriculumStructurePage />);
    const toggle = screen.getByRole("button", { name: "Expand Mathematics" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Collapse Mathematics" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByText("Mathematics 5A")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Mathematics 5A" })).toBeInTheDocument();
  });
});
