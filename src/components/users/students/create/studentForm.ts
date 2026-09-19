/**
 * The add-student form as data: its shape, defaults, per-step validation and
 * the request bodies it produces. Kept free of React so the rules and the
 * payloads can be tested directly.
 *
 * The bodies match talimBE-V2's `RegisterUserDto` (`POST /auth/register`) and
 * `CreateStudentDto` with its nested `ParentContactDto` (`POST /students`). The
 * API whitelists and forbids unknown properties, so an extra field is a 400 —
 * and no password is sent: the server generates a temporary one.
 */
import type { CreateStudentInput } from "@/hooks/users/useStudents";
import type { ParentRelationship } from "@/app/services/student.service";
import { emailError, isBlank, nameError, phoneError } from "../../create/validation";

/** The backend's `ParentRelationship` enum, in the order the select lists it. */
export const PARENT_RELATIONSHIPS: ReadonlyArray<{ value: ParentRelationship; label: string }> = [
  { value: "FATHER", label: "Father" },
  { value: "MOTHER", label: "Mother" },
  { value: "GUARDIAN", label: "Guardian" },
  { value: "OTHER", label: "Other" },
];

/** Zero-based wizard step: 0 account, 1 profile. */
export type StudentStep = 0 | 1;

/** Index of the last wizard step. */
export const STUDENT_LAST_STEP: StudentStep = 1;

/** Everything the wizard collects. */
export interface StudentFormState {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  classId: string;
  gradeLevel: string;
  parentFirstName: string;
  parentLastName: string;
  parentPhone: string;
  parentEmail: string;
  relationship: "" | ParentRelationship;
}

/** A field of the form. */
export type StudentField = keyof StudentFormState;

/** Field-level error messages, keyed by field. */
export type StudentFormErrors = Partial<Record<StudentField, string>>;

/** A fresh form. */
export const INITIAL_STUDENT_FORM: StudentFormState = {
  email: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  classId: "",
  gradeLevel: "",
  parentFirstName: "",
  parentLastName: "",
  parentPhone: "",
  parentEmail: "",
  relationship: "",
};

/** Which wizard step each field lives on. */
export const STUDENT_FIELD_STEP: Record<StudentField, StudentStep> = {
  email: 0,
  firstName: 0,
  lastName: 0,
  phoneNumber: 0,
  classId: 1,
  gradeLevel: 1,
  parentFirstName: 1,
  parentLastName: 1,
  parentPhone: 1,
  parentEmail: 1,
  relationship: 1,
};

/** Field names as the admin reads them, for toasts and the profile status box. */
export const STUDENT_FIELD_LABELS: Record<StudentField, string> = {
  email: "student email",
  firstName: "student first name",
  lastName: "student last name",
  phoneNumber: "student phone number",
  classId: "class",
  gradeLevel: "grade level",
  parentFirstName: "parent first name",
  parentLastName: "parent last name",
  parentPhone: "parent phone number",
  parentEmail: "parent email",
  relationship: "relationship",
};

/** The API's field names for the parent block, mapped to the form's. */
const SERVER_FIELDS: Record<string, StudentField> = {
  email: "email",
  firstName: "firstName",
  lastName: "lastName",
  phoneNumber: "phoneNumber",
  classId: "classId",
  gradeLevel: "gradeLevel",
  "parentContact.fullName": "parentFirstName",
  "parentContact.phoneNumber": "parentPhone",
  "parentContact.email": "parentEmail",
  "parentContact.relationship": "relationship",
};

/**
 * Maps a field name from the API's validation details onto the form.
 *
 * @param field - The server's field name, e.g. `parentContact.email`.
 * @returns The form field it belongs to, or `null` when the form has none.
 */
export function studentFieldFromServer(field: string): StudentField | null {
  return Object.prototype.hasOwnProperty.call(SERVER_FIELDS, field) ? SERVER_FIELDS[field] : null;
}

/**
 * Validates one wizard step against the rules the API enforces.
 *
 * @param step - The step being left.
 * @param form - The current form values.
 * @returns Errors for the step's fields; empty when the step is valid.
 */
export function validateStudentStep(step: StudentStep, form: StudentFormState): StudentFormErrors {
  const errors: StudentFormErrors = {};

  if (step === 0) {
    const email = emailError(form.email);
    if (email) errors.email = email;
    const first = nameError(form.firstName, "first name");
    if (first) errors.firstName = first;
    const last = nameError(form.lastName, "last name");
    if (last) errors.lastName = last;
    const phone = phoneError(form.phoneNumber);
    if (phone) errors.phoneNumber = phone;
  }

  if (step === 1) {
    if (isBlank(form.classId)) errors.classId = "Choose a class.";
    if (isBlank(form.gradeLevel)) errors.gradeLevel = "Enter the grade level.";
    const parentFirst = nameError(form.parentFirstName, "parent's first name");
    if (parentFirst) errors.parentFirstName = parentFirst;
    const parentLast = nameError(form.parentLastName, "parent's last name");
    if (parentLast) errors.parentLastName = parentLast;
    if (isBlank(form.relationship)) errors.relationship = "Choose the relationship.";
    if (isBlank(form.parentPhone)) errors.parentPhone = "Enter the parent's phone number.";
    const parentEmail = emailError(form.parentEmail);
    if (parentEmail) errors.parentEmail = parentEmail.replace("an email address", "the parent's email address");
  }

  return errors;
}

/**
 * The toast text for a step that failed validation.
 *
 * @param errors - The step's errors.
 * @returns "Please complete: …" naming each field in the admin's words.
 */
export function describeStudentErrors(errors: StudentFormErrors): string {
  const names = (Object.keys(errors) as StudentField[]).map((field) => STUDENT_FIELD_LABELS[field]);
  return `Please complete: ${names.join(", ")}`;
}

/**
 * The lowest step holding an error, so a failed submit lands on the right page.
 *
 * @param fields - Fields with errors.
 * @returns The step to show, or `null` when there are none.
 */
export function firstStudentStepWithError(fields: readonly StudentField[]): StudentStep | null {
  if (fields.length === 0) return null;
  return Math.min(...fields.map((field) => STUDENT_FIELD_STEP[field])) as StudentStep;
}

/**
 * Applies a class choice: records the id and inherits the class's grade level.
 * A class with no grade level leaves the current value, so the admin can type one.
 *
 * @param form - The current form.
 * @param classId - The chosen class id.
 * @param gradeLevel - The class's grade level, when it has one.
 * @returns The updated form.
 */
export function withClassChoice(
  form: StudentFormState,
  classId: string,
  gradeLevel: string | undefined,
): StudentFormState {
  return { ...form, classId, gradeLevel: gradeLevel ?? form.gradeLevel };
}

/**
 * Builds the two request bodies from the form.
 *
 * @param form - The validated form.
 * @param schoolId - The school the account is registered in.
 * @returns The account body and the student-record body.
 */
export function buildStudentCreateInput(form: StudentFormState, schoolId: string): CreateStudentInput {
  const relationship = form.relationship as ParentRelationship;
  return {
    account: {
      email: form.email.trim(),
      role: "student",
      schoolId,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim(),
    },
    profile: {
      classId: form.classId,
      gradeLevel: form.gradeLevel.trim(),
      parentContact: {
        fullName: `${form.parentFirstName.trim()} ${form.parentLastName.trim()}`.trim(),
        phoneNumber: form.parentPhone.trim(),
        email: form.parentEmail.trim(),
        relationship,
      },
    },
  };
}
