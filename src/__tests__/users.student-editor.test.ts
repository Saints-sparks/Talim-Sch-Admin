import {
  draftFromStudent,
  draftProblems,
  toUpdatePayload,
  type StudentDraft,
} from "@/hooks/users/useStudentEditor";
import type { StudentById } from "@/app/services/student.service";

const student = {
  _id: "s1",
  admissionNumber: "ADM-1",
  userId: {
    _id: "u1",
    email: "ada@school.edu",
    role: "student",
    firstName: "Ada",
    lastName: "Okafor",
    phoneNumber: "+2348012345678",
    dateOfBirth: "2012-04-12T00:00:00.000Z",
    gender: "Female",
    userAvatar: "https://cdn.test/ada.png",
  },
  classId: { _id: "c1", name: "JSS1" },
  gradeLevel: "JSS1",
  parentId: {
    _id: "p1",
    email: "mum@example.com",
    role: "parent",
    firstName: "Ngozi",
    lastName: "Okafor",
    phoneNumber: "+2348000000000",
  },
  parentContact: {
    fullName: "Ngozi Okafor",
    phoneNumber: "+2348000000000",
    email: "mum@example.com",
    relationship: "mother",
    _id: "pc1",
  },
  isActive: true,
} as StudentById;

describe("draftFromStudent", () => {
  it("normalises the date of birth to what a date input needs", () => {
    expect(draftFromStudent(student).dateOfBirth).toBe("2012-04-12");
  });

  it("normalises gender and relationship to the backend's enum values", () => {
    const draft = draftFromStudent(student);
    expect(draft.gender).toBe("female");
    expect(draft.relationship).toBe("MOTHER");
  });

  it("drops a relationship the backend does not accept rather than sending it back", () => {
    const draft = draftFromStudent({
      ...student,
      parentContact: { ...student.parentContact, relationship: "GRANDPARENT" },
    });
    expect(draft.relationship).toBe("");
  });

  it("leaves an unreadable date of birth empty instead of showing NaN", () => {
    const draft = draftFromStudent({
      ...student,
      userId: { ...student.userId, dateOfBirth: "not a date" },
    });
    expect(draft.dateOfBirth).toBe("");
  });
});

describe("toUpdatePayload", () => {
  it("builds the UpdateStudentDto shape, with userInfo rather than userId", () => {
    const payload = toUpdatePayload(draftFromStudent(student));
    expect(payload).toMatchObject({
      userInfo: { firstName: "Ada", lastName: "Okafor", email: "ada@school.edu", gender: "female" },
      classId: "c1",
      isActive: true,
      parentContact: { relationship: "MOTHER" },
    });
    expect(payload).not.toHaveProperty("userId");
  });

  it("omits empty optional fields instead of writing blanks over real values", () => {
    const draft: StudentDraft = {
      ...draftFromStudent(student),
      dateOfBirth: "",
      gender: "",
      userAvatar: "",
      classId: "",
    };
    const payload = toUpdatePayload(draft);
    expect(payload.userInfo).not.toHaveProperty("dateOfBirth");
    expect(payload.userInfo).not.toHaveProperty("gender");
    expect(payload.userInfo).not.toHaveProperty("userAvatar");
    expect(payload).not.toHaveProperty("classId");
  });

  it("leaves parentContact out when no valid relationship is selected", () => {
    const payload = toUpdatePayload({ ...draftFromStudent(student), relationship: "" });
    expect(payload).not.toHaveProperty("parentContact");
  });
});

describe("draftProblems", () => {
  it("is empty for a complete draft", () => {
    expect(draftProblems(draftFromStudent(student))).toEqual([]);
  });

  it("names every required field that is blank", () => {
    const problems = draftProblems({
      ...draftFromStudent(student),
      firstName: "  ",
      parentEmail: "",
      relationship: "",
    });
    expect(problems).toEqual(
      expect.arrayContaining(["first name", "relationship", "parent/guardian email"]),
    );
  });
});
