/** @jest-environment jsdom */
/**
 * Class teachers after A6: only `Class.classTeacherId` grants class-teacher
 * (register) access. A teacher assigned to a class without being its class
 * teacher gets a clear hint, on the profile and in the editor, and setting a
 * class teacher from the editor writes `Class.classTeacherId` through
 * `PUT /classes/:id/assign-teacher`.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within, mockAdmin, mockSubAdmin } from "@/test-utils/render";
import {
  REGISTER_RULE,
  classTeacherClassIds,
  classTeacherDisplayName,
  classTeacherHint,
  classTeacherRef,
} from "@/components/users/teachers/classTeacher";
import { TeacherAssignmentsTab } from "@/components/users/teachers/TeacherAssignmentsTab";
import { TeacherEditAssignmentsTab } from "@/components/users/teachers/TeacherEditTabs";
import type { TeacherById } from "@/app/services/teacher.service";
import type { TeacherDraft } from "@/hooks/users/useTeacherEditor";
import type { RosterClass } from "@/hooks/users/useRosterClasses";
import { api } from "@/lib/apiClient";
import { toast } from "@/components/CustomToast";

jest.mock("@/components/CustomToast", () => ({
  toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
}));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/lib/apiClient", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockPut = api.put as jest.Mock;

const TEACHER_PROFILE = "tp-1";
const OTHER_PROFILE = "tp-2";

/** The school's classes as `GET /classes` returns them. */
const classes = [
  {
    _id: "c1",
    name: "JSS 1A",
    classTeacherId: { _id: TEACHER_PROFILE, userId: { firstName: "Ada", lastName: "Okafor" } },
  },
  {
    _id: "c2",
    name: "JSS 2B",
    classTeacherId: { _id: OTHER_PROFILE, userId: { firstName: "Bayo", lastName: "Ade" } },
  },
  { _id: "c3", name: "JSS 3C", classTeacherId: null },
] as unknown as RosterClass[];

const classRow = (id: string, name: string) => ({
  _id: id,
  name,
  classCapacity: 30,
  classDescription: "",
  assignedCourses: [],
});

const teacher = {
  _id: TEACHER_PROFILE,
  userId: { _id: "u-ada", firstName: "Ada", lastName: "Okafor" },
  // The API merges these lists; neither says who the class teacher is.
  assignedClasses: [classRow("c1", "JSS 1A"), classRow("c2", "JSS 2B")],
  classTeacherClasses: [classRow("c1", "JSS 1A"), classRow("c2", "JSS 2B")],
  assignedCourses: [],
  isFormTeacher: true,
} as unknown as TeacherById;

describe("class-teacher rules", () => {
  it("reads the class teacher from Class.classTeacherId, bare or populated", () => {
    expect(classTeacherRef({ classTeacherId: "tp-9" })).toBe("tp-9");
    expect(classTeacherRef({ classTeacherId: { _id: "tp-8" } })).toBe("tp-8");
    expect(classTeacherRef({ classTeacherId: null })).toBe("");
    expect([...classTeacherClassIds(classes, TEACHER_PROFILE)]).toEqual(["c1"]);
    expect(classTeacherClassIds(classes, undefined).size).toBe(0);
    expect(classTeacherDisplayName(classes[1])).toBe("Bayo Ade");
    expect(classTeacherDisplayName(classes[2])).toBe("");
  });

  it("words the hint for one class, several, or none", () => {
    const mine = new Set(["c1"]);
    expect(classTeacherHint([{ id: "c1", name: "JSS 1A" }], mine).text).toBeNull();
    expect(classTeacherHint([{ id: "c2", name: "JSS 2B" }], mine).text).toBe(
      `Assigned to JSS 2B, but not its class teacher. ${REGISTER_RULE}`
    );
    const several = classTeacherHint(
      [
        { id: "c2", name: "JSS 2B" },
        { id: "c3", name: "JSS 3C" },
        { id: "c4", name: "SS 1" },
        { id: "c2", name: "JSS 2B" },
      ],
      mine
    );
    expect(several.notClassTeacherOf).toEqual(["JSS 2B", "JSS 3C", "SS 1"]);
    expect(several.text).toMatch(
      /^Assigned to JSS 2B, JSS 3C and SS 1, but not their class teacher\./
    );
  });
});

describe("the teacher profile", () => {
  it("names the classes the teacher is class teacher of, and hints for the rest", () => {
    render(<TeacherAssignmentsTab teacher={teacher} classTeacherOf={new Set(["c1"])} />);
    expect(screen.getByText("Class teacher of JSS 1A")).toBeInTheDocument();
    const note = screen.getByRole("note", { name: "Class teacher" });
    expect(note).toHaveTextContent("Assigned to JSS 2B, but not its class teacher.");
    expect(note).toHaveTextContent(REGISTER_RULE);
    // One card per class, labelled by Class.classTeacherId rather than the merged API lists.
    expect(screen.getAllByText("JSS 1A")).toHaveLength(1);
    expect(screen.getByText("Class Teacher")).toBeInTheDocument();
    expect(screen.getByText("Assigned")).toBeInTheDocument();
  });

  it("says nothing when the teacher is class teacher of every class they are assigned to", () => {
    render(<TeacherAssignmentsTab teacher={teacher} classTeacherOf={new Set(["c1", "c2"])} />);
    expect(screen.queryByRole("note", { name: "Class teacher" })).not.toBeInTheDocument();
  });

  it("does not claim anything while the class list is loading", () => {
    render(<TeacherAssignmentsTab teacher={teacher} />);
    expect(screen.getByText("Checking…")).toBeInTheDocument();
    expect(screen.queryByRole("note", { name: "Class teacher" })).not.toBeInTheDocument();
  });
});

// ─── The editor ───────────────────────────────────────────────────────────────

const draft: TeacherDraft = {
  firstName: "Ada",
  lastName: "Okafor",
  email: "ada@school.edu",
  phoneNumber: "",
  dateOfBirth: "",
  gender: "",
  highestAcademicQualification: "",
  specialization: "",
  yearsOfExperience: "",
  employmentType: "",
  employmentRole: "",
  assignedClasses: ["c1", "c2"],
  assignedCourses: [],
  isFormTeacher: false,
  availabilityDays: [],
  availableTime: "",
};

/**
 * Renders the editor's Classes & Courses tab for Ada.
 *
 * @param user - The signed-in admin.
 * @returns The render result.
 */
function renderEditor(user = mockAdmin) {
  return render(
    <TeacherEditAssignmentsTab
      draft={draft}
      setField={jest.fn()}
      toggleInList={jest.fn()}
      onSubmit={jest.fn()}
      isSaving={false}
      onDeactivate={jest.fn()}
      isDeactivated={false}
      classes={classes}
      courses={[]}
      classTeacherOf={classTeacherClassIds(classes, TEACHER_PROFILE)}
      teacherUserId="u-ada"
      teacherProfileId={TEACHER_PROFILE}
      teacherName="Ada Okafor"
    />,
    { user }
  );
}

describe("the teacher editor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPut.mockResolvedValue({ _id: "c2", name: "JSS 2B", classTeacherId: TEACHER_PROFILE });
  });

  it("hints for ticked classes the teacher is not the class teacher of", () => {
    renderEditor();
    expect(screen.getByRole("note", { name: "Class teacher" })).toHaveTextContent(
      "Assigned to JSS 2B, but not its class teacher."
    );
    expect(screen.getByText("Class teacher of JSS 1A.")).toBeInTheDocument();
    // The form-teacher flag is a label, not access.
    expect(screen.getByLabelText(/Show as a Form Teacher \(label only\)/)).toBeInTheDocument();
  });

  it("sets a class teacher by writing Class.classTeacherId, after naming who is replaced", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.selectOptions(screen.getByLabelText("Make class teacher of"), "c2");
    await user.click(screen.getByRole("button", { name: "Make class teacher" }));

    const dialog = screen.getByRole("dialog", { name: "Make Ada Okafor JSS 2B's class teacher?" });
    expect(within(dialog).getByText(/instead of Bayo Ade/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Make class teacher" }));

    await waitFor(() =>
      expect(mockPut).toHaveBeenCalledWith("http://api.test/classes/c2/assign-teacher", {
        teacherId: "u-ada",
      })
    );
    expect(toast.success).toHaveBeenCalledWith("Ada Okafor is now JSS 2B's class teacher.");
  });

  it("leaves setting class teachers to an admin with manage:classes", () => {
    renderEditor({ ...mockSubAdmin, permissions: ["manage:teachers"] });
    expect(screen.queryByLabelText("Make class teacher of")).not.toBeInTheDocument();
    expect(
      screen.getByText(/An admin with Manage Classes sets class teachers/)
    ).toBeInTheDocument();
    // The hint still shows: it is about access, not about who may change it.
    expect(screen.getByRole("note", { name: "Class teacher" })).toBeInTheDocument();
  });
});
