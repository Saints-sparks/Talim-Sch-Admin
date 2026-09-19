/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@/test-utils/render";
import { mockSubAdmin } from "@/test-utils/render";
import {
  TeacherEditAssignmentsTab,
  TeacherEditAvailabilityTab,
  TeacherEditPersonalTab,
} from "@/components/users/teachers/TeacherEditTabs";
import { classItems, courseItems, courseLabel } from "@/components/users/teachers/edit/assignmentItems";
import type { TeacherDraft } from "@/hooks/users/useTeacherEditor";
import type { RosterClass } from "@/hooks/users/useRosterClasses";

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
  assignedClasses: ["c1"],
  assignedCourses: [],
  isFormTeacher: false,
  availabilityDays: [],
  availableTime: "",
};

function tabProps(overrides: Partial<{ isDeactivated: boolean }> = {}) {
  return {
    draft,
    setField: jest.fn(),
    onSubmit: jest.fn((e: React.FormEvent) => e.preventDefault()),
    isSaving: false,
    onDeactivate: jest.fn(),
    isDeactivated: false,
    ...overrides,
  };
}

describe("assignment picker rows", () => {
  it("labels a course with its code then its title, in either API spelling", () => {
    expect(courseLabel({ _id: "k1", courseCode: "MTH101", title: "Maths" })).toBe("MTH101 Maths");
    expect(courseLabel({ _id: "k2", code: "ENG1", name: "English" })).toBe("ENG1 English");
    expect(courseLabel({ _id: "k3", title: "Art" })).toBe("Art");
  });

  it("maps classes and courses to rows keyed by id", () => {
    expect(classItems([{ _id: "c1", name: "JSS1" }])).toEqual([{ id: "c1", label: "JSS1" }]);
    expect(courseItems([{ _id: "k1", code: "X", title: "Y" }])).toEqual([{ id: "k1", label: "X Y" }]);
  });
});

describe("teacher edit tabs", () => {
  it("edits a field and submits the tab", () => {
    const props = tabProps();
    render(<TeacherEditPersonalTab {...props} />);
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Ola" } });
    expect(props.setField).toHaveBeenCalledWith("firstName", "Ola");
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(props.onSubmit).toHaveBeenCalled();
  });

  it("shows Updating... and disables the button while saving", () => {
    render(<TeacherEditPersonalTab {...tabProps()} isSaving />);
    expect(screen.getByRole("button", { name: /Updating/ })).toBeDisabled();
  });

  it("offers Deactivate to a role with manage:teachers, and disables it once deactivated", () => {
    const props = tabProps();
    const { unmount } = render(<TeacherEditPersonalTab {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Deactivate Teacher" }));
    expect(props.onDeactivate).toHaveBeenCalled();
    unmount();

    render(<TeacherEditPersonalTab {...tabProps({ isDeactivated: true })} />);
    expect(screen.getByRole("button", { name: "Already Deactivated" })).toBeDisabled();
  });

  it("hides Deactivate from a role without manage:teachers", () => {
    render(<TeacherEditPersonalTab {...tabProps()} />, { user: mockSubAdmin });
    expect(screen.queryByRole("button", { name: "Deactivate Teacher" })).toBeNull();
  });

  it("ticks a class and a day through toggleInList", () => {
    const toggleInList = jest.fn();
    const classes = [
      { _id: "c1", name: "JSS1" },
      { _id: "c2", name: "JSS2" },
    ] as unknown as RosterClass[];
    const { unmount } = render(
      <TeacherEditAssignmentsTab {...tabProps()} toggleInList={toggleInList} classes={classes} courses={[]} />,
    );
    expect(screen.getByLabelText("JSS1")).toBeChecked();
    fireEvent.click(screen.getByLabelText("JSS2"));
    expect(toggleInList).toHaveBeenCalledWith("assignedClasses", "c2");
    expect(screen.getByText("No courses have been created yet.")).toBeInTheDocument();
    unmount();

    render(<TeacherEditAvailabilityTab {...tabProps()} toggleInList={toggleInList} />);
    fireEvent.click(screen.getByLabelText("Monday"));
    expect(toggleInList).toHaveBeenCalledWith("availabilityDays", "Monday");
  });
});
