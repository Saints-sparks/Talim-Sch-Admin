import {
  INITIAL_TEACHER_FORM,
  buildTeacherCreateInput,
  describeTeacherErrors,
  firstStepWithError,
  isTeacherField,
  validateTeacherStep,
  type TeacherFormState,
} from "@/components/users/teachers/create/teacherForm";
import { emailError, nameError, phoneError } from "@/components/users/create/validation";
import { ApiError } from "@/lib/apiError";
import { describeCreateFailure, fieldFromReason } from "@/components/users/create/serverErrors";

const FILLED: TeacherFormState = {
  ...INITIAL_TEACHER_FORM,
  email: " ada@school.edu ",
  firstName: " Ada ",
  lastName: "Okafor",
  phoneNumber: "+234 801 234 5678",
  dateOfBirth: "1990-04-02",
  gender: "female",
  yearsOfExperience: 5,
  specialization: " Mathematics ",
  availabilityDays: ["Monday", "Friday"],
  availableTime: "8:00 AM - 2:00 PM",
  assignedClasses: ["c1", "c2"],
};

describe("shared field rules (mirror RegisterUserDto)", () => {
  it("accepts a normal email and rejects malformed and over-long ones", () => {
    expect(emailError("ada@school.edu")).toBeUndefined();
    expect(emailError("")).toMatch(/enter/i);
    expect(emailError("ada@school")).toMatch(/valid/i);
    expect(emailError(`${"a".repeat(250)}@x.co`)).toMatch(/254/);
  });

  it("limits names to 80 characters", () => {
    expect(nameError("Ada", "first name")).toBeUndefined();
    expect(nameError("   ", "first name")).toMatch(/first name/);
    expect(nameError("a".repeat(81), "last name")).toMatch(/80/);
  });

  it("uses the API's phone pattern", () => {
    expect(phoneError("+234 801 234 5678")).toBeUndefined();
    expect(phoneError("08012345678")).toBeUndefined();
    expect(phoneError("abc")).toMatch(/valid/i);
    expect(phoneError("12")).toMatch(/valid/i);
    expect(phoneError("")).toMatch(/enter/i);
  });
});

describe("validateTeacherStep", () => {
  it("flags every required account field on an empty first step", () => {
    const errors = validateTeacherStep(0, INITIAL_TEACHER_FORM);
    expect(Object.keys(errors).sort()).toEqual(
      ["dateOfBirth", "email", "firstName", "gender", "lastName", "phoneNumber"].sort(),
    );
  });

  it("passes a complete first step", () => {
    expect(validateTeacherStep(0, FILLED)).toEqual({});
  });

  it("requires a specialization and keeps experience within 0..50", () => {
    expect(validateTeacherStep(1, { ...FILLED, specialization: "  " }).specialization).toBeDefined();
    expect(validateTeacherStep(1, { ...FILLED, yearsOfExperience: 51 }).yearsOfExperience).toBeDefined();
    expect(validateTeacherStep(1, { ...FILLED, yearsOfExperience: -1 }).yearsOfExperience).toBeDefined();
    expect(validateTeacherStep(1, { ...FILLED, yearsOfExperience: 0 })).toEqual({});
  });

  it("requires at least one day and a time on the last step", () => {
    const errors = validateTeacherStep(2, INITIAL_TEACHER_FORM);
    expect(errors.availabilityDays).toBeDefined();
    expect(errors.availableTime).toBeDefined();
    expect(validateTeacherStep(2, FILLED)).toEqual({});
  });

  it("names the failing fields in the toast", () => {
    const text = describeTeacherErrors(validateTeacherStep(0, INITIAL_TEACHER_FORM));
    expect(text).toMatch(/^Please complete: /);
    expect(text).toMatch(/email address/);
    expect(text).toMatch(/date of birth/);
  });

  it("finds the earliest step that holds an error", () => {
    expect(firstStepWithError([])).toBeNull();
    expect(firstStepWithError(["availableTime", "specialization"])).toBe(1);
    expect(firstStepWithError(["email", "availableTime"])).toBe(0);
  });

  it("recognises only the form's own field names", () => {
    expect(isTeacherField("email")).toBe(true);
    expect(isTeacherField("password")).toBe(false);
    expect(isTeacherField("toString")).toBe(false);
  });
});

describe("buildTeacherCreateInput", () => {
  const input = buildTeacherCreateInput(FILLED, "school-1");

  it("never carries a password", () => {
    expect(input.account).not.toHaveProperty("password");
    expect(input.profile).not.toHaveProperty("password");
  });

  it("sends exactly the RegisterUserDto fields, trimmed", () => {
    expect(input.account).toEqual({
      email: "ada@school.edu",
      role: "teacher",
      schoolId: "school-1",
      firstName: "Ada",
      lastName: "Okafor",
      phoneNumber: "+234 801 234 5678",
      dateOfBirth: "1990-04-02",
      gender: "female",
    });
  });

  it("sends exactly the CreateTeacherDto fields, without account-level ones", () => {
    expect(Object.keys(input.profile).sort()).toEqual(
      [
        "assignedClasses",
        "assignedCourses",
        "availabilityDays",
        "availableTime",
        "employmentRole",
        "employmentType",
        "highestAcademicQualification",
        "isFormTeacher",
        "specialization",
        "yearsOfExperience",
      ].sort(),
    );
    expect(input.profile.specialization).toBe("Mathematics");
    expect(input.profile.assignedClasses).toEqual(["c1", "c2"]);
    expect(input.profile.yearsOfExperience).toBe(5);
    expect(input.profile).not.toHaveProperty("dateOfBirth");
    expect(input.profile).not.toHaveProperty("gender");
    expect(input.profile).not.toHaveProperty("userId");
  });

  it("omits optional account fields that are blank", () => {
    const { account } = buildTeacherCreateInput({ ...FILLED, dateOfBirth: "", gender: "" }, "s");
    expect(account).not.toHaveProperty("dateOfBirth");
    expect(account).not.toHaveProperty("gender");
  });
});

describe("describeCreateFailure", () => {
  const opts = { resource: "teacher", accountCreated: false } as const;

  it("reads a conflict as an existing email and points at the email field", () => {
    const failure = describeCreateFailure(new ApiError("CONFLICT", "dup", 409), opts);
    expect(failure.code).toBe("CONFLICT");
    expect(failure.message).toMatch(/already exists/);
    expect(failure.fieldErrors.email).toMatch(/already exists/);
  });

  it("does not blame the email when the account was already created", () => {
    const failure = describeCreateFailure(new ApiError("CONFLICT", "Teacher profile already exists", 409), {
      ...opts,
      accountCreated: true,
    });
    expect(failure.fieldErrors.email).toBeUndefined();
    expect(failure.message).toMatch(/login account was created/);
    expect(failure.message).toMatch(/Teacher profile already exists/);
  });

  it("keeps the server's field errors", () => {
    const error = new ApiError("VALIDATION_FAILED", "Some fields need attention.", 400, [
      { field: "specialization", reason: "must not be empty" },
    ]);
    const failure = describeCreateFailure(error, opts);
    expect(failure.fieldErrors).toEqual({ specialization: "must not be empty" });
    expect(failure.message).toMatch(/need attention/);
  });

  it("infers the field from class-validator sentences and keeps unattributable ones in the message", () => {
    const error = new ApiError("VALIDATION_FAILED", "Some fields need attention.", 400, [
      { reason: "phoneNumber must be a valid phone number" },
      { reason: "something odd happened" },
    ]);
    const failure = describeCreateFailure(error, opts);
    expect(failure.fieldErrors.phoneNumber).toBe("phoneNumber must be a valid phone number");
    expect(failure.message).toMatch(/something odd happened/);
  });

  it("explains a permission refusal", () => {
    const failure = describeCreateFailure(new ApiError("FORBIDDEN", "nope", 403), opts);
    expect(failure.message).toMatch(/permission to add teachers/);
  });

  it("falls back to the message of a plain Error, or the resource sentence", () => {
    expect(describeCreateFailure(new Error("boom"), opts).message).toBe("boom");
    expect(describeCreateFailure("weird", opts).message).toMatch(/couldn't add this teacher/);
  });

  it("pulls nested property paths out of validation sentences", () => {
    expect(fieldFromReason("parentContact.email must be an email")).toBe("parentContact.email");
    expect(fieldFromReason("Something else")).toBeNull();
  });
});
