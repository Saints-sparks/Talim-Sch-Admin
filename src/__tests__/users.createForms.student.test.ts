import {
  INITIAL_STUDENT_FORM,
  PARENT_RELATIONSHIPS,
  buildStudentCreateInput,
  describeStudentErrors,
  firstStudentStepWithError,
  studentFieldFromServer,
  validateStudentStep,
  withClassChoice,
  type StudentFormState,
} from "@/components/users/students/create/studentForm";

const FILLED: StudentFormState = {
  email: " kemi@school.edu ",
  firstName: " Kemi ",
  lastName: "Bello",
  phoneNumber: "+234 802 000 1111",
  classId: "c1",
  gradeLevel: "JSS1",
  parentFirstName: "Tunde",
  parentLastName: "Bello",
  parentPhone: "08030001111",
  parentEmail: "tunde@example.com",
  relationship: "FATHER",
};

describe("validateStudentStep", () => {
  it("flags every account field on an empty first step", () => {
    expect(Object.keys(validateStudentStep(0, INITIAL_STUDENT_FORM)).sort()).toEqual(
      ["email", "firstName", "lastName", "phoneNumber"].sort(),
    );
  });

  it("passes a complete account step and applies the API's phone pattern", () => {
    expect(validateStudentStep(0, FILLED)).toEqual({});
    expect(validateStudentStep(0, { ...FILLED, phoneNumber: "call me" }).phoneNumber).toBeDefined();
  });

  it("flags every profile field on an empty second step", () => {
    expect(Object.keys(validateStudentStep(1, INITIAL_STUDENT_FORM)).sort()).toEqual(
      [
        "classId",
        "gradeLevel",
        "parentEmail",
        "parentFirstName",
        "parentLastName",
        "parentPhone",
        "relationship",
      ].sort(),
    );
  });

  it("passes a complete profile step and rejects a malformed parent email", () => {
    expect(validateStudentStep(1, FILLED)).toEqual({});
    expect(validateStudentStep(1, { ...FILLED, parentEmail: "tunde@" }).parentEmail).toBeDefined();
  });

  it("names the failing fields in the toast", () => {
    const text = describeStudentErrors(validateStudentStep(1, INITIAL_STUDENT_FORM));
    expect(text).toMatch(/^Please complete: class, grade level/);
    expect(text).toMatch(/parent email/);
  });

  it("finds the earliest step holding an error", () => {
    expect(firstStudentStepWithError([])).toBeNull();
    expect(firstStudentStepWithError(["parentEmail"])).toBe(1);
    expect(firstStudentStepWithError(["parentEmail", "email"])).toBe(0);
  });
});

describe("class choice", () => {
  it("inherits the class's grade level", () => {
    expect(withClassChoice(INITIAL_STUDENT_FORM, "c1", "JSS2")).toMatchObject({ classId: "c1", gradeLevel: "JSS2" });
  });

  it("keeps a typed grade level when the class has none", () => {
    const typed = { ...INITIAL_STUDENT_FORM, gradeLevel: "SS1" };
    expect(withClassChoice(typed, "c9", undefined).gradeLevel).toBe("SS1");
  });
});

describe("server field names", () => {
  it("maps the nested parent fields onto the form", () => {
    expect(studentFieldFromServer("parentContact.email")).toBe("parentEmail");
    expect(studentFieldFromServer("parentContact.fullName")).toBe("parentFirstName");
    expect(studentFieldFromServer("parentContact.relationship")).toBe("relationship");
    expect(studentFieldFromServer("classId")).toBe("classId");
    expect(studentFieldFromServer("password")).toBeNull();
    expect(studentFieldFromServer("constructor")).toBeNull();
  });
});

describe("buildStudentCreateInput", () => {
  const input = buildStudentCreateInput(FILLED, "school-9");

  it("sends exactly the RegisterUserDto fields, trimmed, with no password", () => {
    expect(input.account).toEqual({
      email: "kemi@school.edu",
      role: "student",
      schoolId: "school-9",
      firstName: "Kemi",
      lastName: "Bello",
      phoneNumber: "+234 802 000 1111",
    });
    expect(input.account).not.toHaveProperty("password");
  });

  it("sends exactly the CreateStudentDto fields, with the parent as one full name", () => {
    expect(input.profile).toEqual({
      classId: "c1",
      gradeLevel: "JSS1",
      parentContact: {
        fullName: "Tunde Bello",
        phoneNumber: "08030001111",
        email: "tunde@example.com",
        relationship: "FATHER",
      },
    });
  });

  it("offers exactly the backend's four relationships", () => {
    expect(PARENT_RELATIONSHIPS.map((r) => r.value).sort()).toEqual(["FATHER", "GUARDIAN", "MOTHER", "OTHER"]);
  });
});
