import {
  classTeacherEmail,
  classTeacherName,
  classTeacherRecord,
  validateClassForm,
  type ClassDetail,
  type ClassPayload,
} from "@/components/classes/class.model";

const validForm: ClassPayload = {
  name: "Grade 1A",
  gradeLevel: "Grade 1",
  classDescription: "",
  classCapacity: "30",
};

describe("validateClassForm", () => {
  it("accepts a complete form", () => {
    expect(validateClassForm(validForm)).toEqual({});
  });

  it("treats an empty description as valid — the DTO only needs a string", () => {
    expect(validateClassForm({ ...validForm, classDescription: "   " })).toEqual({});
  });

  it("requires a name of at least two characters", () => {
    expect(validateClassForm({ ...validForm, name: "  " }).name).toBe("Class name is required");
    expect(validateClassForm({ ...validForm, name: "A" }).name).toBe(
      "Class name must be at least 2 characters",
    );
  });

  it("requires a grade level, which the backend DTO also requires", () => {
    expect(validateClassForm({ ...validForm, gradeLevel: "" }).gradeLevel).toBe(
      "Please select a grade level",
    );
  });

  it("requires a positive capacity", () => {
    expect(validateClassForm({ ...validForm, classCapacity: "" }).classCapacity).toBe(
      "Class capacity is required",
    );
    expect(validateClassForm({ ...validForm, classCapacity: "0" }).classCapacity).toBe(
      "Class capacity must be greater than 0",
    );
    expect(validateClassForm({ ...validForm, classCapacity: "-5" }).classCapacity).toBe(
      "Class capacity must be greater than 0",
    );
    expect(validateClassForm({ ...validForm, classCapacity: "many" }).classCapacity).toBe(
      "Class capacity must be greater than 0",
    );
  });
});

describe("class teacher helpers", () => {
  const withTeacher: ClassDetail = {
    _id: "class-1",
    name: "Grade 1A",
    classTeacherId: {
      _id: "teacher-1",
      userId: { _id: "user-1", firstName: "Ada", lastName: "Lovelace", email: "ada@talim.test" },
      isFormTeacher: true,
    },
  };

  it("reads a populated teacher", () => {
    expect(classTeacherName(withTeacher)).toBe("Ada Lovelace");
    expect(classTeacherEmail(withTeacher)).toBe("ada@talim.test");
    expect(classTeacherRecord(withTeacher)?.isFormTeacher).toBe(true);
  });

  it("treats an unpopulated teacher id as no teacher rather than crashing", () => {
    const idOnly: ClassDetail = { _id: "class-1", name: "Grade 1A", classTeacherId: "teacher-1" };
    expect(classTeacherRecord(idOnly)).toBeNull();
    expect(classTeacherName(idOnly)).toBe("No teacher assigned");
    expect(classTeacherEmail(idOnly)).toBe("");
  });

  it("handles a class with no teacher, and no class at all", () => {
    expect(classTeacherName({ _id: "c", name: "x" })).toBe("No teacher assigned");
    expect(classTeacherName(null)).toBe("No teacher assigned");
    expect(classTeacherEmail(undefined)).toBe("");
  });
});
