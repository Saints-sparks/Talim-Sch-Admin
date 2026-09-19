/**
 * Contract guard for the School Admin write paths.
 *
 * The important half of this file runs in `tsc`, not in Jest: every payload
 * below is checked against the backend DTO generated into `src/types/api.d.ts`.
 *
 * - `satisfies` fails when a DTO gains a required field or changes a type/enum.
 * - `@ts-expect-error` lines fail when a DTO becomes looser (an unknown field or a
 *   missing required field is suddenly accepted).
 * - `assertKeys` fails when a DTO gains or drops a field, so the client is
 *   reviewed instead of silently sending too little (the API drops nothing: with
 *   `forbidNonWhitelisted`, sending too much is a 400).
 *
 * After `npm run types:api`, run `npm run type-check`; an error in this file
 * names the endpoint whose DTO changed.
 */
import type { PermissionValue } from "@/lib/permissions";
import type {
  AssignFeePayload,
  ConfirmWithdrawalPayload,
  CreateAnnouncementPayload,
  CreateFeeCategoryPayload,
  CreateStudentProfilePayload,
  CreateSubAdminPayload,
  CreateTeacherProfilePayload,
  InitiateWithdrawalPayload,
  ManualPaymentPayload,
  RegisterUserPayload,
  UpdateLeaveStatusPayload,
} from "@/types/apiPayloads";
import type { RequestBody, ResponseBody } from "@/types/apiContract";

/** Exact key list of `T`; passing the wrong list is a compile error. */
type ExactKeys<T, K extends readonly (keyof T)[]> = Exclude<keyof T, K[number]> extends never
  ? K
  : { error: "DTO has fields this test does not list"; missing: Exclude<keyof T, K[number]> };

/** Returns the list unchanged; exists only so `tsc` can compare it with the DTO. */
function assertKeys<T>() {
  return <const K extends readonly (keyof T)[]>(keys: ExactKeys<T, K>): K => keys as K;
}

describe("write payloads follow the backend contract", () => {
  it("fees: create a category and assign a fee to classes", () => {
    const category = { name: "Tuition", description: "Termly tuition" } satisfies CreateFeeCategoryPayload;
    // @ts-expect-error a field the DTO does not declare is a 400
    const extra: CreateFeeCategoryPayload = { name: "Tuition", colour: "red" };
    // @ts-expect-error `name` is required
    const missing: CreateFeeCategoryPayload = { description: "no name" };

    const assign = {
      feeItemId: "665f0000000000000000fee1",
      termId: "665f0000000000000000te01",
      classes: [{ classId: "665f0000000000000000c001", amount: 45000, dueDate: "2026-09-30" }],
    } satisfies AssignFeePayload;

    assertKeys<CreateFeeCategoryPayload>()(["name", "description"]);
    assertKeys<AssignFeePayload>()(["feeItemId", "academicYearId", "termId", "classes"]);
    expect(Object.keys(category)).toEqual(["name", "description"]);
    expect(assign.classes).toHaveLength(1);
    expect([extra, missing]).toHaveLength(2);
  });

  it("finance: start and confirm a withdrawal", () => {
    const initiate = {
      bankAccountId: "665f0000000000000000ba01",
      amount: 250000,
      note: "Term one salaries",
    } satisfies InitiateWithdrawalPayload;
    const confirm = {
      withdrawalDraftId: "665f0000000000000000d001",
      confirmationAccepted: true,
      twoFactorCode: "123456",
    } satisfies ConfirmWithdrawalPayload;
    // @ts-expect-error `confirmationAccepted` is required
    const unconfirmed: ConfirmWithdrawalPayload = { withdrawalDraftId: "d1" };

    assertKeys<InitiateWithdrawalPayload>()(["bankAccountId", "amount", "note"]);
    assertKeys<ConfirmWithdrawalPayload>()(["withdrawalDraftId", "confirmationAccepted", "twoFactorCode"]);
    expect(initiate.amount).toBeGreaterThan(0);
    expect(confirm.confirmationAccepted).toBe(true);
    expect(unconfirmed).toBeDefined();
  });

  it("payments: record a manual payment", () => {
    const payment = {
      studentId: "665f0000000000000000s001",
      feeAssignmentIds: ["665f0000000000000000a001"],
      amount: 45000,
      paymentMethod: "cash",
      reference: "RCPT-1",
    } satisfies ManualPaymentPayload;

    assertKeys<ManualPaymentPayload>()([
      "studentId",
      "feeAssignmentIds",
      "amount",
      "paymentMethod",
      "reference",
      "notes",
    ]);
    expect(payment.feeAssignmentIds).toHaveLength(1);
  });

  it("users: create a teacher account and profile, and a student profile", () => {
    const account = {
      email: "ada@school.test",
      role: "teacher",
      schoolId: "665f0000000000000000sc01",
      firstName: "Ada",
      lastName: "Obi",
    } satisfies RegisterUserPayload;
    const profile = {
      highestAcademicQualification: "Graduate",
      yearsOfExperience: 4,
      specialization: "Mathematics",
      employmentType: "Fulltime",
      employmentRole: "Academic",
      availabilityDays: ["Monday", "Tuesday"],
      availableTime: "08:00 - 15:00",
    } satisfies CreateTeacherProfilePayload;
    const student = {
      userId: "665f0000000000000000u001",
      classId: "665f0000000000000000c001",
      gradeLevel: "Grade 3",
      parentContact: {
        fullName: "Chidi Eze",
        phoneNumber: "+2348000000000",
        email: "chidi@example.test",
        relationship: "FATHER",
      },
    } satisfies CreateStudentProfilePayload;
    // @ts-expect-error `userId` belongs in the URL of POST /teachers/:userId, not the body
    const withUserId: CreateTeacherProfilePayload = { ...profile, userId: "u1" };

    assertKeys<CreateTeacherProfilePayload>()([
      "highestAcademicQualification",
      "yearsOfExperience",
      "specialization",
      "employmentType",
      "employmentRole",
      "availabilityDays",
      "availableTime",
      "isFormTeacher",
      "assignedClasses",
      "assignedCourses",
    ]);
    assertKeys<CreateStudentProfilePayload>()([
      "userId",
      "classId",
      "gradeLevel",
      "parentContact",
      "password",
      "admissionNumber",
      "isActive",
    ]);
    expect(account.role).toBe("teacher");
    expect(student.parentContact.relationship).toBe("FATHER");
    expect(withUserId).toBeDefined();
  });

  it("sub-admins, announcements and leave decisions", () => {
    const permissions = ["manage:fees", "manage:students"] satisfies CreateSubAdminPayload["permissions"];
    const subAdmin = {
      firstName: "Ngozi",
      lastName: "Bello",
      email: "ngozi@school.test",
      permissions,
    } satisfies CreateSubAdminPayload;
    const announcement = {
      title: "Resumption",
      content: "School resumes on Monday.",
      audience: ["all_parents"],
      status: "PUBLISHED",
    } satisfies CreateAnnouncementPayload;
    const decision = { status: "Rejected", viewed: true, declineReason: "Exam week" } satisfies UpdateLeaveStatusPayload;
    // @ts-expect-error "Declined" is not a status the API knows
    const wrongStatus: UpdateLeaveStatusPayload = { status: "Declined" };

    assertKeys<CreateSubAdminPayload>()(["firstName", "lastName", "email", "phoneNumber", "permissions"]);
    expect(subAdmin.permissions).toHaveLength(2);
    expect(announcement.status).toBe("PUBLISHED");
    expect(decision.status).toBe("Rejected");
    expect(wrongStatus).toBeDefined();
  });

  it("the app's permission values are exactly the API's permission enum", () => {
    type ApiPermission = CreateSubAdminPayload["permissions"][number];
    // Both directions: a value only one side knows is a compile error.
    const appToApi: (p: PermissionValue) => ApiPermission = (p) => p;
    const apiToApp: (p: ApiPermission) => PermissionValue = (p) => p;
    expect(appToApi("manage:fees")).toBe(apiToApp("manage:fees"));
  });

  it("the helper types resolve real routes (a wrong path or method would not compile)", () => {
    type Body = RequestBody<"/fees/categories", "post">;
    type Reply = ResponseBody<"/fees/categories", "get">;
    const body: Body = { name: "Uniform" };
    const reply: Reply | undefined = undefined;
    // @ts-expect-error GET /fees/categories has no request body, so `MethodsOf` rejects "put"
    const bad: RequestBody<"/fees/categories", "put"> | undefined = undefined;
    expect(body.name).toBe("Uniform");
    expect(reply).toBeUndefined();
    expect(bad).toBeUndefined();
  });
});
