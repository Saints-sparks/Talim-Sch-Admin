import {
  assignmentsPayload,
  availabilityPayload,
  draftFromTeacher,
  employmentPayload,
  personalPayload,
  qualificationsPayload,
} from "@/hooks/users/useTeacherEditor";
import type { TeacherById } from "@/app/services/teacher.service";

const teacher = {
  _id: "t1",
  staffNumber: "TCH-001",
  userId: {
    _id: "u1",
    userId: "u1",
    email: "ada@school.edu",
    role: "teacher",
    firstName: "Ada",
    lastName: "Okafor",
    phoneNumber: "+2348012345678",
    isActive: true,
    isEmailVerified: true,
    schoolId: "school-1",
    isTwoFactorEnabled: false,
    devices: [],
    createdAt: "",
    updatedAt: "",
    __v: 0,
    id: "u1",
    dateOfBirth: "1990-04-12T00:00:00.000Z",
    gender: "Female",
  },
  assignedClasses: [{ _id: "c1", name: "JSS1", classCapacity: 30, classDescription: "", assignedCourses: [] }],
  classTeacherClasses: [
    { _id: "c1", name: "JSS1", classCapacity: 30, classDescription: "", assignedCourses: [] },
    { _id: "c2", name: "JSS2", classCapacity: 30, classDescription: "", assignedCourses: [] },
  ],
  assignedCourses: [
    { _id: "k1", courseCode: "MTH101", title: "Maths", description: "", classId: "c1", subjectId: "s1" },
  ],
  isFormTeacher: true,
  highestAcademicQualification: "Graduate",
  yearsOfExperience: 7,
  specialization: "Mathematics",
  employmentType: "Fulltime",
  employmentRole: "Academic",
  availabilityDays: ["Monday", "Tuesday"],
  availableTime: "08:00 AM - 03:00 PM",
  createdAt: "",
  updatedAt: "",
  __v: 0,
} as TeacherById;

describe("draftFromTeacher", () => {
  it("merges the taught and form-teacher class lists without repeating a class", () => {
    expect(draftFromTeacher(teacher).assignedClasses).toEqual(["c1", "c2"]);
  });

  it("normalises date of birth and gender for the form controls", () => {
    const draft = draftFromTeacher(teacher);
    expect(draft.dateOfBirth).toBe("1990-04-12");
    expect(draft.gender).toBe("female");
  });

  it("drops a qualification the backend enum does not contain", () => {
    const draft = draftFromTeacher({ ...teacher, highestAcademicQualification: "Other" });
    expect(draft.highestAcademicQualification).toBe("");
  });
});

describe("section payloads", () => {
  const draft = draftFromTeacher(teacher);

  it("personal details carry only fields the DTO declares", () => {
    expect(personalPayload(draft)).toEqual({
      firstName: "Ada",
      lastName: "Okafor",
      email: "ada@school.edu",
      phoneNumber: "+2348012345678",
      dateOfBirth: "1990-04-12",
      gender: "female",
    });
  });

  it("qualifications send a number for years of experience", () => {
    expect(qualificationsPayload(draft)).toEqual({
      highestAcademicQualification: "Graduate",
      specialization: "Mathematics",
      yearsOfExperience: 7,
    });
  });

  it("qualifications omit years of experience when the field is cleared", () => {
    expect(qualificationsPayload({ ...draft, yearsOfExperience: "" })).not.toHaveProperty(
      "yearsOfExperience",
    );
  });

  it("employment omits values that were never set", () => {
    expect(employmentPayload({ ...draft, employmentRole: "" })).toEqual({ employmentType: "Fulltime" });
  });

  it("assignments send the full intended lists, which replace what is stored", () => {
    expect(assignmentsPayload(draft)).toEqual({
      assignedClasses: ["c1", "c2"],
      assignedCourses: ["k1"],
      isFormTeacher: true,
    });
  });

  it("availability keeps the day list even when it is emptied", () => {
    expect(availabilityPayload({ ...draft, availabilityDays: [] })).toEqual({
      availabilityDays: [],
      availableTime: "08:00 AM - 03:00 PM",
    });
  });
});
